-- Removes all demo data created by demo.sql.
begin;
delete from public.ads where title like '[تجريبي]%';
delete from public.organizations where slug like 'demo-%';
-- org_subscriptions, members, programs, inquiries and promotions are removed with their organization (FK cascade).
delete from auth.users where email like '%@example.invalid';
commit;
