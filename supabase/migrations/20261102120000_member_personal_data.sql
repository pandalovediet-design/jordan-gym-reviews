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

drop trigger if exists user_workout_logs_updated_at on public.user_workout_logs;
create trigger user_workout_logs_updated_at
  before update on public.user_workout_logs
  for each row execute function public.set_updated_at();

-- Weekly challenge progress belongs to the signed-in member.
create table if not exists public.user_challenge_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  challenge_id text not null check (challenge_id in ('sessions', 'walks', 'water')),
  progress integer not null default 0 check (progress between 0 and 10),
  updated_at timestamptz not null default now(),
  primary key (user_id, week_start, challenge_id)
);
alter table public.user_challenge_progress enable row level security;
drop policy if exists "Users read own challenge progress" on public.user_challenge_progress;
create policy "Users read own challenge progress" on public.user_challenge_progress
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users insert own challenge progress" on public.user_challenge_progress;
create policy "Users insert own challenge progress" on public.user_challenge_progress
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users update own challenge progress" on public.user_challenge_progress;
create policy "Users update own challenge progress" on public.user_challenge_progress
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
drop trigger if exists user_challenge_progress_updated_at on public.user_challenge_progress;
create trigger user_challenge_progress_updated_at
  before update on public.user_challenge_progress
  for each row execute function public.set_updated_at();
