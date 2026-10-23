-- Listings added by the platform owner from public sources start as "unclaimed";
-- they flip to claimed when an owner account is linked (admin action).
alter table public.organizations
  add column if not exists is_claimed boolean not null default true;
