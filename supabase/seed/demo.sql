-- DEMO DATA ONLY. Everything is prefixed so it can be removed with supabase/seed/demo_cleanup.sql.
-- Orgs: slug 'demo-*', names start with [تجريبي]. Users: *@example.invalid
begin;

insert into auth.users (id, instance_id, aud, role, email, raw_user_meta_data, created_at, updated_at)
select u.id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', u.email,
       jsonb_build_object('display_name', u.name), now(), now()
from (values
  ('d0000000-0000-4000-8000-000000000001'::uuid, 'demo-owner@example.invalid', 'مالك تجريبي'),
  ('d0000000-0000-4000-8000-000000000002'::uuid, 'demo-user1@example.invalid', 'سامر'),
  ('d0000000-0000-4000-8000-000000000003'::uuid, 'demo-user2@example.invalid', 'لينا'),
  ('d0000000-0000-4000-8000-000000000004'::uuid, 'demo-user3@example.invalid', 'أحمد')
) as u(id, email, name)
on conflict (id) do nothing;

insert into public.organizations (id, type, slug, name_ar, name_en, description_ar, city, area, address, latitude, longitude, phone, whatsapp, instagram, status, verified_at, created_by) values
 ('e0000000-0000-4000-8000-000000000001','gym','demo-gym-fitzone','[تجريبي] نادي فيت زون','FitZone Demo','نادي تجريبي بأجهزة حديثة، قسم أوزان حرة، وصالة كارديو. مناسب لمعاينة صفحة النادي.','عمّان','عبدون','شارع تجريبي، عبدون',31.9539,35.9106,'+96265000001','+962790000001','fitzone_demo','published', now(),'d0000000-0000-4000-8000-000000000001'),
 ('e0000000-0000-4000-8000-000000000002','independent_coach','demo-coach-omar','[تجريبي] الكابتن عمر','Coach Omar Demo','مدرب شخصي تجريبي: خطط تضخيم وتنشيف وتدريب أونلاين.','عمّان','الجبيهة',null,null,null,null,'+962790000002','coach_omar_demo','published', null,'d0000000-0000-4000-8000-000000000001'),
 ('e0000000-0000-4000-8000-000000000003','sports_facility','demo-facility-arena','[تجريبي] ملاعب أرينا','Arena Demo','ملاعب خماسية ومسبح تجريبي، حجز بالساعة.','إربد','وسط البلد','شارع تجريبي، إربد',32.5556,35.8479,'+96227000003','+962790000003','arena_demo','published', now(),'d0000000-0000-4000-8000-000000000001'),
 ('e0000000-0000-4000-8000-000000000004','store','demo-store-supps','[تجريبي] متجر سبورت ستور','Sport Store Demo','متجر تجريبي لمكملات وملابس وأدوات رياضية.','الزرقاء','الزرقاء الجديدة','شارع تجريبي',32.0728,36.0876,'+96253000004','+962790000004','sportstore_demo','published', null,'d0000000-0000-4000-8000-000000000001')
on conflict (id) do nothing;

-- Hours: Sun-Thu 06:00-23:00, Fri 14:00-22:00, Sat closed
insert into public.organization_hours (organization_id, weekday, opens_at, closes_at, is_closed)
select o.id, d, case when d between 0 and 4 then '06:00'::time when d = 5 then '14:00'::time end,
       case when d between 0 and 4 then '23:00'::time when d = 5 then '22:00'::time end, d = 6
from (values ('e0000000-0000-4000-8000-000000000001'::uuid),('e0000000-0000-4000-8000-000000000002'::uuid),
             ('e0000000-0000-4000-8000-000000000003'::uuid),('e0000000-0000-4000-8000-000000000004'::uuid)) o(id),
     generate_series(0, 6) d
on conflict do nothing;

insert into public.organization_services (organization_id, name_ar, description_ar, price_jod, billing_period, sort_order) values
 ('e0000000-0000-4000-8000-000000000001','اشتراك شهري','دخول كامل للصالة',35,'month',1),
 ('e0000000-0000-4000-8000-000000000001','اشتراك 3 أشهر','وفّر مع الاشتراك الربع سنوي',90,'quarter',2),
 ('e0000000-0000-4000-8000-000000000001','دخول يومي',null,5,'day',3),
 ('e0000000-0000-4000-8000-000000000002','حصة تدريب شخصي','ساعة فردية',15,'session',1),
 ('e0000000-0000-4000-8000-000000000002','برنامج أونلاين','خطة تدريب وغذاء مع متابعة',40,'month',2),
 ('e0000000-0000-4000-8000-000000000003','ملعب خماسي','سعر الساعة',25,'session',1),
 ('e0000000-0000-4000-8000-000000000003','دخول المسبح',null,4,'day',2),
 ('e0000000-0000-4000-8000-000000000003','اشتراك مسبح شهري',null,45,'month',3);

