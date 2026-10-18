-- Jordan Gym Reviews — Phase 1 core schema (identity, businesses, catalog, reviews, analytics)
-- Design notes: see docs/DATABASE.md
-- Rules enforced here: RLS on every table, no organization_id changes after insert,
-- privileged columns (status, verification, moderation) are guarded by triggers,
-- and writes that need rate limiting (inquiries, analytics, audit) go through the server only.

create extension if not exists pg_trgm with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.org_type as enum ('gym', 'independent_coach', 'sports_facility', 'store');
create type public.org_status as enum ('draft', 'pending', 'published', 'suspended');
create type public.member_role as enum ('owner', 'manager', 'staff');
create type public.availability_status as enum ('available', 'limited', 'out_of_stock', 'unknown');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.review_status as enum ('published', 'hidden');
create type public.inquiry_status as enum ('new', 'seen', 'closed');
create type public.billing_period as enum ('session', 'day', 'week', 'month', 'quarter', 'year');
create type public.analytics_event_type as enum
  ('page_view', 'product_view', 'whatsapp_click', 'phone_click', 'inquiry');

-- ---------------------------------------------------------------------------
-- Utility
-- ---------------------------------------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Identity
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 80),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- No policies on purpose: only security definer functions and the service role can read it.
alter table public.platform_admins enable row level security;

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, left(coalesce(new.raw_user_meta_data ->> 'display_name', ''), 80))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.platform_admins where user_id = (select auth.uid())
  )
$$;

-- ---------------------------------------------------------------------------
-- Organizations (gym / independent coach / facility / store share one table)
-- ---------------------------------------------------------------------------
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  type public.org_type not null,
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 3 and 60),
  name_ar text not null check (char_length(name_ar) between 2 and 120),
  name_en text check (char_length(name_en) <= 120),
  description_ar text check (char_length(description_ar) <= 4000),
  city text not null default 'عمّان',
  area text,
  address text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  phone text check (phone ~ '^\+?[0-9]{7,15}$'),
  whatsapp text check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  website text check (website ~* '^https?://'),
  instagram text check (instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  status public.org_status not null default 'draft',
  verified_at timestamptz,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((latitude is null) = (longitude is null))
);

create index organizations_listing_idx on public.organizations (type, status, city);
create index organizations_name_ar_trgm on public.organizations
  using gin (name_ar extensions.gin_trgm_ops);
create index organizations_name_en_trgm on public.organizations
  using gin (name_en extensions.gin_trgm_ops);

create table public.organization_members (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);
create index organization_members_user_idx on public.organization_members (user_id);

-- Membership helpers (security definer so policies never recurse through RLS).
create function public.is_org_member(p_org uuid, p_roles public.member_role[] default null)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = p_org
      and m.user_id = (select auth.uid())
      and (p_roles is null or m.role = any (p_roles))
  )
$$;

create function public.org_is_published(p_org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.organizations where id = p_org and status = 'published'
  )
$$;

create function public.org_type_of(p_org uuid) returns public.org_type
language sql stable security definer set search_path = '' as $$
  select type from public.organizations where id = p_org
$$;

-- Guard: non-admins cannot publish, suspend, verify, re-type or re-assign an organization.
create function public.organizations_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
begin
  -- Service role / SQL editor (no JWT) and platform admins are trusted.
  if v_uid is null or public.is_platform_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if (select count(*) from public.organizations where created_by = v_uid) >= 5 then
      raise exception 'organization limit reached' using errcode = '53400';
    end if;
    new.status := 'draft';
    new.verified_at := null;
    new.created_by := v_uid;
  else
    new.created_by := old.created_by;
    new.verified_at := old.verified_at;
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
end $$;

create trigger organizations_guard_trg
  before insert or update on public.organizations
  for each row execute function public.organizations_guard();

create function public.organizations_add_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.organization_members (organization_id, user_id, role)
  values (new.id, new.created_by, 'owner')
  on conflict do nothing;
  return new;
end $$;

create trigger organizations_add_owner_trg
  after insert on public.organizations
  for each row execute function public.organizations_add_owner();

