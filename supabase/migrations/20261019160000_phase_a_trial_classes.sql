-- Phase A: free-trial note, minimum price in listing view, weekly class schedule (display only).

alter table public.organizations
  add column free_trial_note text check (char_length(free_trial_note) between 2 and 120);

create table public.org_classes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title_ar text not null check (char_length(title_ar) between 2 and 80),
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  starts_at time not null,
  ends_at time,
  women_only boolean not null default false,
  note text check (char_length(note) <= 200),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index org_classes_org_idx on public.org_classes (organization_id, weekday, starts_at);
create trigger org_classes_set_updated_at before update on public.org_classes
  for each row execute function public.set_updated_at();

alter table public.org_classes enable row level security;
create policy org_classes_public_read on public.org_classes for select to anon, authenticated
  using (is_active and public.org_is_published(organization_id));
create policy org_classes_member_read on public.org_classes for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_classes_write on public.org_classes for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));
create policy org_classes_admin on public.org_classes for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.org_classes to anon;
grant select, insert, update, delete on public.org_classes to authenticated;

-- Listing view: append free_trial_note and min_price_jod (cheapest monthly plan, falling back to cheapest priced service).
create or replace view public.organizations_listing with (security_invoker = true) as
select o.id, o.slug, o.name_ar, o.name_en, o.type, o.city, o.area, o.description_ar,
       o.verified_at, o.created_at,
       coalesce(p.featured_until > now(), false) as is_featured,
       coalesce(case when p.featured_until > now() then p.featured_rank end, 0) as featured_rank,
       o.category_id, c.slug as category_slug, c.name_ar as category_name,
       o.women_access, o.women_hours_note,
       o.free_trial_note,
       o.latitude, o.longitude,
       -- cheapest monthly plan if any, otherwise the cheapest priced service
       coalesce(
         (select min(s.price_jod) from public.organization_services s
           where s.organization_id = o.id and s.is_active and s.price_jod > 0 and s.billing_period = 'month'),
         (select min(s.price_jod) from public.organization_services s
           where s.organization_id = o.id and s.is_active and s.price_jod > 0)
       ) as min_price_jod
from public.organizations o
left join public.org_promotions p on p.organization_id = o.id
left join public.org_categories c on c.id = o.category_id
where o.status = 'published';
grant select on public.organizations_listing to anon, authenticated;
