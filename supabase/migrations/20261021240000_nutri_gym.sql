-- Nutritionists can also have a professional profile and partner with any number of gyms (same approval flow as coaches).

create or replace function public.coach_profiles_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if public.org_type_of(new.organization_id) not in ('independent_coach', 'nutritionist') then
    raise exception 'only coaches and nutritionists have a professional profile' using errcode = '23514';
  end if;
  return new;
end $$;

create or replace function public.coach_gym_links_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  p public.coach_profiles%rowtype;
begin
  if tg_op = 'INSERT' then
    if public.org_type_of(new.gym_org_id) <> 'gym' then
      raise exception 'target is not a gym' using errcode = '23514';
    end if;
    if public.org_type_of(new.coach_org_id) not in ('independent_coach', 'nutritionist') then
      raise exception 'requester is not a coach or nutritionist' using errcode = '23514';
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

-- Approved partners (coaches and nutritionists) of a published gym, with their type and contact number.
create function public.get_gym_partners(p_gym uuid)
returns table (partner_type text, coach_slug text, name_ar text, bio_ar text, role_label text, experience_years smallint,
               education text, education_place text, specialties text, certificates text, photo_path text, whatsapp text,
               verified boolean)
language sql stable security definer set search_path = '' as $$
  select c.type::text, c.slug, c.name_ar, c.description_ar, p.role_label, p.experience_years, p.education, p.education_place,
         p.specialties, p.certificates,
         (select m.storage_path from public.organization_media m where m.organization_id = c.id
          order by m.is_cover desc, m.sort_order limit 1),
         c.whatsapp, c.verified_at is not null
  from public.coach_gym_links l
  join public.organizations g on g.id = l.gym_org_id and g.status = 'published'
  join public.organizations c on c.id = l.coach_org_id and c.status = 'published'
  left join public.coach_profiles p on p.organization_id = c.id
  where l.gym_org_id = p_gym and l.status = 'approved'
  order by l.approved_at
$$;
revoke execute on function public.get_gym_partners(uuid) from public;
grant execute on function public.get_gym_partners(uuid) to anon, authenticated;
