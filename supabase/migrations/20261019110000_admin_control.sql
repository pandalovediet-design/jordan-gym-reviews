-- Platform admin can manage every business account: the members module tables and the media bucket
-- were missing the admin clauses the earlier tables already have.
create policy membership_plans_admin_all on public.membership_plans for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy org_members_admin_all on public.org_members for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
create policy member_programs_admin_all on public.member_programs for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

create policy org_media_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'org-media' and public.is_platform_admin());
create policy org_media_admin_update on storage.objects for update to authenticated
  using (bucket_id = 'org-media' and public.is_platform_admin())
  with check (bucket_id = 'org-media' and public.is_platform_admin());
create policy org_media_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'org-media' and public.is_platform_admin());