-- An organization can never be left without an owner.
create function public.ensure_owner_remains() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_losing_owner boolean := false;
begin
  if old.role = 'owner' then
    if tg_op = 'DELETE' then
      v_losing_owner := true;
    elsif new.role <> 'owner' or new.organization_id <> old.organization_id then
      v_losing_owner := true;
    end if;
  end if;

  if v_losing_owner
     and exists (select 1 from public.organizations o where o.id = old.organization_id)
     and not exists (
       select 1 from public.organization_members m
       where m.organization_id = old.organization_id
         and m.role = 'owner'
         and m.user_id <> old.user_id
     ) then
    raise exception 'organization must keep at least one owner' using errcode = '23514';
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end $$;

create trigger organization_members_owner_guard
  before update or delete on public.organization_members
  for each row execute function public.ensure_owner_remains();

-- ---------------------------------------------------------------------------
-- Business details: hours, prices (services), media
-- ---------------------------------------------------------------------------
create table public.organization_hours (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  opens_at time,
  closes_at time, -- may be earlier than opens_at for overnight hours
  is_closed boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (organization_id, weekday),
  check (is_closed or (opens_at is not null and closes_at is not null))
);

create table public.organization_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name_ar text not null check (char_length(name_ar) between 2 and 120),
  description_ar text check (char_length(description_ar) <= 1000),
  price_jod numeric(10, 3) check (price_jod >= 0),
  billing_period public.billing_period,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index organization_services_org_idx on public.organization_services (organization_id, sort_order);

create table public.organization_media (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  storage_path text not null unique,
  alt_text text check (char_length(alt_text) <= 200),
  sort_order integer not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now(),
  check (storage_path like organization_id::text || '/%')
);
create index organization_media_org_idx on public.organization_media (organization_id, sort_order);

-- ---------------------------------------------------------------------------
-- Store catalog
-- ---------------------------------------------------------------------------
create table public.product_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name_ar text not null,
  name_en text not null,
  sort_order integer not null default 0,
  requires_review boolean not null default false
);

-- Reference data (not business data).
insert into public.product_categories (slug, name_ar, name_en, sort_order, requires_review) values
  ('sportswear',     'الملابس الرياضية',       'Sportswear',         1, false),
  ('shoes',          'الأحذية',                'Shoes',              2, false),
  ('weights',        'الأوزان وأدوات التدريب', 'Weights & training', 3, false),
  ('accessories',    'الإكسسوارات',            'Accessories',        4, false),
  ('home-equipment', 'معدات التدريب المنزلي',  'Home equipment',     5, false),
  ('supplements',    'المكملات الغذائية',      'Supplements',        6, true);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  category_id uuid not null references public.product_categories (id),
  name_ar text not null check (char_length(name_ar) between 2 and 160),
  name_en text check (char_length(name_en) <= 160),
  description_ar text check (char_length(description_ar) <= 3000),
  brand text check (char_length(brand) <= 80),
  price_jod numeric(10, 3) not null check (price_jod >= 0),
  size_info text check (char_length(size_info) <= 200),
  manufacturer text check (char_length(manufacturer) <= 120),
  net_size text check (char_length(net_size) <= 60),
  ingredients text check (char_length(ingredients) <= 3000),
  nutrition_facts jsonb,
  availability public.availability_status not null default 'unknown',
  is_published boolean not null default false,
  moderation_status public.moderation_status not null default 'approved',
  price_updated_at timestamptz not null default now(),
  availability_updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);
create index products_org_idx on public.products (organization_id, is_published);
create index products_category_idx on public.products (category_id);
create index products_name_trgm on public.products using gin (name_ar extensions.gin_trgm_ops);

create function public.products_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_requires_review boolean;
  v_privileged boolean := (select auth.uid()) is null or public.is_platform_admin();
