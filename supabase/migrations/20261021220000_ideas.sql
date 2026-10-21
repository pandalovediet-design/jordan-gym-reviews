-- Growth ideas: member streaks, monthly votes (gym / coach of the month), org tour video link.

alter table public.organizations add column video_url text
  check (video_url is null or (char_length(video_url) <= 300 and video_url ~* '^https://(www\.)?(youtube\.com|youtu\.be|instagram\.com|tiktok\.com)/'));

-- Weekly streak: consecutive weeks (Mon-start, Jordan time) with at least 2 check-ins.
create function public.get_member_streak(p_token uuid)
returns table (total_visits bigint, streak_weeks int, best_weeks int)
language sql stable security definer set search_path = '' as $$
  with me as (
    select m.id from public.org_members m
    join public.organizations o on o.id = m.organization_id
    where m.access_token = p_token and o.status = 'published'
  ), wk as (
    select date_trunc('week', c.checked_in_at at time zone 'Asia/Amman')::date as w
    from public.member_checkins c
    where c.member_id = (select id from me)
    group by 1 having count(*) >= 2
  ), grp as (
    select w, w - (row_number() over (order by w))::int * 7 as g from wk
  ), runs as (
    select g, count(*)::int as len, max(w) as last_w from grp group by g
  )
  select (select count(*) from public.member_checkins c where c.member_id = (select id from me)),
         coalesce((select len from runs
                   where last_w >= date_trunc('week', now() at time zone 'Asia/Amman')::date - 7
                   order by last_w desc limit 1), 0),
         coalesce((select max(len) from runs), 0)
  where exists (select 1 from me)
$$;
revoke execute on function public.get_member_streak(uuid) from public;
grant execute on function public.get_member_streak(uuid) to anon, authenticated;

-- Monthly votes: one vote per account per category per month; accounts must be at least a day old.
create table public.monthly_votes (
  id uuid primary key default gen_random_uuid(),
  vote_month date not null default date_trunc('month', now() at time zone 'Asia/Amman')::date,
  voter_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category text not null check (category in ('gym', 'coach')),
  nominee_org_id uuid not null references public.organizations (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (vote_month, voter_id, category)
);
create index monthly_votes_nominee_idx on public.monthly_votes (vote_month, nominee_org_id);

create function public.monthly_votes_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  t public.org_type;
begin
  new.voter_id := (select auth.uid());
  new.vote_month := date_trunc('month', now() at time zone 'Asia/Amman')::date;
  if new.voter_id is null then raise exception 'login required' using errcode = '42501'; end if;
  select o.type into t from public.organizations o where o.id = new.nominee_org_id and o.status = 'published';
  if t is null then raise exception 'nominee not found' using errcode = '23514'; end if;
  if (new.category = 'gym' and t <> 'gym') or (new.category = 'coach' and t <> 'independent_coach') then
    raise exception 'nominee category mismatch' using errcode = '23514';
  end if;
  if public.is_org_member(new.nominee_org_id) then
    raise exception 'cannot vote for your own organization' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.users u where u.id = new.voter_id and u.created_at <= now() - interval '1 day') then
    raise exception 'account too new to vote' using errcode = '42501';
  end if;
  return new;
end $$;
revoke execute on function public.monthly_votes_guard() from public, anon, authenticated;
create trigger monthly_votes_guard_trg before insert on public.monthly_votes
  for each row execute function public.monthly_votes_guard();

alter table public.monthly_votes enable row level security;
create policy monthly_votes_own_read on public.monthly_votes for select to authenticated using (voter_id = (select auth.uid()));
create policy monthly_votes_insert on public.monthly_votes for insert to authenticated with check (true);
create policy monthly_votes_own_delete on public.monthly_votes for delete to authenticated using (voter_id = (select auth.uid()));
grant select, insert, delete on public.monthly_votes to authenticated;

create function public.get_vote_results(p_category text, p_month date default null)
returns table (slug text, name_ar text, city text, votes bigint)
language sql stable security definer set search_path = '' as $$
  select o.slug, o.name_ar, o.city, count(*) as votes
  from public.monthly_votes v
  join public.organizations o on o.id = v.nominee_org_id and o.status = 'published'
  where v.category = p_category
    and v.vote_month = coalesce(p_month, date_trunc('month', now() at time zone 'Asia/Amman')::date)
  group by o.id order by votes desc, o.name_ar limit 10
$$;
revoke execute on function public.get_vote_results(text, date) from public;
grant execute on function public.get_vote_results(text, date) to anon, authenticated;
