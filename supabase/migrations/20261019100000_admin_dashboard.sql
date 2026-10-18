-- Read-only helpers for the platform admin dashboard. Each function checks is_platform_admin()
-- itself, so being callable by "authenticated" does not expose anything to normal users.

create function public.admin_list_users()
returns table (
  id uuid, email text, display_name text, created_at timestamptz,
  last_sign_in_at timestamptz, email_confirmed boolean, org_count bigint, is_admin boolean
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select u.id, u.email::text, p.display_name, u.created_at, u.last_sign_in_at,
           (u.email_confirmed_at is not null),
           (select count(*) from public.organization_members m where m.user_id = u.id),
           exists (select 1 from public.platform_admins a where a.user_id = u.id)
    from auth.users u
    left join public.profiles p on p.id = u.id
    order by u.created_at desc
    limit 1000;
end $$;

create function public.admin_stats()
returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select jsonb_build_object(
    'users_total', (select count(*) from auth.users),
    'users_confirmed', (select count(*) from auth.users where email_confirmed_at is not null),
    'users_7d', (select count(*) from auth.users where created_at > now() - interval '7 days'),
    'orgs_by_status', coalesce((select jsonb_object_agg(status, n) from (select status, count(*) n from public.organizations group by status) s), '{}'),
    'orgs_by_type', coalesce((select jsonb_object_agg(type, n) from (select type, count(*) n from public.organizations group by type) s), '{}'),
    'featured_now', (select count(*) from public.org_promotions where featured_until > now()),
    'events_7d', coalesce((select jsonb_object_agg(event_type, n) from (select event_type, count(*) n from public.analytics_events where created_at > now() - interval '7 days' group by event_type) s), '{}'),
    'events_30d', coalesce((select jsonb_object_agg(event_type, n) from (select event_type, count(*) n from public.analytics_events where created_at > now() - interval '30 days' group by event_type) s), '{}'),
    'inquiries_new', (select count(*) from public.inquiries where status = 'new'),
    'members_total', (select count(*) from public.org_members),
    'products_pending', (select count(*) from public.products where moderation_status = 'pending')
  ) into r;
  return r;
end $$;

create function public.admin_top_orgs(p_days integer default 30)
returns table (organization_id uuid, name_ar text, slug text, views bigint, whatsapp bigint, phone bigint, qr bigint)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_platform_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select o.id, o.name_ar, o.slug,
      count(*) filter (where e.event_type = 'page_view'),
      count(*) filter (where e.event_type = 'whatsapp_click'),
      count(*) filter (where e.event_type = 'phone_click'),
      count(*) filter (where e.event_type = 'qr_scan')
    from public.organizations o
    join public.analytics_events e on e.organization_id = o.id
    where e.created_at > now() - make_interval(days => least(greatest(p_days, 1), 365))
    group by o.id, o.name_ar, o.slug
    order by 4 desc
    limit 10;
end $$;

revoke execute on function public.admin_list_users(), public.admin_stats(), public.admin_top_orgs(integer) from public, anon;
grant execute on function public.admin_list_users(), public.admin_stats(), public.admin_top_orgs(integer) to authenticated;