begin
  if public.org_type_of(new.organization_id) is distinct from 'store'::public.org_type then
    raise exception 'products can only belong to store organizations' using errcode = '23514';
  end if;

  select requires_review into v_requires_review
  from public.product_categories where id = new.category_id;

  if tg_op = 'INSERT' then
    new.price_updated_at := now();
    new.availability_updated_at := now();
    if not v_privileged then
      new.moderation_status :=
        case when v_requires_review then 'pending' else 'approved' end::public.moderation_status;
    end if;
  else
    new.organization_id := old.organization_id;
    new.price_updated_at :=
      case when new.price_jod is distinct from old.price_jod then now() else old.price_updated_at end;
    new.availability_updated_at :=
      case when new.availability is distinct from old.availability then now() else old.availability_updated_at end;
    if not v_privileged then
      new.moderation_status := old.moderation_status;
      if v_requires_review and (
        new.name_ar is distinct from old.name_ar
        or new.description_ar is distinct from old.description_ar
        or new.ingredients is distinct from old.ingredients
        or new.nutrition_facts is distinct from old.nutrition_facts
        or new.category_id is distinct from old.category_id
      ) then
        new.moderation_status := 'pending';
      end if;
    end if;
  end if;
  return new;
end $$;

create trigger products_guard_trg
  before insert or update on public.products
  for each row execute function public.products_guard();

-- ---------------------------------------------------------------------------
-- Offers (gyms and stores)
-- ---------------------------------------------------------------------------
create table public.offers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid,
  title_ar text not null check (char_length(title_ar) between 2 and 120),
  description_ar text check (char_length(description_ar) <= 1000),
  discount_percent smallint check (discount_percent between 1 and 90),
  offer_price_jod numeric(10, 3) check (offer_price_jod >= 0),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at),
  check (discount_percent is not null or offer_price_jod is not null),
  foreign key (product_id, organization_id)
    references public.products (id, organization_id) on delete cascade
);
create index offers_active_idx on public.offers (organization_id, ends_at);

-- ---------------------------------------------------------------------------
-- Inquiries (written by the server only, so it can rate-limit and de-duplicate)
-- ---------------------------------------------------------------------------
create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid,
  user_id uuid references auth.users (id) on delete set null,
  sender_name text check (char_length(sender_name) <= 80),
  sender_phone text check (sender_phone ~ '^\+?[0-9]{7,15}$'),
  message text check (char_length(message) <= 1000),
  channel text not null default 'form' check (channel in ('form', 'whatsapp', 'phone')),
  idempotency_key text check (char_length(idempotency_key) between 8 and 100),
  status public.inquiry_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, idempotency_key),
  foreign key (product_id, organization_id)
    references public.products (id, organization_id) on delete set null (product_id)
);
create index inquiries_org_idx on public.inquiries (organization_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (char_length(body) <= 2000),
  author_name text not null default '',
  status public.review_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  unique (id, organization_id)
);
create index reviews_org_idx on public.reviews (organization_id, status, created_at desc);

create function public.reviews_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null or public.is_platform_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    if public.is_org_member(new.organization_id) then
      raise exception 'members cannot review their own organization' using errcode = '42501';
    end if;
    new.user_id := v_uid;
    new.status := 'published';
    new.author_name := coalesce(
      nullif((select display_name from public.profiles where id = v_uid), ''),
      'مستخدم'
    );
  else
    new.user_id := old.user_id;
    new.status := old.status;
    new.author_name := old.author_name;
  end if;
  return new;
end $$;

create trigger reviews_guard_trg
  before insert or update on public.reviews
  for each row execute function public.reviews_guard();

create table public.review_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique,
  organization_id uuid not null,
  body text not null check (char_length(body) between 1 and 1500),
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (review_id, organization_id)
    references public.reviews (id, organization_id) on delete cascade
);

create table public.review_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reporter_id uuid not null references auth.users (id) on delete cascade,
  reason text not null check (reason in ('spam', 'abuse', 'fake', 'other')),
  details text check (char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  unique (review_id, reporter_id)
);

create view public.organization_ratings with (security_invoker = true) as
  select organization_id,
         count(*)::int as review_count,
         round(avg(rating)::numeric, 2) as average_rating
  from public.reviews
  where status = 'published'
  group by organization_id;

