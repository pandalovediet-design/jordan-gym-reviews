-- Removes all demo data created by demo.sql.
begin;
delete from public.organizations where slug like 'demo-%';
delete from auth.users where email like '%@example.invalid';
commit;
