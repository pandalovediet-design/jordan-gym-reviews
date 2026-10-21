-- Monetization toolkit: public platform stats, sponsor leads, platform discount codes, equipment market.

-- ------------------------------------------------------------------ public stats (aggregates only)
create function public.get_public_stats()
returns table (orgs bigint, cities bigint, views_30d bigint, whatsapp_30d bigint, phone_30d bigint, inquiries_30d bigint)
language sql stable security definer set search_path = '' as $$
  select
    (select count(*) from public.organizations where status = 'published' and slug not like 'demo-%'),
    (select count(distinct city) from public.organizations where status = 'published' and slug not like 'demo-%'),
    (select count(*) from public.analytics_events where event_type = 'page_view' and created_at > now() - interval '30 days'),
    (select count(*) from public.analytics_events where event_type = 'whatsapp_click' and created_at > now() - interval '30 days'),
    (select count(*) from public.analytics_events where event_type = 'phone_click' and created_at > now() - interval '30 days'),
    (select count(*) from public.inquiries where created_at > now() - interval '30 days')
$$;
revoke execute on function public.get_public_stats() from public;
grant execute on function public.get_public_stats() to anon, authenticated;

-- ------------------------------------------------------------------ sponsor leads
create table public.sponsor_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 80),
  company text check (char_length(company) <= 80),
  phone text not null check (phone ~ '^\+?[0-9]{7,15}$'),
  package text check (char_length(package) <= 60),
  message text check (char_length(message) <= 600),
  created_at timestamptz not null default now()
);
alter table public.sponsor_leads enable row level security;
create policy sponsor_leads_admin on public.sponsor_leads for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select, delete on public.sponsor_leads to authenticated;

create function public.submit_sponsor_lead(p_name text, p_company text, p_phone text, p_package text, p_message text)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.sponsor_leads where created_at > now() - interval '1 hour') >= 20 then
    return false; -- global flood guard
  end if;
  insert into public.sponsor_leads (name, company, phone, package, message)
  values (btrim(p_name), nullif(btrim(coalesce(p_company, '')), ''), btrim(p_phone), nullif(btrim(coalesce(p_package, '')), ''), nullif(btrim(coalesce(p_message, '')), ''));
  return true;
end $$;
revoke execute on function public.submit_sponsor_lead(text, text, text, text, text) from public;
grant execute on function public.submit_sponsor_lead(text, text, text, text, text) to anon, authenticated;

-- ------------------------------------------------------------------ platform discount codes
create table public.offer_codes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title_ar text not null check (char_length(title_ar) between 2 and 80),
  code text not null check (char_length(code) between 2 and 30 and code ~ '^[A-Za-z0-9_-]+$'),
  details_ar text check (char_length(details_ar) <= 200),
  ends_at timestamptz,
  is_active boolean not null default true,
  reveals integer not null default 0,
  created_at timestamptz not null default now()
);
create index offer_codes_org_idx on public.offer_codes (organization_id);
create trigger offer_codes_lock_org before update on public.offer_codes
  for each row execute function public.lock_organization_id();

create function public.offer_codes_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    new.reveals := 0;
    if (select count(*) from public.offer_codes where organization_id = new.organization_id) >= 10 then
      raise exception 'too many codes' using errcode = '23514';
    end if;
  elsif new.reveals is distinct from old.reveals and coalesce(current_setting('app.reveal', true), '') <> '1' then
    new.reveals := old.reveals; -- counter is only moved by reveal_offer_code
  end if;
  return new;
end $$;
revoke execute on function public.offer_codes_guard() from public, anon, authenticated;
create trigger offer_codes_guard_trg before insert or update on public.offer_codes
  for each row execute function public.offer_codes_guard();

alter table public.offer_codes enable row level security;
create policy offer_codes_member_rw on public.offer_codes for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy offer_codes_admin on public.offer_codes for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select, insert, update, delete on public.offer_codes to authenticated;

-- Public list never contains the code itself.
create function public.list_public_codes(p_org uuid default null)
returns table (id uuid, org_slug text, org_name text, org_city text, title_ar text, details_ar text, ends_at timestamptz, reveals integer)
language sql stable security definer set search_path = '' as $$
  select c.id, o.slug, o.name_ar, o.city, c.title_ar, c.details_ar, c.ends_at, c.reveals
  from public.offer_codes c join public.organizations o on o.id = c.organization_id and o.status = 'published'
  where c.is_active and (c.ends_at is null or c.ends_at > now()) and (p_org is null or c.organization_id = p_org)
  order by c.created_at desc limit 60
