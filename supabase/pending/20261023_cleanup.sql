-- NOT APPLIED YET: destructive changes waiting for the owner to confirm in the tool prompt (or run in the Supabase SQL editor).
-- 2) Remove test content that was visible to the public.
delete from public.home_workouts where slug in ('zz-preview-test', 'zz-preview-test-2');
update public.organizations set status = 'draft' where slug = 'coach-9up9' and name_ar = 'نادي ترحيبي';

-- 3) Reviews are off on the platform: close direct writes left over from the old feature (admin policies stay).
drop policy if exists reviews_insert on public.reviews;
drop policy if exists reviews_update_own on public.reviews;
drop policy if exists reports_insert on public.review_reports;

