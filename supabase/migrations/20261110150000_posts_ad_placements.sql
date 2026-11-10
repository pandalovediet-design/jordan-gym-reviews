-- GYM PRD v1.1: business posts and more ad placements. Safe to re-run; no data is removed.

-- ---------------------------------------------------------------------------
-- Business posts: short updates a place publishes on its own page
-- ---------------------------------------------------------------------------
create table if not exists public.business_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  body text not null check (char_length(body) between 2 and 1000),
  created_at timestamptz not null default now()
);
create index if not exists business_posts_org_idx on public.business_posts (organization_id, created_at desc);
alter table public.business_posts enable row level security;

drop policy if exists business_posts_public_read on public.business_posts;
create policy business_posts_public_read on public.business_posts for select to anon, authenticated
  using (public.org_is_published(organization_id));
drop policy if exists business_posts_member_read on public.business_posts;
create policy business_posts_member_read on public.business_posts for select to authenticated
  using (public.is_org_member(organization_id));
drop policy if exists business_posts_member_insert on public.business_posts;
create policy business_posts_member_insert on public.business_posts for insert to authenticated
  with check (public.is_org_member(organization_id));
drop policy if exists business_posts_member_delete on public.business_posts;
create policy business_posts_member_delete on public.business_posts for delete to authenticated
  using (public.is_org_member(organization_id));
drop policy if exists business_posts_admin_all on public.business_posts;
create policy business_posts_admin_all on public.business_posts for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

-- No spam: at most 5 posts a day per place; posts cannot be edited or moved (delete and re-post).
create or replace function public.business_posts_throttle() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.business_posts p
       where p.organization_id = new.organization_id and p.created_at > now() - interval '1 day') >= 5 then
    raise exception 'too many posts today' using errcode = '23514';
  end if;
  new.created_at := now();
  return new;
end $$;
revoke execute on function public.business_posts_throttle() from public, anon, authenticated;
drop trigger if exists business_posts_throttle_trg on public.business_posts;
create trigger business_posts_throttle_trg before insert on public.business_posts
  for each row execute function public.business_posts_throttle();

-- ---------------------------------------------------------------------------
-- Ads: sponsored search results and sponsored directory sections
-- ---------------------------------------------------------------------------
alter table public.ads drop constraint if exists ads_placement_check;
alter table public.ads add constraint ads_placement_check
  check (placement in ('banner', 'sponsored', 'search', 'category'));
-- For placement = 'category': which directory section it sponsors (null = all sections).
alter table public.ads add column if not exists target_type public.org_type;
