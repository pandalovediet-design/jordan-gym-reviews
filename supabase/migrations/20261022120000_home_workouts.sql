-- "من غير جيم": public home-workout videos (link-only, admin-managed) + products shown under each video. Additive only.

create table public.home_workouts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title_ar text not null check (char_length(title_ar) between 2 and 80),
  focus text not null check (focus in ('chest','shoulders','biceps','triceps','forearms','abs','back','glutes','quads','hamstrings','calves','full_body','cardio')),
  equipment text not null default 'none' check (equipment in ('none','bands','dumbbell','chair','mat','pullup_bar','other')),
  level text not null default 'beginner' check (level in ('beginner','intermediate','advanced')),
  sets_ar text check (char_length(sets_ar) <= 40),
  summary_ar text check (char_length(summary_ar) <= 300),
  video_url text not null check (char_length(video_url) <= 300 and video_url ~ '^https://'),
  platform text check (platform in ('youtube', 'instagram', 'tiktok', 'facebook')),
  cover_path text check (cover_path is null or char_length(cover_path) <= 200),
  steps_ar text[] not null check (cardinality(steps_ar) between 1 and 8),
  mistake_ar text check (char_length(mistake_ar) <= 200),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create index home_workouts_list_idx on public.home_workouts (is_active, sort_order, created_at desc);

create function public.home_workouts_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  host text;
  s text;
begin
  host := lower(substring(new.video_url from '^https://([^/?#]+)'));
  host := regexp_replace(coalesce(host, ''), '^(www\.|m\.|vm\.|vt\.)', '');
  new.platform := case
    when host in ('youtube.com', 'youtu.be') then 'youtube'
    when host = 'instagram.com' then 'instagram'
    when host = 'tiktok.com' then 'tiktok'
    when host in ('facebook.com', 'fb.watch') then 'facebook'
    else null end;
  if new.platform is null then raise exception 'unsupported video link' using errcode = '23514'; end if;
  foreach s in array new.steps_ar loop
    if char_length(btrim(s)) not between 2 and 200 then
      raise exception 'invalid step' using errcode = '23514';
    end if;
  end loop;
  return new;
end $$;
revoke execute on function public.home_workouts_guard() from public, anon, authenticated;
create trigger home_workouts_guard_trg before insert or update on public.home_workouts
  for each row execute function public.home_workouts_guard();

alter table public.home_workouts enable row level security;
create policy home_workouts_public_read on public.home_workouts for select to anon, authenticated using (is_active);
create policy home_workouts_admin on public.home_workouts for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.home_workouts to anon;
grant select, insert, update, delete on public.home_workouts to authenticated;

create table public.home_workout_products (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references public.home_workouts (id) on delete cascade,
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  store_label text check (char_length(store_label) <= 40),
  price_text text check (char_length(price_text) <= 30),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  url text not null check (char_length(url) <= 500 and url ~ '^https://'),
  clicks integer not null default 0,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create index home_workout_products_workout_idx on public.home_workout_products (workout_id, sort_order);

create function public.home_workout_products_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT'
     and (select count(*) from public.home_workout_products where workout_id = new.workout_id) >= 4 then
    raise exception 'too many products' using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.home_workout_products_guard() from public, anon, authenticated;
create trigger home_workout_products_guard_trg before insert on public.home_workout_products
  for each row execute function public.home_workout_products_guard();

alter table public.home_workout_products enable row level security;
create policy home_products_public_read on public.home_workout_products for select to anon, authenticated
  using (exists (select 1 from public.home_workouts w where w.id = workout_id and w.is_active));
create policy home_products_admin on public.home_workout_products for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.home_workout_products to anon;
grant select, insert, update, delete on public.home_workout_products to authenticated;
-- clicks are counted server-side (service role) by /go/[id]; nobody else can write this column except the admin.
