-- DEMO ONLY (removed by demo_cleanup.sql: slug like 'demo-%').
begin;
insert into public.organizations (id, type, slug, name_ar, name_en, description_ar, city, area, address, phone, whatsapp, instagram, status, verified_at, created_by, license_number, license_authority) values
 ('e0000000-0000-4000-8000-000000000005','nutritionist','demo-nutritionist-lina','[تجريبي] الأخصائية لينا للتغذية','Lina Nutrition Demo','أخصائية تغذية تجريبية: أنظمة غذائية للتنشيف والتضخيم، ومتابعة أسبوعية، وبرامج للرياضيين.','عمّان','الصويفية','عيادة تجريبية، الصويفية','+96265000005','+962790000005','lina_nutrition_demo','published', now(),'d0000000-0000-4000-8000-000000000001','DEMO-0000','جهة ترخيص تجريبية')
on conflict (id) do nothing;
insert into public.organization_hours (organization_id, weekday, opens_at, closes_at, is_closed)
select 'e0000000-0000-4000-8000-000000000005', d, case when d between 0 and 4 then '10:00'::time end, case when d between 0 and 4 then '18:00'::time end, d in (5, 6)
from generate_series(0, 6) d on conflict do nothing;
insert into public.organization_services (organization_id, name_ar, description_ar, price_jod, billing_period, sort_order) values
 ('e0000000-0000-4000-8000-000000000005','جلسة تقييم أولية','قياس الجسم وتحديد الهدف',20,'session',1),
 ('e0000000-0000-4000-8000-000000000005','نظام غذائي شهري','نظام مخصص مع متابعة أسبوعية',45,'month',2),
 ('e0000000-0000-4000-8000-000000000005','برنامج رياضيين','نظام للتضخيم أو التنشيف مع المكملات',60,'month',3);
insert into public.organization_media (organization_id, storage_path, alt_text, is_cover, sort_order) values
 ('e0000000-0000-4000-8000-000000000005','e0000000-0000-4000-8000-000000000005/demo-nutri-1.webp','صورة تجريبية للأخصائية',true,0);
commit;