insert into public.offers (organization_id, title_ar, description_ar, discount_percent, starts_at, ends_at) values
 ('e0000000-0000-4000-8000-000000000001','عرض التسجيل','سجّل هالأسبوع واحصل على أسبوع مجاني (عرض تجريبي)',20, now() - interval '1 day', now() + interval '30 days'),
 ('e0000000-0000-4000-8000-000000000003','ساعة مجانية','احجز 4 ساعات واحصل على الخامسة مجاناً (عرض تجريبي)',15, now() - interval '1 day', now() + interval '30 days');

insert into public.products (id, organization_id, category_id, name_ar, brand, price_jod, availability, description_ar, ingredients)
select p.id, 'e0000000-0000-4000-8000-000000000004', c.id, p.name, p.brand, p.price, p.av::public.availability_status, p.descr, p.ingr
from (values
  ('f0000000-0000-4000-8000-000000000001'::uuid, 'supplements', '[تجريبي] واي بروتين 2 كغ', 'ماركة تجريبية', 48.50, 'available', 'منتج تجريبي لمعاينة صفحة المكمل.', 'بروتين مصل اللبن، نكهة، مُحلّي (بيانات تجريبية)'),
  ('f0000000-0000-4000-8000-000000000002'::uuid, 'supplements', '[تجريبي] كرياتين 300 غ', 'ماركة تجريبية', 22.00, 'limited', 'منتج تجريبي.', 'كرياتين مونوهيدرات (بيانات تجريبية)')
) p(id, cat, name, brand, price, av, descr, ingr)
join public.product_categories c on c.slug = p.cat
on conflict (id) do nothing;

insert into public.products (organization_id, category_id, name_ar, brand, price_jod, availability, description_ar)
select 'e0000000-0000-4000-8000-000000000004', c.id, p.name, 'ماركة تجريبية', p.price, 'available', 'منتج تجريبي.'
from (select id from public.product_categories where slug <> 'supplements' order by sort_order limit 3) c
cross join lateral (values ('[تجريبي] منتج رياضي', 12.00)) p(name, price);

-- approve demo supplements (privileged context)
update public.products set moderation_status = 'approved' where id in ('f0000000-0000-4000-8000-000000000001','f0000000-0000-4000-8000-000000000002');

insert into public.reviews (organization_id, user_id, rating, body) values
 ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000002',5,'نادي نظيف وأجهزة ممتازة (تقييم تجريبي).'),
 ('e0000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000003',4,'الأسعار معقولة بس الزحمة مساءً (تقييم تجريبي).'),
 ('e0000000-0000-4000-8000-000000000002','d0000000-0000-4000-8000-000000000004',5,'مدرب محترف وخطة واضحة (تقييم تجريبي).'),
 ('e0000000-0000-4000-8000-000000000003','d0000000-0000-4000-8000-000000000002',3,'الملعب جيد والحجز متأخر أحياناً (تقييم تجريبي).'),
 ('e0000000-0000-4000-8000-000000000004','d0000000-0000-4000-8000-000000000003',4,'توفر منتجات وأسعار حلوة (تقييم تجريبي).');

commit;

-- Demo images (files live in public/demo, served by publicMediaUrl for "demo-*" names)
insert into public.organization_media (organization_id, storage_path, alt_text, sort_order, is_cover)
select o.id, o.id::text || '/demo-' || o.k || '-' || n || '.webp', 'صورة تجريبية ' || n, n - 1, n = 1
from (values
  ('e0000000-0000-4000-8000-000000000001'::uuid, 'gym'),
  ('e0000000-0000-4000-8000-000000000002'::uuid, 'coach'),
  ('e0000000-0000-4000-8000-000000000003'::uuid, 'arena'),
  ('e0000000-0000-4000-8000-000000000004'::uuid, 'store')) o(id, k),
  generate_series(1, 3) n
on conflict (storage_path) do nothing;