-- ---------------------------------------------------------------------------
-- Analytics + audit (server-written; no PII, no private message text)
-- ---------------------------------------------------------------------------
create table public.analytics_events (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  product_id uuid,
  event_type public.analytics_event_type not null,
  created_at timestamptz not null default now()
);
create index analytics_events_org_idx on public.analytics_events (organization_id, created_at desc);

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- Generic triggers: updated_at, and organization_id is immutable on child rows
-- ---------------------------------------------------------------------------
create function public.lock_organization_id() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.organization_id is distinct from old.organization_id then
    raise exception 'organization_id cannot be changed' using errcode = '42501';
  end if;
  return new;
end $$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'organization_hours', 'organization_services',
    'products', 'offers', 'inquiries', 'reviews', 'review_responses'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t || '_set_updated_at', t);
  end loop;

  foreach t in array array[
    'organization_hours', 'organization_services', 'organization_media', 'offers',
    'inquiries', 'reviews', 'review_responses'
  ] loop
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.lock_organization_id()',
      t || '_lock_org', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.organization_hours enable row level security;
alter table public.organization_services enable row level security;
alter table public.organization_media enable row level security;
alter table public.product_categories enable row level security;
alter table public.products enable row level security;
alter table public.offers enable row level security;
alter table public.inquiries enable row level security;
alter table public.reviews enable row level security;
alter table public.review_responses enable row level security;
alter table public.review_reports enable row level security;
alter table public.analytics_events enable row level security;
alter table public.audit_logs enable row level security;

-- profiles: private; each user sees and edits only their own row.
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = (select auth.uid()));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- organizations
create policy orgs_public_read on public.organizations for select to anon, authenticated
  using (status = 'published');
create policy orgs_member_read on public.organizations for select to authenticated
  using (public.is_org_member(id));
-- The creator must be able to read the row in the same statement (insert ... returning),
-- which runs before the owner membership row is added by the after-insert trigger.
create policy orgs_creator_read on public.organizations for select to authenticated
  using (created_by = (select auth.uid()));
create policy orgs_insert on public.organizations for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy orgs_update on public.organizations for update to authenticated
  using (public.is_org_member(id, array['owner', 'manager']::public.member_role[]))
  with check (public.is_org_member(id, array['owner', 'manager']::public.member_role[]));

-- organization_members: owners manage the team; members can see it; anyone can leave.
create policy members_select on public.organization_members for select to authenticated
  using (user_id = (select auth.uid()) or public.is_org_member(organization_id));
create policy members_insert on public.organization_members for insert to authenticated
  with check (public.is_org_member(organization_id, array['owner']::public.member_role[]));
create policy members_update on public.organization_members for update to authenticated
  using (public.is_org_member(organization_id, array['owner']::public.member_role[]))
  with check (public.is_org_member(organization_id, array['owner']::public.member_role[]));
create policy members_delete on public.organization_members for delete to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_org_member(organization_id, array['owner']::public.member_role[])
  );

-- hours, services, media: public when the organization is published; owner/manager write.
create policy hours_public_read on public.organization_hours for select to anon, authenticated
  using (public.org_is_published(organization_id));
create policy hours_member_read on public.organization_hours for select to authenticated
  using (public.is_org_member(organization_id));
create policy hours_write on public.organization_hours for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]));

create policy services_public_read on public.organization_services for select to anon, authenticated
  using (is_active and public.org_is_published(organization_id));
create policy services_member_read on public.organization_services for select to authenticated
  using (public.is_org_member(organization_id));
create policy services_write on public.organization_services for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]));

create policy media_public_read on public.organization_media for select to anon, authenticated
  using (public.org_is_published(organization_id));
create policy media_member_read on public.organization_media for select to authenticated
  using (public.is_org_member(organization_id));
create policy media_write on public.organization_media for all to authenticated
  using (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]));

-- categories: public read, admin write (admin policy below).
create policy categories_read on public.product_categories for select to anon, authenticated
  using (true);

