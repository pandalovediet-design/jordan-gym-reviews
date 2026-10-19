-- Branches + trainers.
-- Every organization has one "main" branch row (its own city/phone/maps live on `organizations`),
-- plus any number of extra branches with their own contact details, hours, prices, offers, classes
-- and products. Child rows with branch_id NULL apply to ALL branches.

create table public.org_branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  is_main boolean not null default false,
  city text check (char_length(city) between 2 and 40),
  area text check (char_length(area) <= 60),
  address text check (char_length(address) <= 200),
  phone text check (phone ~ '^\+?[0-9]{7,15}$'),
  whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  maps_url text check (
    char_length(maps_url) <= 500 and
    maps_url ~* '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.|maps\.)?google\.[a-z.]+/maps)'
  ),
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  women_access text not null default 'none' check (women_access in ('none', 'women_only', 'women_hours')),
  women_hours_note text check (char_length(women_hours_note) <= 200),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  check ((latitude is null) = (longitude is null)),
  check (is_main or city is not null)
);
create unique index org_branches_one_main on public.org_branches (organization_id) where is_main;
create index org_branches_org_idx on public.org_branches (organization_id, sort_order);
create trigger org_branches_set_updated_at before update on public.org_branches
  for each row execute function public.set_updated_at();

-- A branch can never be turned into / away from "main".
create function public.org_branches_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' and new.is_main is distinct from old.is_main then
    raise exception 'is_main is immutable' using errcode = '42501';
  end if;
  if tg_op = 'UPDATE' and new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id is immutable' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger org_branches_guard_trg before update on public.org_branches
  for each row execute function public.org_branches_guard();

-- Every new organization gets its main branch automatically.
create function public.organizations_create_main_branch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.org_branches (organization_id, name_ar, is_main) values (new.id, 'الفرع الرئيسي', true);
  return new;
end $$;
revoke execute on function public.organizations_create_main_branch() from public, anon, authenticated;
create trigger organizations_main_branch_trg after insert on public.organizations
  for each row execute function public.organizations_create_main_branch();

insert into public.org_branches (organization_id, name_ar, is_main)
select o.id, 'الفرع الرئيسي', true from public.organizations o
where not exists (select 1 from public.org_branches b where b.organization_id = o.id and b.is_main);

alter table public.org_branches enable row level security;
create policy org_branches_public_read on public.org_branches for select to anon, authenticated
  using (is_active and public.org_is_published(organization_id));
create policy org_branches_member_read on public.org_branches for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_branches_insert on public.org_branches for insert to authenticated
  with check (public.is_org_member(organization_id) and not is_main);
create policy org_branches_update on public.org_branches for update to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy org_branches_delete on public.org_branches for delete to authenticated
  using (public.is_org_member(organization_id) and not is_main);
create policy org_branches_admin on public.org_branches for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.org_branches to anon;
grant select, insert, update, delete on public.org_branches to authenticated;

-- Per-branch content. NULL branch_id = applies to all branches.
alter table public.organization_services add column branch_id uuid;
alter table public.offers add column branch_id uuid;
alter table public.products add column branch_id uuid;
alter table public.org_classes add column branch_id uuid;
alter table public.organization_hours add column branch_id uuid;

alter table public.organization_services add foreign key (branch_id, organization_id)
  references public.org_branches (id, organization_id) on delete cascade;
alter table public.offers add foreign key (branch_id, organization_id)
  references public.org_branches (id, organization_id) on delete cascade;
alter table public.products add foreign key (branch_id, organization_id)
  references public.org_branches (id, organization_id) on delete cascade;
alter table public.org_classes add foreign key (branch_id, organization_id)
  references public.org_branches (id, organization_id) on delete cascade;
alter table public.organization_hours add foreign key (branch_id, organization_id)
  references public.org_branches (id, organization_id) on delete cascade;

-- Hours inserted without a branch default to the organization's main branch.
create function public.organization_hours_default_branch() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.branch_id is null then
    select b.id into new.branch_id from public.org_branches b where b.organization_id = new.organization_id and b.is_main;
  end if;
  return new;
end $$;
revoke execute on function public.organization_hours_default_branch() from public, anon, authenticated;
create trigger organization_hours_default_branch_trg before insert on public.organization_hours
  for each row execute function public.organization_hours_default_branch();

-- Opening hours are always per branch: existing rows move to the main branch.
update public.organization_hours h set branch_id = b.id
from public.org_branches b where b.organization_id = h.organization_id and b.is_main and h.branch_id is null;
alter table public.organization_hours alter column branch_id set not null;
alter table public.organization_hours drop constraint organization_hours_organization_id_weekday_key;
alter table public.organization_hours add constraint organization_hours_branch_weekday_key unique (branch_id, weekday);

create index organization_services_branch_idx on public.organization_services (branch_id);
create index offers_branch_idx on public.offers (branch_id);
create index products_branch_idx on public.products (branch_id);

-- Trainers (branch_id NULL = trains at all branches).
create table public.org_trainers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid,
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  title_ar text check (char_length(title_ar) <= 80),
  bio_ar text check (char_length(bio_ar) <= 1000),
  experience_years smallint check (experience_years between 0 and 60),
  specialties text check (char_length(specialties) <= 200),
  photo_path text check (photo_path is null or photo_path like organization_id::text || '/%'),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (branch_id, organization_id) references public.org_branches (id, organization_id) on delete cascade
);
create index org_trainers_org_idx on public.org_trainers (organization_id, sort_order);
create trigger org_trainers_set_updated_at before update on public.org_trainers
  for each row execute function public.set_updated_at();
alter table public.org_trainers enable row level security;
create policy org_trainers_public_read on public.org_trainers for select to anon, authenticated
  using (is_active and public.org_is_published(organization_id));
create policy org_trainers_member_read on public.org_trainers for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_trainers_write on public.org_trainers for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy org_trainers_admin on public.org_trainers for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.org_trainers to anon;
grant select, insert, update, delete on public.org_trainers to authenticated;

-- Listing view: append branch info (count, every city, women flags, extra-branch coordinates).
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
                  where b.organization_id = o.id and b.is_active and not b.is_main and b.latitude is not null), '[]'::jsonb) as branch_points
from public.organizations o
left join public.org_promotions p on p.organization_id = o.id
left join public.org_categories c on c.id = o.category_id
where o.status = 'published';
grant select on public.organizations_listing to anon, authenticated;
