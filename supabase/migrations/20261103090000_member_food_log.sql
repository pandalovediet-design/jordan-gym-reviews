-- Member account, part 2: food log (no calorie counting), daily water, muscles trained.
-- Member-owned rows only. Safe to re-run.

-- What the member ate per meal, with a one-tap rating. No calories on purpose.
create table if not exists public.user_food_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  meal text not null check (meal in ('breakfast', 'lunch', 'dinner', 'snack')),
  note text not null default '' check (char_length(note) <= 120),
  rating text not null check (rating in ('healthy', 'ok', 'free')),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date, meal)
);
create index if not exists user_food_logs_user_date_idx on public.user_food_logs (user_id, log_date desc);

-- Glasses of water per day (optional feature).
create table if not exists public.user_water_logs (
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null,
  cups integer not null default 0 check (cups between 0 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, log_date)
);

-- Muscles trained in a logged workout (same keys as the exercise library body map).
alter table public.user_workout_logs
  add column if not exists muscles text[] not null default '{}';
alter table public.user_workout_logs drop constraint if exists user_workout_logs_muscles_check;
alter table public.user_workout_logs add constraint user_workout_logs_muscles_check check (
  muscles <@ array['chest', 'shoulders', 'biceps', 'triceps', 'forearms', 'abs', 'back', 'glutes', 'quads', 'hamstrings', 'calves']::text[]
  and cardinality(muscles) <= 11
);

alter table public.user_food_logs enable row level security;
alter table public.user_water_logs enable row level security;

drop policy if exists "Users read own food logs" on public.user_food_logs;
create policy "Users read own food logs" on public.user_food_logs
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users add own food logs" on public.user_food_logs;
create policy "Users add own food logs" on public.user_food_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users update own food logs" on public.user_food_logs;
create policy "Users update own food logs" on public.user_food_logs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users remove own food logs" on public.user_food_logs;
create policy "Users remove own food logs" on public.user_food_logs
  for delete to authenticated using (user_id = (select auth.uid()));

drop policy if exists "Users read own water logs" on public.user_water_logs;
create policy "Users read own water logs" on public.user_water_logs
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists "Users add own water logs" on public.user_water_logs;
create policy "Users add own water logs" on public.user_water_logs
  for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists "Users update own water logs" on public.user_water_logs;
create policy "Users update own water logs" on public.user_water_logs
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists "Users remove own water logs" on public.user_water_logs;
create policy "Users remove own water logs" on public.user_water_logs
  for delete to authenticated using (user_id = (select auth.uid()));

drop trigger if exists user_food_logs_updated_at on public.user_food_logs;
create trigger user_food_logs_updated_at before update on public.user_food_logs
  for each row execute function public.set_updated_at();
drop trigger if exists user_water_logs_updated_at on public.user_water_logs;
create trigger user_water_logs_updated_at before update on public.user_water_logs
  for each row execute function public.set_updated_at();
