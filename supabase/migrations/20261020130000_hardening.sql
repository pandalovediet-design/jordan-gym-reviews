-- Hardening: verified-badge expiry, visitor problem reports, owners can't extend their own verification.

alter table public.organizations add column verified_until timestamptz;

create or replace view public.organizations_listing with (security_invoker = true) as
select o.id, o.slug, o.name_ar, o.name_en, o.type, o.city, o.area, o.description_ar,
       case when o.verified_until is null or o.verified_until > now() then o.verified_at end as verified_at, o.created_at,
       coalesce(p.featured_until > now(), false) as is_featured,
       coalesce(case when p.featured_until > now() then p.featured_rank end, 0) as featured_rank,
       o.category_id, c.slug as category_slug, c.name_ar as category_name,
       o.women_access, o.women_hours_note,
       o.free_trial_note,
       o.latitude, o.longitude,
       coalesce(
         (select min(s.price_jod) from public.organization_services s
           where s.organization_id = o.id and s.is_active and s.price_jod > 0 and s.billing_period = 'month'),
         (select min(s.price_jod) from public.organization_services s
           where s.organization_id = o.id and s.is_active and s.price_jod > 0)
       ) as min_price_jod,
       1 + (select count(*) from public.org_branches b where b.organization_id = o.id and b.is_active and not b.is_main) as branch_count,
       array(select distinct b.city from public.org_branches b
              where b.organization_id = o.id and b.is_active and not b.is_main and b.city is not null) as branch_cities,
       exists (select 1 from public.org_branches b where b.organization_id = o.id and b.is_active and b.women_access = 'women_only') as branch_women_only,
       exists (select 1 from public.org_branches b where b.organization_id = o.id and b.is_active and b.women_access = 'women_hours') as branch_women_hours,
       coalesce((select jsonb_agg(jsonb_build_object('lat', b.latitude, 'lng', b.longitude))
                  from public.org_branches b
                  where b.organization_id = o.id and b.is_active and not b.is_main and b.latitude is not null), '[]'::jsonb) as branch_points,
       case when p.glow_until > now() then p.glow_color end as glow_color
from public.organizations o
left join public.org_promotions p on p.organization_id = o.id
left join public.org_categories c on c.id = o.category_id
where o.status = 'published';
grant select on public.organizations_listing to anon, authenticated;

create or replace function public.organizations_guard()
returns trigger language plpgsql security definer set search_path = '' as $function$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or public.is_platform_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if (select count(*) from public.organizations where created_by = v_uid) >= 5 then
      raise exception 'organization limit reached' using errcode = '53400';
    end if;
    new.status := 'draft';
    new.verified_at := null;
    new.verified_until := null;
    new.created_by := v_uid;
  else
    new.created_by := old.created_by;
    new.verified_at := old.verified_at;
    new.verified_until := old.verified_until;
    new.type := old.type;
    if new.status is distinct from old.status then
      if old.status = 'suspended' or new.status in ('published', 'suspended') then
        raise exception 'status change not allowed' using errcode = '42501';
      end if;
    end if;
    if old.status <> 'draft' and new.slug is distinct from old.slug then
      raise exception 'slug is locked after submission' using errcode = '42501';
    end if;
  end if;
  return new;
end $function$;

-- Visitor reports ("report a problem"): anyone can file one for a published page; only admins can read them.
create table public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  reason text not null check (reason in ('wrong_info', 'fake', 'inappropriate', 'closed', 'other')),
  details text check (char_length(details) <= 500),
  contact text check (char_length(contact) <= 100),
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);
create index listing_reports_org_idx on public.listing_reports (organization_id, created_at);
create index listing_reports_status_idx on public.listing_reports (status, created_at);

create function public.listing_reports_throttle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.listing_reports r
       where r.organization_id = new.organization_id and r.created_at > now() - interval '1 hour') >= 10 then
    raise exception 'too many reports' using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.listing_reports_throttle() from public, anon, authenticated;
create trigger listing_reports_throttle_trg before insert on public.listing_reports
  for each row execute function public.listing_reports_throttle();

alter table public.listing_reports enable row level security;
create policy listing_reports_insert on public.listing_reports for insert to anon, authenticated
  with check (status = 'new' and public.org_is_published(organization_id));
create policy listing_reports_admin on public.listing_reports for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant insert on public.listing_reports to anon;
grant select, insert, update, delete on public.listing_reports to authenticated;
