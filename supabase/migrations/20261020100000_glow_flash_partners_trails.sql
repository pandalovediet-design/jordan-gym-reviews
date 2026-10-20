-- Colored glow tiers, flash-deal ad slots, partners strip, view-only trails.

-- 1) Glow: admin-granted, time-limited visual tier (gold / blue / green / pink).
alter table public.org_promotions
  add column glow_color text check (glow_color in ('gold', 'blue', 'green', 'pink')),
  add column glow_until timestamptz,
  add check ((glow_color is null) = (glow_until is null));

create or replace view public.organizations_listing with (security_invoker = true) as
select o.id, o.slug, o.name_ar, o.name_en, o.type, o.city, o.area, o.description_ar,
       o.verified_at, o.created_at,
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

-- 2) Flash-deal slots: the admin sells a slot (<= 48h, at most 6 overlapping); the owner fills in the deal.
create table public.flash_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  title_ar text check (char_length(title_ar) between 2 and 80),
  description_ar text check (char_length(description_ar) <= 300),
  discount_percent smallint check (discount_percent between 1 and 90),
  price_jod numeric(10, 3) check (price_jod >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at and ends_at <= starts_at + interval '48 hours')
);
create index flash_slots_time_idx on public.flash_slots (starts_at, ends_at);
create index flash_slots_org_idx on public.flash_slots (organization_id);
create trigger flash_slots_set_updated_at before update on public.flash_slots
  for each row execute function public.set_updated_at();

create function public.flash_slots_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and not public.is_platform_admin() then
    -- owners may only edit the deal content, never the slot itself
    if new.organization_id is distinct from old.organization_id
       or new.starts_at is distinct from old.starts_at
       or new.ends_at is distinct from old.ends_at then
      raise exception 'slot timing is managed by the platform' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'INSERT' or new.starts_at is distinct from old.starts_at or new.ends_at is distinct from old.ends_at then
    if (select count(*) from public.flash_slots s
         where s.id <> new.id and s.starts_at < new.ends_at and s.ends_at > new.starts_at) >= 6 then
      raise exception 'all flash slots are taken for this period' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.flash_slots_guard() from public, anon, authenticated;
create trigger flash_slots_guard_trg before insert or update on public.flash_slots
  for each row execute function public.flash_slots_guard();

alter table public.flash_slots enable row level security;
create policy flash_slots_public_read on public.flash_slots for select to anon, authenticated
  using (title_ar is not null and now() >= starts_at and now() < ends_at and public.org_is_published(organization_id));
create policy flash_slots_member_read on public.flash_slots for select to authenticated
  using (public.is_org_member(organization_id));
create policy flash_slots_member_update on public.flash_slots for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy flash_slots_admin on public.flash_slots for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.flash_slots to anon;
grant select, insert, update, delete on public.flash_slots to authenticated;

-- 3) Partners / sponsors strip (admin-managed; logos live in the public `ads` bucket).
create table public.partners (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  logo_path text not null,
  link_url text check (link_url ~* '^https://'),
  organization_id uuid references public.organizations (id) on delete set null,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  ends_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.partners enable row level security;
create policy partners_public_read on public.partners for select to anon, authenticated
  using (is_active and (ends_at is null or ends_at > now()));
create policy partners_admin on public.partners for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.partners to anon;
grant select, insert, update, delete on public.partners to authenticated;

-- 4) Trails: view-only content managed by the admin.
create table public.trails (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name_ar text not null check (char_length(name_ar) between 2 and 120),
  region text not null check (char_length(region) between 2 and 60),
  trail_type text not null default 'hiking' check (trail_type in ('hiking', 'walking', 'running')),
  difficulty text not null default 'easy' check (difficulty in ('easy', 'moderate', 'hard', 'expert')),
  distance_km numeric(5, 1) check (distance_km > 0 and distance_km <= 500),
  duration_min integer check (duration_min between 1 and 10000),
  elevation_gain_m integer check (elevation_gain_m between 0 and 10000),
  description_ar text check (char_length(description_ar) <= 3000),
  tips_ar text check (char_length(tips_ar) <= 1000),
  maps_url text check (
    char_length(maps_url) <= 500 and
    maps_url ~* '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.|maps\.)?google\.[a-z.]+/maps)'
  ),
  image_path text,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trails_set_updated_at before update on public.trails
  for each row execute function public.set_updated_at();
alter table public.trails enable row level security;
create policy trails_public_read on public.trails for select to anon, authenticated using (is_published);
create policy trails_admin on public.trails for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.trails to anon;
grant select, insert, update, delete on public.trails to authenticated;
