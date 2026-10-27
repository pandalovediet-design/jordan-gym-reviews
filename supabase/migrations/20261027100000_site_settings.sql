-- One row of platform-wide settings the platform owner edits from /admin/settings
-- (which header tabs show and in what order, homepage blocks, hero text).
create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.site_settings enable row level security;
create policy site_settings_read on public.site_settings for select using (true);
create policy site_settings_admin_insert on public.site_settings for insert with check (public.is_platform_admin());
create policy site_settings_admin_update on public.site_settings for update using (public.is_platform_admin()) with check (public.is_platform_admin());
