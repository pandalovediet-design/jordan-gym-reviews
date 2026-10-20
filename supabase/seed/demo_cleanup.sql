-- Removes all demo data created by demo.sql.
begin;
delete from public.ads where title like '[تجريبي]%';
delete from public.partners where name_ar like '[تجريبي]%';
delete from public.trails where slug like 'demo-%';
delete from public.flash_slots where title_ar like '[تجريبي]%';
delete from public.organizations where slug like 'demo-%';
-- menu items, glow/promotions, branches and flash slots of demo orgs cascade with the organization.
-- org_subscriptions, members, programs, inquiries and promotions are removed with their organization (FK cascade).
delete from auth.users where email like '%@example.invalid';
commit;
