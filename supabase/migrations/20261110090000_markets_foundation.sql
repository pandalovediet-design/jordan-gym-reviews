-- GYM PRD v1.1, stage 1: markets foundation (countries, cities, country managers).
-- Additive only: nothing is dropped or renamed. The old organizations.city text column stays
-- and keeps working; city_id is filled from it automatically. Safe to re-run.

-- ---------------------------------------------------------------------------
-- Countries (markets) and cities
-- ---------------------------------------------------------------------------
create table if not exists public.countries (
  code text primary key check (code ~ '^[A-Z]{2}$'),          -- ISO 3166-1 alpha-2
  name_ar text not null check (char_length(name_ar) between 2 and 60),
  name_en text not null check (char_length(name_en) between 2 and 60),
  market_name text not null check (market_name ~ '^GYM[A-Z]{2}$'), -- GYMJO, GYMSA...
  is_active boolean not null default false,                    -- only active markets are public
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  country_code text not null references public.countries (code) on delete restrict,
  slug text not null check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  name_ar text not null check (char_length(name_ar) between 2 and 60),
  name_en text check (char_length(name_en) <= 60),
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  unique (country_code, slug),
  unique (country_code, name_ar)
);

insert into public.countries (code, name_ar, name_en, market_name, is_active, sort_order) values
  ('JO', 'الأردن', 'Jordan', 'GYMJO', true, 1),
  ('SA', 'السعودية', 'Saudi Arabia', 'GYMSA', false, 2),
  ('EG', 'مصر', 'Egypt', 'GYMEG', false, 3)
on conflict (code) do nothing;

insert into public.cities (country_code, slug, name_ar, name_en, sort_order) values
  ('JO', 'amman', 'عمّان', 'Amman', 1),
  ('JO', 'irbid', 'إربد', 'Irbid', 2),
  ('JO', 'zarqa', 'الزرقاء', 'Zarqa', 3),
  ('JO', 'balqa', 'البلقاء', 'Balqa', 4),
  ('JO', 'madaba', 'مادبا', 'Madaba', 5),
  ('JO', 'karak', 'الكرك', 'Karak', 6),
  ('JO', 'aqaba', 'العقبة', 'Aqaba', 7),
  ('JO', 'maan', 'معان', 'Ma''an', 8),
  ('JO', 'tafilah', 'الطفيلة', 'Tafilah', 9),
  ('JO', 'jerash', 'جرش', 'Jerash', 10),
  ('JO', 'ajloun', 'عجلون', 'Ajloun', 11),
  ('JO', 'mafraq', 'المفرق', 'Mafraq', 12)
on conflict do nothing;

alter table public.countries enable row level security;
alter table public.cities enable row level security;

drop policy if exists countries_public_read on public.countries;
create policy countries_public_read on public.countries for select to anon, authenticated
  using (is_active);
drop policy if exists countries_admin_all on public.countries;
create policy countries_admin_all on public.countries for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

drop policy if exists cities_public_read on public.cities;
create policy cities_public_read on public.cities for select to anon, authenticated
  using (exists (select 1 from public.countries c where c.code = country_code and c.is_active));
drop policy if exists cities_admin_all on public.cities;
create policy cities_admin_all on public.cities for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Link every organization to its market and city
-- ---------------------------------------------------------------------------
alter table public.organizations
  add column if not exists country_code text not null default 'JO' references public.countries (code) on delete restrict,
  add column if not exists city_id uuid references public.cities (id) on delete set null;

create index if not exists organizations_market_idx on public.organizations (country_code, status, city_id);

-- Keep city_id in step with the existing city text (the app still writes the text).
create or replace function public.organizations_sync_city() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' or new.city is distinct from old.city or new.country_code is distinct from old.country_code then
    new.city_id := (select c.id from public.cities c where c.country_code = new.country_code and c.name_ar = new.city);
  end if;
  return new;
end $$;
revoke execute on function public.organizations_sync_city() from public, anon, authenticated;

drop trigger if exists organizations_sync_city_trg on public.organizations;
create trigger organizations_sync_city_trg
  before insert or update of city, country_code on public.organizations
  for each row execute function public.organizations_sync_city();

update public.organizations o
   set city_id = c.id
  from public.cities c
 where o.city_id is null and c.country_code = o.country_code and c.name_ar = o.city;

-- ---------------------------------------------------------------------------
-- Country managers: full review powers inside their own market only
-- ---------------------------------------------------------------------------
create table if not exists public.country_managers (
  user_id uuid not null references auth.users (id) on delete cascade,
  country_code text not null references public.countries (code) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, country_code)
);
alter table public.country_managers enable row level security;

drop policy if exists country_managers_admin_all on public.country_managers;
create policy country_managers_admin_all on public.country_managers for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
drop policy if exists country_managers_read_own on public.country_managers;
create policy country_managers_read_own on public.country_managers for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_country_manager(p_country text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.country_managers
     where user_id = (select auth.uid()) and country_code = p_country
  )
$$;

drop policy if exists orgs_country_manager_read on public.organizations;
create policy orgs_country_manager_read on public.organizations for select to authenticated
  using (public.is_country_manager(country_code));
drop policy if exists orgs_country_manager_update on public.organizations;
create policy orgs_country_manager_update on public.organizations for update to authenticated
  using (public.is_country_manager(country_code))
  with check (public.is_country_manager(country_code));

-- Guard (replaces the previous version, same rules plus markets):
--  * owners still cannot publish, suspend, verify, re-type or move an organization to another market;
--  * a country manager may approve / reject / suspend inside their market, nothing else is unlocked
--    (the verified badge stays with the platform admin).
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
    if not exists (select 1 from public.countries c where c.code = new.country_code and c.is_active) then
      raise exception 'market is not open' using errcode = '42501';
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
    new.country_code := old.country_code;
    if new.status is distinct from old.status and not public.is_country_manager(old.country_code) then
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
