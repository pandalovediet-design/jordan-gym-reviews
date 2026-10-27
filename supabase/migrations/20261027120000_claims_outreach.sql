-- Self-service claiming of listings imported from public sources, and an outreach log for the platform owner.

-- When the platform owner last messaged this place (outreach page).
alter table public.organizations add column if not exists outreach_at timestamptz;

create table if not exists public.claim_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  contact_name text not null check (char_length(contact_name) between 2 and 80),
  phone text not null check (phone ~ '^\+?[0-9]{7,15}$'),
  role text check (char_length(role) <= 60),
  note text check (char_length(note) <= 500),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists claim_requests_status_idx on public.claim_requests (status, created_at);
create index if not exists claim_requests_org_idx on public.claim_requests (organization_id);
create index if not exists claim_requests_user_idx on public.claim_requests (user_id);
create unique index if not exists claim_requests_one_pending on public.claim_requests (organization_id, user_id) where status = 'pending';

alter table public.claim_requests enable row level security;
-- A signed-in person asks for an unclaimed, published place, for themselves only.
create policy claim_requests_insert on public.claim_requests for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'pending' and decided_at is null
    and exists (select 1 from public.organizations o where o.id = organization_id and o.status = 'published' and o.is_claimed = false)
  );
create policy claim_requests_select on public.claim_requests for select to authenticated
  using (user_id = auth.uid() or public.is_platform_admin());
create policy claim_requests_admin_update on public.claim_requests for update to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
