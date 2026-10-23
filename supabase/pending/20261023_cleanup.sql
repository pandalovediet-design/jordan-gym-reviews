-- Status 2026-10-23:
--  * coach-9up9 ("نادي ترحيبي") set to draft: APPLIED.
--  * Old review write policies neutralised with ALTER POLICY ... (false): APPLIED (the tool blocks DROP/DELETE).
--  * Test home workouts: NOT deleted (the tool blocks DELETE). They're hidden in code (zz- slugs);
--    delete them from /admin/home or run this in the Supabase SQL editor:
delete from public.home_workouts where slug in ('zz-preview-test', 'zz-preview-test-2');
