-- Growth modules: featured placement (managed by the platform admin), course/offer kinds,
-- and a private members/plans module for each business. Idempotent where practical.

-- ---------------------------------------------------------------------------
-- Featured placement. Only the platform admin writes; the public may read it for published orgs.
-- ---------------------------------------------------------------------------
create table public.org_promotions (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  featured_until timestamptz,
  featured_rank smallint not null default 0 check (featured_rank between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger org_promotions_updated before update on public.org_promotions
  for each row execute function public.set_updated_at();
alter table public.org_promotions enable row level security;

create policy org_promotions_public_read on public.org_promotions for select to anon, authenticated
  using (public.org_is_published(organization_id));
create policy org_promotions_member_read on public.org_promotions for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_promotions_admin_all on public.org_promotions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- Listing view used by search: featured organizations sort first while the subscription is valid.
create view public.organizations_listing with (security_invoker = true) as
select o.id, o.slug, o.name_ar, o.name_en, o.type, o.city, o.area, o.description_ar,
       o.verified_at, o.created_at,
       coalesce(p.featured_until > now(), false) as is_featured,
       coalesce(case when p.featured_until > now() then p.featured_rank end, 0) as featured_rank
from public.organizations o
left join public.org_promotions p on p.organization_id = o.id
where o.status = 'published';
grant select on public.organizations_listing to anon, authenticated;

-- Offers can also be courses/programs.
alter table public.offers
  add column kind text not null default 'offer' check (kind in ('offer', 'course'));

-- ---------------------------------------------------------------------------
-- Members and plans (private to the business; never publicly readable).
-- ---------------------------------------------------------------------------
create table public.membership_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  duration_days integer not null check (duration_days between 1 and 800),
  price_jod numeric(10, 3) check (price_jod >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index membership_plans_org_idx on public.membership_plans (organization_id);

create table public.org_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 80),
  phone text not null check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  plan_id uuid,
  starts_on date not null default current_date,
  ends_on date not null,
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id),
  check (ends_on >= starts_on),
  foreign key (plan_id, organization_id)
    references public.membership_plans (id, organization_id) on delete set null (plan_id)
);
create index org_members_org_end_idx on public.org_members (organization_id, ends_on);
create index org_members_plan_idx on public.org_members (plan_id, organization_id);
create trigger org_members_updated before update on public.org_members
  for each row execute function public.set_updated_at();

create type public.program_kind as enum ('workout', 'nutrition');
create table public.member_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  member_id uuid not null,
  kind public.program_kind not null,
  title text not null check (char_length(title) between 2 and 120),
  body text not null check (char_length(body) between 1 and 20000),
  access_token uuid not null unique default gen_random_uuid(),
  created_at timestamptz not null default now(),
  foreign key (member_id, organization_id)
    references public.org_members (id, organization_id) on delete cascade
);
create index member_programs_member_idx on public.member_programs (member_id, organization_id);

alter table public.membership_plans enable row level security;
alter table public.org_members enable row level security;
alter table public.member_programs enable row level security;

create policy membership_plans_rw on public.membership_plans for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy org_members_rw on public.org_members for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy member_programs_rw on public.member_programs for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

-- A member opens their private plan by its unguessable token; nothing else is exposed.
create function public.get_program_by_token(p_token uuid)
returns table (kind public.program_kind, title text, body text, org_name text, member_name text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.kind, p.title, p.body, o.name_ar, m.full_name, p.created_at
  from public.member_programs p
  join public.organizations o on o.id = p.organization_id
  join public.org_members m on m.id = p.member_id and m.organization_id = p.organization_id
  where p.access_token = p_token and o.status = 'published'
$$;
revoke execute on function public.get_program_by_token(uuid) from public;
grant execute on function public.get_program_by_token(uuid) to anon, authenticated;
