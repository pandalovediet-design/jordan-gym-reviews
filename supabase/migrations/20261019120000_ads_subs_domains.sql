-- Platform-owner modules: homepage ads, per-business subscription records, custom domains.

-- ---------------------------------------------------------------------------
-- Ads sold by the platform owner. Public fields only; money and advertiser contact live in
-- ad_accounting, which only the platform admin can read.
-- ---------------------------------------------------------------------------
create table public.ads (
  id uuid primary key default gen_random_uuid(),
  placement text not null check (placement in ('banner', 'sponsored')),
  title text not null check (char_length(title) between 2 and 120),
  subtitle text check (char_length(subtitle) <= 200),
  image_path text check (image_path ~ '^[A-Za-z0-9/_.-]+$'),
  link_url text not null check (link_url ~* '^https?://' and char_length(link_url) <= 500),
  organization_id uuid references public.organizations (id) on delete set null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_active boolean not null default true,
  clicks integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index ads_org_idx on public.ads (organization_id);
create index ads_live_idx on public.ads (is_active, ends_at);
create trigger ads_updated before update on public.ads
  for each row execute function public.set_updated_at();

create table public.ad_accounting (
  ad_id uuid primary key references public.ads (id) on delete cascade,
  advertiser_name text check (char_length(advertiser_name) <= 120),
  advertiser_phone text check (char_length(advertiser_phone) <= 30),
  price_jod numeric(10, 3) check (price_jod >= 0),
  notes text check (char_length(notes) <= 1000)
);

alter table public.ads enable row level security;
alter table public.ad_accounting enable row level security;
create policy ads_public_read on public.ads for select to anon, authenticated
  using (is_active and now() between starts_at and ends_at);
create policy ads_admin_all on public.ads for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy ad_accounting_admin_all on public.ad_accounting for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('ads', 'ads', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;
create policy ads_media_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'ads');
create policy ads_media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'ads' and public.is_platform_admin());
create policy ads_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'ads' and public.is_platform_admin())
  with check (bucket_id = 'ads' and public.is_platform_admin());
create policy ads_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'ads' and public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Platform subscription records for each business (who paid, how much, until when).
-- ---------------------------------------------------------------------------
create table public.org_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  plan_name text not null check (char_length(plan_name) between 2 and 80),
  amount_jod numeric(10, 3) not null check (amount_jod >= 0),
  paid_at date not null default current_date,
  period_start date not null default current_date,
  period_end date not null,
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  check (period_end >= period_start)
);
create index org_subscriptions_org_idx on public.org_subscriptions (organization_id, period_end desc);
alter table public.org_subscriptions enable row level security;
create policy org_subscriptions_member_read on public.org_subscriptions for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_subscriptions_admin_all on public.org_subscriptions for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- ---------------------------------------------------------------------------
-- Custom domains a business connects (one per business). Only 'verified' rows are public,
-- so the edge proxy can map a host to a page. Owners can request/remove; only admin/service verifies.
-- ---------------------------------------------------------------------------
create table public.org_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null unique references public.organizations (id) on delete cascade,
  domain text not null unique
    check (domain = lower(domain) and domain ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}$'),
  status text not null default 'pending' check (status in ('pending', 'verified', 'failed')),
  verification jsonb,
  created_at timestamptz not null default now(),
  verified_at timestamptz
);
alter table public.org_domains enable row level security;
create policy org_domains_public_read on public.org_domains for select to anon, authenticated
  using (status = 'verified' and public.org_is_published(organization_id));
create policy org_domains_member_read on public.org_domains for select to authenticated
  using (public.is_org_member(organization_id));
create policy org_domains_owner_insert on public.org_domains for insert to authenticated
  with check (status = 'pending' and public.is_org_member(organization_id, array['owner']::public.member_role[]));
create policy org_domains_owner_delete on public.org_domains for delete to authenticated
  using (public.is_org_member(organization_id, array['owner']::public.member_role[]));
create policy org_domains_admin_all on public.org_domains for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
