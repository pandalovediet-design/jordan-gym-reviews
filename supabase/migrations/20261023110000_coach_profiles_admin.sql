-- Platform admin can fill in a coach's professional profile on their behalf.
create policy coach_profiles_admin_all on public.coach_profiles for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
