-- Member-owned data for GymJo accounts. No business-owner dashboard access.
create table if not exists public.user_favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, organization_id)
);
create index if not exists user_favorites_user_created_idx
  on public.user_favorites(user_id, created_at desc);

create table if not exists public.user_workout_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_date date not null,
  activity text not null default 'تمرين' check (char_length(activity) between 1 and 80),
  minutes integer not null default 0 check (minutes between 0 and 1440),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, workout_date)
);
create index if not exists user_workout_logs_user_date_idx
  on public.user_workout_logs(user_id, workout_date desc);

alter table public.user_favorites enable row level security;
alter table public.user_workout_logs enable row level security;

drop policy if exists "Users read own favorites" on public.user_favorites;
create policy "Users read own favorites" on public.user_favorites
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users add own favorites" on public.user_favorites;
create policy "Users add own favorites" on public.user_favorites
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users remove own favorites" on public.user_favorites;
create policy "Users remove own favorites" on public.user_favorites
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users read own workout logs" on public.user_workout_logs;
create policy "Users read own workout logs" on public.user_workout_logs
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users add own workout logs" on public.user_workout_logs;
create policy "Users add own workout logs" on public.user_workout_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users update own workout logs" on public.user_workout_logs;
create policy "Users update own workout logs" on public.user_workout_logs
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop policy if exists "Users remove own workout logs" on public.user_workout_logs;
create policy "Users remove own workout logs" on public.user_workout_logs
  for delete to authenticated using (user_id = (select auth.uid()));

create trigger user_workout_logs_updated_at
  before update on public.user_workout_logs
  for each row execute function public.set_updated_at();
