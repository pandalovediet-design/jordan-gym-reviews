-- Member page v2: a short coach note + the member's own attendance (by private token).

alter table public.org_members add column coach_note text check (char_length(coach_note) <= 500);

-- New function (the old get_member_by_token stays untouched); this one also returns the coach note.
create function public.get_member_page(p_token uuid)
returns table (member_name text, org_name text, org_slug text, org_whatsapp text, plan_name text, starts_on date, ends_on date, days_left integer, coach_note text)
language sql stable security definer set search_path = '' as $$
  select m.full_name, o.name_ar, o.slug, o.whatsapp, p.name_ar, m.starts_on, m.ends_on,
         (m.ends_on - (now() at time zone 'Asia/Amman')::date), m.coach_note
  from public.org_members m
  join public.organizations o on o.id = m.organization_id
  left join public.membership_plans p on p.id = m.plan_id and p.organization_id = m.organization_id
  where m.access_token = p_token and o.status = 'published'
$$;
revoke execute on function public.get_member_page(uuid) from public;
grant execute on function public.get_member_page(uuid) to anon, authenticated;

-- Last 10 visits (newest first) plus this month's visit count, repeated on each row.
create function public.get_member_attendance(p_token uuid)
returns table (checked_in_at timestamptz, month_count bigint)
language sql stable security definer set search_path = '' as $$
  with me as (
    select m.id from public.org_members m
    join public.organizations o on o.id = m.organization_id
    where m.access_token = p_token and o.status = 'published'
  ), cnt as (
    select count(*) as n from public.member_checkins c
    where c.member_id = (select id from me)
      and (c.checked_in_at at time zone 'Asia/Amman') >= date_trunc('month', now() at time zone 'Asia/Amman')
  )
  select c.checked_in_at, (select n from cnt)
  from public.member_checkins c
  where c.member_id = (select id from me)
  order by c.checked_in_at desc
  limit 10
$$;
revoke execute on function public.get_member_attendance(uuid) from public;
grant execute on function public.get_member_attendance(uuid) to anon, authenticated;
