-- Richer trainer cards, an independent-coach profile, and coach <-> gym links (coach requests, gym approves).

alter table public.org_trainers add column education text check (char_length(education) <= 80);
alter table public.org_trainers add column education_place text check (char_length(education_place) <= 80);
alter table public.org_trainers add column is_head boolean not null default false;

-- One profile per independent coach (single source for the card shown in every gym that lists them).
create table public.coach_profiles (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  role_label text check (char_length(role_label) <= 60),
  experience_years smallint check (experience_years between 0 and 60),
  education text check (char_length(education) <= 80),
  education_place text check (char_length(education_place) <= 80),
  specialties text check (char_length(specialties) <= 200),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger coach_profiles_set_updated_at before update on public.coach_profiles
  for each row execute function public.set_updated_at();

create function public.coach_profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.org_type_of(new.organization_id) <> 'independent_coach' then
    raise exception 'only independent coaches have a coach profile' using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.coach_profiles_guard() from public, anon, authenticated;
create trigger coach_profiles_guard_trg before insert or update on public.coach_profiles
  for each row execute function public.coach_profiles_guard();

alter table public.coach_profiles enable row level security;
create policy coach_profiles_public_read on public.coach_profiles for select to anon, authenticated
  using (public.org_is_published(organization_id));
create policy coach_profiles_member_rw on public.coach_profiles for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
grant select on public.coach_profiles to anon;
grant select, insert, update, delete on public.coach_profiles to authenticated;

-- Links between a gym and an independent coach.
create table public.coach_gym_links (
  id uuid primary key default gen_random_uuid(),
  gym_org_id uuid not null references public.organizations (id) on delete cascade,
  coach_org_id uuid not null references public.organizations (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique (gym_org_id, coach_org_id),
  check (gym_org_id <> coach_org_id)
);
create index coach_gym_links_coach_idx on public.coach_gym_links (coach_org_id);

create function public.coach_gym_links_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p public.coach_profiles%rowtype;
begin
  if tg_op = 'INSERT' then
    if public.org_type_of(new.gym_org_id) <> 'gym' then
      raise exception 'target is not a gym' using errcode = '23514';
    end if;
    if public.org_type_of(new.coach_org_id) <> 'independent_coach' then
      raise exception 'requester is not an independent coach' using errcode = '23514';
    end if;
    if not public.is_platform_admin() then
      if not public.is_org_member(new.coach_org_id) then
        raise exception 'not allowed' using errcode = '42501';
      end if;
      new.status := 'pending';
      new.approved_at := null;
    end if;
    select * into p from public.coach_profiles where organization_id = new.coach_org_id;
    if not found or p.experience_years is null or coalesce(p.education, '') = '' or coalesce(p.specialties, '') = ''
       or not exists (select 1 from public.organization_media m where m.organization_id = new.coach_org_id) then
      raise exception 'coach profile incomplete' using errcode = '23514';
    end if;
  else
    -- updates: only a pending -> approved move, and only by the gym's staff (or the admin)
    if new.gym_org_id is distinct from old.gym_org_id or new.coach_org_id is distinct from old.coach_org_id then
      raise exception 'link parties cannot change' using errcode = '42501';
    end if;
    if new.status = 'approved' and old.status = 'pending' then
      if not (public.is_org_member(new.gym_org_id) or public.is_platform_admin()) then
        raise exception 'only the gym can approve' using errcode = '42501';
      end if;
      new.approved_at := now();
    elsif new.status is distinct from old.status then
      raise exception 'invalid status change' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.coach_gym_links_guard() from public, anon, authenticated;
create trigger coach_gym_links_guard_trg before insert or update on public.coach_gym_links
  for each row execute function public.coach_gym_links_guard();

alter table public.coach_gym_links enable row level security;
create policy coach_gym_links_read on public.coach_gym_links for select to authenticated
  using (public.is_org_member(gym_org_id) or public.is_org_member(coach_org_id) or public.is_platform_admin());
create policy coach_gym_links_insert on public.coach_gym_links for insert to authenticated
  with check (public.is_org_member(coach_org_id) or public.is_platform_admin());
create policy coach_gym_links_update on public.coach_gym_links for update to authenticated
  using (public.is_org_member(gym_org_id) or public.is_platform_admin())
  with check (public.is_org_member(gym_org_id) or public.is_platform_admin());
create policy coach_gym_links_delete on public.coach_gym_links for delete to authenticated
  using (public.is_org_member(gym_org_id) or public.is_org_member(coach_org_id) or public.is_platform_admin());
grant select, insert, update, delete on public.coach_gym_links to authenticated;

-- Public: the approved coaches of a published gym (card data comes from each coach's own page + profile).
create function public.get_gym_coaches(p_gym uuid)
returns table (coach_slug text, name_ar text, bio_ar text, role_label text, experience_years smallint,
               education text, education_place text, specialties text, photo_path text)
language sql stable security definer set search_path = '' as $$
  select c.slug, c.name_ar, c.description_ar, p.role_label, p.experience_years, p.education, p.education_place, p.specialties,
         (select m.storage_path from public.organization_media m where m.organization_id = c.id
          order by m.is_cover desc, m.sort_order limit 1)
  from public.coach_gym_links l
  join public.organizations g on g.id = l.gym_org_id and g.status = 'published'
  join public.organizations c on c.id = l.coach_org_id and c.status = 'published'
  left join public.coach_profiles p on p.organization_id = c.id
  where l.gym_org_id = p_gym and l.status = 'approved'
  order by l.approved_at
$$;
revoke execute on function public.get_gym_coaches(uuid) from public;
grant execute on function public.get_gym_coaches(uuid) to anon, authenticated;

-- Public: the gyms a (published) coach is approved at.
create function public.get_coach_gyms(p_coach uuid)
returns table (gym_slug text, gym_name text)
language sql stable security definer set search_path = '' as $$
  select g.slug, g.name_ar
  from public.coach_gym_links l
  join public.organizations g on g.id = l.gym_org_id and g.status = 'published'
  join public.organizations c on c.id = l.coach_org_id and c.status = 'published'
  where l.coach_org_id = p_coach and l.status = 'approved'
  order by l.approved_at
$$;
revoke execute on function public.get_coach_gyms(uuid) from public;
grant execute on function public.get_coach_gyms(uuid) to anon, authenticated;

-- Staff views of their own links with the other side's name (works even while the other page is a draft).
create function public.list_gym_coach_links(p_gym uuid)
returns table (link_id uuid, status text, coach_name text, coach_slug text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id, l.status, c.name_ar, c.slug, l.created_at
  from public.coach_gym_links l join public.organizations c on c.id = l.coach_org_id
  where l.gym_org_id = p_gym and (public.is_org_member(p_gym) or public.is_platform_admin())
  order by l.created_at desc
$$;
revoke execute on function public.list_gym_coach_links(uuid) from public, anon;
grant execute on function public.list_gym_coach_links(uuid) to authenticated;

create function public.list_coach_gym_links(p_coach uuid)
returns table (link_id uuid, status text, gym_name text, gym_slug text, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select l.id, l.status, g.name_ar, g.slug, l.created_at
  from public.coach_gym_links l join public.organizations g on g.id = l.gym_org_id
  where l.coach_org_id = p_coach and (public.is_org_member(p_coach) or public.is_platform_admin())
  order by l.created_at desc
$$;
revoke execute on function public.list_coach_gym_links(uuid) from public, anon;
grant execute on function public.list_coach_gym_links(uuid) to authenticated;