-- products and offers: staff can manage day-to-day catalog.
create policy products_public_read on public.products for select to anon, authenticated
  using (is_published and moderation_status = 'approved' and public.org_is_published(organization_id));
create policy products_member_read on public.products for select to authenticated
  using (public.is_org_member(organization_id));
create policy products_write on public.products for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create policy offers_public_read on public.offers for select to anon, authenticated
  using (
    is_active and now() >= starts_at and now() < ends_at
    and public.org_is_published(organization_id)
  );
create policy offers_member_read on public.offers for select to authenticated
  using (public.is_org_member(organization_id));
create policy offers_write on public.offers for all to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- inquiries: members read and triage; creation is server-only (service role).
create policy inquiries_member_read on public.inquiries for select to authenticated
  using (public.is_org_member(organization_id));
create policy inquiries_member_update on public.inquiries for update to authenticated
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- reviews
create policy reviews_public_read on public.reviews for select to anon, authenticated
  using (status = 'published' and public.org_is_published(organization_id));
create policy reviews_own_read on public.reviews for select to authenticated
  using (user_id = (select auth.uid()));
create policy reviews_insert on public.reviews for insert to authenticated
  with check (user_id = (select auth.uid()) and public.org_is_published(organization_id));
create policy reviews_update_own on public.reviews for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy reviews_delete_own on public.reviews for delete to authenticated
  using (user_id = (select auth.uid()));

create policy responses_public_read on public.review_responses for select to anon, authenticated
  using (
    public.org_is_published(organization_id)
    and exists (select 1 from public.reviews r where r.id = review_id and r.status = 'published')
  );
create policy responses_member_read on public.review_responses for select to authenticated
  using (public.is_org_member(organization_id));
create policy responses_insert on public.review_responses for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[])
  );
create policy responses_update on public.review_responses for update to authenticated
  using (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]))
  with check (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]));
create policy responses_delete on public.review_responses for delete to authenticated
  using (public.is_org_member(organization_id, array['owner', 'manager']::public.member_role[]));

create policy reports_insert on public.review_reports for insert to authenticated
  with check (reporter_id = (select auth.uid()) and status = 'open');
create policy reports_read_own on public.review_reports for select to authenticated
  using (reporter_id = (select auth.uid()));

-- analytics: members read their own organization's numbers; writes are server-only.
create policy analytics_member_read on public.analytics_events for select to authenticated
  using (public.is_org_member(organization_id));

-- Platform admin: full access (audit_logs and analytics: read only).
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'organization_members', 'organization_hours',
    'organization_services', 'organization_media', 'product_categories', 'products',
    'offers', 'inquiries', 'reviews', 'review_responses', 'review_reports'
  ] loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_platform_admin()) with check (public.is_platform_admin())',
      t || '_admin_all', t);
  end loop;

  foreach t in array array['analytics_events', 'audit_logs'] loop
    execute format(
      'create policy %I on public.%I for select to authenticated using (public.is_platform_admin())',
      t || '_admin_read', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: public bucket for business images; only owner/manager can write
-- inside their organization's folder (<organization_id>/<file>).
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('org-media', 'org-media', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create function public.storage_org_id(p_name text) returns uuid
language plpgsql immutable set search_path = '' as $$
begin
  return split_part(p_name, '/', 1)::uuid;
exception when others then
  return null;
end $$;

create policy org_media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'org-media');
create policy org_media_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'org-media'
    and public.is_org_member(public.storage_org_id(name), array['owner', 'manager']::public.member_role[])
  );
create policy org_media_update on storage.objects for update to authenticated
  using (
    bucket_id = 'org-media'
    and public.is_org_member(public.storage_org_id(name), array['owner', 'manager']::public.member_role[])
  )
  with check (
    bucket_id = 'org-media'
    and public.is_org_member(public.storage_org_id(name), array['owner', 'manager']::public.member_role[])
  );
create policy org_media_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'org-media'
    and public.is_org_member(public.storage_org_id(name), array['owner', 'manager']::public.member_role[])
  );

-- Internal helper: only used inside security definer triggers.
revoke execute on function public.org_type_of(uuid) from public, anon, authenticated;