$$;
revoke execute on function public.list_public_codes(uuid) from public;
grant execute on function public.list_public_codes(uuid) to anon, authenticated;

create function public.reveal_offer_code(p_id uuid) returns text
language plpgsql volatile security definer set search_path = '' as $$
declare
  v text;
begin
  perform set_config('app.reveal', '1', true);
  update public.offer_codes c set reveals = c.reveals + 1
  from public.organizations o
  where c.id = p_id and o.id = c.organization_id and o.status = 'published'
    and c.is_active and (c.ends_at is null or c.ends_at > now())
  returning c.code into v;
  perform set_config('app.reveal', '', true);
  return v;
end $$;
revoke execute on function public.reveal_offer_code(uuid) from public;
grant execute on function public.reveal_offer_code(uuid) to anon, authenticated;

-- ------------------------------------------------------------------ equipment market
create table public.equipment_listings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title_ar text not null check (char_length(title_ar) between 3 and 80),
  description_ar text check (char_length(description_ar) <= 600),
  condition text not null check (condition in ('new', 'like_new', 'used')),
  kind text not null check (kind in ('sale', 'swap')),
  price_jod numeric(10, 2) check (price_jod >= 0 and price_jod <= 1000000),
  swap_for text check (char_length(swap_for) <= 120),
  image_path text,
  status text not null default 'active' check (status in ('active', 'sold', 'removed')),
  expires_at timestamptz not null default now() + interval '30 days',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'swap' or price_jod is not null),
  check (image_path is null or image_path like organization_id::text || '/%')
);
create index equipment_listings_active_idx on public.equipment_listings (status, expires_at desc);
create index equipment_listings_org_idx on public.equipment_listings (organization_id);
create trigger equipment_listings_set_updated_at before update on public.equipment_listings
  for each row execute function public.set_updated_at();
create trigger equipment_listings_lock_org before update on public.equipment_listings
  for each row execute function public.lock_organization_id();

create function public.equipment_listings_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if public.org_type_of(new.organization_id) not in ('gym', 'sports_facility', 'store') then
      raise exception 'market is for gyms, facilities and stores' using errcode = '23514';
    end if;
    if not public.org_is_published(new.organization_id) then
      raise exception 'organization must be published' using errcode = '23514';
    end if;
    if (select count(*) from public.equipment_listings where organization_id = new.organization_id
        and status = 'active' and expires_at > now()) >= 20 then
      raise exception 'too many active listings' using errcode = '23514';
    end if;
    new.status := 'active';
    new.expires_at := now() + interval '30 days';
  else
    if new.status = 'removed' and old.status <> 'removed' and not public.is_platform_admin() then
      raise exception 'only the platform can remove listings' using errcode = '42501';
    end if;
    if old.status = 'removed' and not public.is_platform_admin() then
      raise exception 'listing was removed' using errcode = '42501';
    end if;
    if new.expires_at > now() + interval '30 days' then new.expires_at := now() + interval '30 days'; end if;
  end if;
  return new;
end $$;
revoke execute on function public.equipment_listings_guard() from public, anon, authenticated;
create trigger equipment_listings_guard_trg before insert or update on public.equipment_listings
  for each row execute function public.equipment_listings_guard();

alter table public.equipment_listings enable row level security;
create policy equipment_public_read on public.equipment_listings for select to anon, authenticated
  using (status = 'active' and expires_at > now() and public.org_is_published(organization_id));
create policy equipment_member_rw on public.equipment_listings for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy equipment_admin on public.equipment_listings for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.equipment_listings to anon;
grant select, insert, update, delete on public.equipment_listings to authenticated;

create table public.equipment_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.equipment_listings (id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now()
);
alter table public.equipment_reports enable row level security;
create policy equipment_reports_admin on public.equipment_reports for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select, delete on public.equipment_reports to authenticated;

create function public.report_equipment(p_id uuid, p_reason text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.equipment_listings where id = p_id) then return false; end if;
  if (select count(*) from public.equipment_reports where listing_id = p_id) >= 10 then return true; end if;
  insert into public.equipment_reports (listing_id, reason) values (p_id, nullif(left(btrim(coalesce(p_reason, '')), 200), ''));
  return true;
end $$;
revoke execute on function public.report_equipment(uuid, text) from public;
grant execute on function public.report_equipment(uuid, text) to anon, authenticated;
