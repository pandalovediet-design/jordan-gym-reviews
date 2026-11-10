-- GYM PRD v1.1, stages 3-4 groundwork. Additive only, safe to re-run.
--  * ads are targeted to a market and count impressions (CTR = clicks / impressions);
--  * the platform admin appoints country managers by e-mail.

alter table public.ads
  add column if not exists country_code text not null default 'JO' references public.countries (code) on delete restrict,
  add column if not exists impressions integer not null default 0 check (impressions >= 0);

-- Counts one impression for each live ad shown on a page. Callable by visitors; it can only
-- add 1 to ads that are live right now, at most 10 per call, and returns nothing.
create or replace function public.count_ad_impressions(p_ids uuid[]) returns void
language sql security definer set search_path = '' as $$
  update public.ads
     set impressions = impressions + 1
   where id in (select distinct x from unnest(p_ids[1:10]) as x)
     and is_active and now() between starts_at and ends_at
$$;
revoke execute on function public.count_ad_impressions(uuid[]) from public;
grant execute on function public.count_ad_impressions(uuid[]) to anon, authenticated;

-- Appoint / remove a country manager by account e-mail (platform admin only).
create or replace function public.set_country_manager(p_email text, p_country text, p_on boolean) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select id into v_user from auth.users where lower(email) = lower(trim(p_email)) limit 1;
  if v_user is null then
    return 'no_user';
  end if;
  if p_on then
    insert into public.country_managers (user_id, country_code) values (v_user, p_country)
    on conflict do nothing;
  else
    delete from public.country_managers where user_id = v_user and country_code = p_country;
  end if;
  return 'ok';
end $$;

create or replace function public.list_country_managers()
returns table (user_id uuid, email text, country_code text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select m.user_id, u.email::text, m.country_code, m.created_at
      from public.country_managers m join auth.users u on u.id = m.user_id
     order by m.country_code, m.created_at;
end $$;

revoke execute on function public.set_country_manager(text, text, boolean), public.list_country_managers() from public, anon;
grant execute on function public.set_country_manager(text, text, boolean), public.list_country_managers() to authenticated;
