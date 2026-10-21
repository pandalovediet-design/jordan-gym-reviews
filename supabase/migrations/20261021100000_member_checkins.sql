-- Member QR check-in + a private member page (by unguessable token, no member accounts).

alter table public.org_members add column access_token uuid not null default gen_random_uuid();
alter table public.org_members add constraint org_members_access_token_key unique (access_token);

create table public.member_checkins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  member_id uuid not null,
  checked_in_at timestamptz not null default now(),
  checked_in_by uuid references auth.users (id) on delete set null,
  was_expired boolean not null default false,
  foreign key (member_id, organization_id)
    references public.org_members (id, organization_id) on delete cascade
);
create index member_checkins_org_time_idx on public.member_checkins (organization_id, checked_in_at desc);
create index member_checkins_member_time_idx on public.member_checkins (member_id, checked_in_at desc);

alter table public.member_checkins enable row level security;
-- Staff read and may delete a mistaken entry; inserts only happen through record_checkin().
create policy member_checkins_read on public.member_checkins for select to authenticated
  using (public.is_org_member(organization_id));
create policy member_checkins_delete on public.member_checkins for delete to authenticated
  using (public.is_org_member(organization_id));
grant select, delete on public.member_checkins to authenticated;

-- Staff scans a member's QR: records attendance (once per 8 hours), warns when the subscription has ended.
create function public.record_checkin(p_token uuid)
returns table (member_name text, org_name text, ends_on date, days_left integer, expired boolean, duplicate boolean, checked_in_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare
  m public.org_members%rowtype;
  o_name text;
  today date := (now() at time zone 'Asia/Amman')::date;
  last_at timestamptz;
  exp boolean;
begin
  select * into m from public.org_members where access_token = p_token;
  if not found then raise exception 'member not found' using errcode = 'P0002'; end if;
  if not public.is_org_member(m.organization_id) then raise exception 'not allowed' using errcode = '42501'; end if;
  select name_ar into o_name from public.organizations where id = m.organization_id;
  exp := m.ends_on < today;
  select max(c.checked_in_at) into last_at from public.member_checkins c where c.member_id = m.id;
  if last_at is not null and last_at > now() - interval '8 hours' then
    return query select m.full_name, o_name, m.ends_on, (m.ends_on - today), exp, true, last_at;
    return;
  end if;
  insert into public.member_checkins (organization_id, member_id, checked_in_by, was_expired)
    values (m.organization_id, m.id, (select auth.uid()), exp) returning member_checkins.checked_in_at into last_at;
  return query select m.full_name, o_name, m.ends_on, (m.ends_on - today), exp, false, last_at;
end $$;
revoke execute on function public.record_checkin(uuid) from public, anon;
grant execute on function public.record_checkin(uuid) to authenticated;

-- The member's own page: reachable only with the token; exposes nothing else.
create function public.get_member_by_token(p_token uuid)
returns table (member_name text, org_name text, org_slug text, org_whatsapp text, plan_name text, starts_on date, ends_on date, days_left integer)
language sql stable security definer set search_path = '' as $$
  select m.full_name, o.name_ar, o.slug, o.whatsapp, p.name_ar, m.starts_on, m.ends_on,
         (m.ends_on - (now() at time zone 'Asia/Amman')::date)
  from public.org_members m
  join public.organizations o on o.id = m.organization_id
  left join public.membership_plans p on p.id = m.plan_id and p.organization_id = m.organization_id
  where m.access_token = p_token and o.status = 'published'
$$;
revoke execute on function public.get_member_by_token(uuid) from public;
grant execute on function public.get_member_by_token(uuid) to anon, authenticated;

create function public.get_member_programs(p_token uuid)
returns table (kind public.program_kind, title text, body text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select p.kind, p.title, p.body, p.created_at
  from public.org_members m
  join public.organizations o on o.id = m.organization_id
  join public.member_programs p on p.member_id = m.id and p.organization_id = m.organization_id
  where m.access_token = p_token and o.status = 'published'
  order by p.created_at desc
$$;
revoke execute on function public.get_member_programs(uuid) from public;
grant execute on function public.get_member_programs(uuid) to anon, authenticated;
