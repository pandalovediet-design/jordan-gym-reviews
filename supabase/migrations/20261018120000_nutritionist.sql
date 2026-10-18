-- Adds the "nutritionist" organization type and optional license fields.
-- Verification (verified_at) stays admin-only, enforced by organizations_guard.

alter type public.org_type add value if not exists 'nutritionist';

alter table public.organizations
  add column license_number text check (char_length(license_number) between 2 and 60),
  add column license_authority text check (char_length(license_authority) between 2 and 120);
