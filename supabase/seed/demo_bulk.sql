-- BULK DEMO DATA (~60 orgs). Removed completely by supabase/seed/demo_cleanup.sql (slug 'demo-%' cascades; users *@example.invalid).
-- Images are the files in public/demo (served for any storage_path whose file name starts with "demo-").
-- Requires the 4 demo users from demo.sql. No analytics events are generated (so real stats stay real).

create temp table _d on commit drop as
with spec(type, kind, prefix, names) as (values
  ('gym'::public.org_type, 'gym', 'نادي ', array['الأبطال','القوة','فيت لايف','بروفيت','آيرون','ألفا','تيتان','النخبة','الفرسان','سبارتا','بلس فت','اكسترا','مودرن','ماكس','إنرجي','أولمبيك','رويال','فلكس']),
  ('independent_coach', 'coach', '', array['الكابتن خالد','الكابتن سامي','الكابتن ريم','الكابتن يزن','الكابتن هبة','الكابتن زياد','الكابتن دانا','الكابتن مالك','الكابتن لجين','الكابتن فادي','الكابتن نور','الكابتن عدي']),
  ('sports_facility', 'arena', '', array['ملاعب النجوم','ملاعب الشرق','أكاديمية الصقور','مجمع الواحة','ملاعب السهم','مسبح الأزرق','ملاعب الريان','مجمع الأمل الرياضي']),
  ('store', 'store', '', array['سبورت زون','بروتين هاوس','فيت شوب','أكتف جير','مكملات الأردن','سبورتس مول']),
  ('nutritionist', 'nutri', '', array['الأخصائية سلمى','الأخصائي عمر','الأخصائية ديما','الأخصائي باسل','الأخصائية رند','الأخصائي طارق']),
  ('healthy_food', 'food', '', array['مطبخ فيت','وجبات ليت','هيلثي بوكس','سلطة وبروتين','ميل بريب الأردن']),
  ('sports_health', 'clinic', '', array['عيادة التأهيل الرياضي','مركز العلاج الطبيعي','ريكفري لاب','كير سبورت','مركز المرونة'])
), cities(i, city, lat, lng, areas) as (values
  (0, 'عمّان', 31.9539, 35.9106, array['عبدون','الجبيهة','الصويفية','تلاع العلي','خلدا','العبدلي','ماركا','طبربور']),
  (1, 'إربد', 32.5556, 35.8479, array['وسط البلد','الحي الشرقي','الحصن']),
  (2, 'الزرقاء', 32.0728, 36.0876, array['الزرقاء الجديدة','الرصيفة']),
  (3, 'العقبة', 29.5321, 35.0063, array['المنطقة الأولى']),
  (4, 'السلط', 32.0392, 35.7272, array['وسط البلد']),
  (5, 'مادبا', 31.7160, 35.7939, array['وسط البلد'])
), flat as (
  select s.type, s.kind, s.prefix, n.name, n.ord::int as ord,
         row_number() over (order by s.type, n.ord) as g
  from spec s, unnest(s.names) with ordinality as n(name, ord)
)
select md5('demo-bulk-' || f.g)::uuid as id, f.type, f.kind, f.ord, f.g,
       'demo-b-' || f.kind || '-' || f.ord as slug,
       '[تجريبي] ' || f.prefix || f.name as name_ar,
       c.city, c.areas[1 + (f.g % array_length(c.areas, 1))] as area,
       round((c.lat + ((f.g * 37) % 100 - 50) / 1500.0)::numeric, 5) as lat,
       round((c.lng + ((f.g * 53) % 100 - 50) / 1500.0)::numeric, 5) as lng
from flat f
join cities c on c.i = (array[0,0,0,1,0,2,0,1,3,0,4,2,0,5,1,0,2,0])[1 + (f.g % 18)];

insert into public.organizations (id, type, slug, name_ar, description_ar, city, area, address, latitude, longitude, phone, whatsapp, instagram, status, verified_at, created_by, women_access, women_hours_note, free_trial_note, license_number, license_authority, video_url, category_id, delivery_modes, delivery_areas)
select d.id, d.type, d.slug, d.name_ar,
  case d.kind
    when 'gym' then 'نادي تجريبي بأجهزة حديثة وصالة أوزان حرة وكارديو ومدربين. بيانات وهمية لمعاينة شكل المنصة.'
    when 'coach' then 'مدرب مستقل تجريبي: تدريب شخصي، تضخيم وتنشيف، وبرامج أونلاين. بيانات وهمية.'
    when 'arena' then 'ملاعب ومرافق رياضية تجريبية بحجز بالساعة وأوقات متاحة ومشغولة. بيانات وهمية.'
    when 'store' then 'متجر تجريبي لمكملات وأدوات وملابس رياضية. بيانات وهمية.'
    when 'nutri' then 'أخصائي تغذية تجريبي: أنظمة للتنشيف والتضخيم ومتابعة أسبوعية. بيانات وهمية.'
    when 'food' then 'مطبخ وجبات صحية تجريبي بسعرات وماكروز واضحة وتوصيل. بيانات وهمية.'
    else 'مركز تأهيل وعلاج طبيعي رياضي تجريبي. بيانات وهمية.' end,
  d.city, d.area, 'شارع تجريبي، ' || d.area, d.lat, d.lng,
  '+9626500' || lpad(d.g::text, 4, '0'), '+962790' || lpad(d.g::text, 6, '0'), 'demo_' || d.kind || d.ord,
  'published'::public.org_status,
  case when d.g % 3 = 0 then now() end,
  'd0000000-0000-4000-8000-000000000001',
  case when d.kind = 'gym' and d.ord in (2, 5, 9) then 'women_only' when d.kind = 'gym' and d.ord in (3, 7, 12, 15) then 'women_hours' when d.kind in ('coach','clinic') and d.ord = 3 then 'women_only' else 'none' end,
  case when d.kind = 'gym' and d.ord in (3, 7, 12, 15) then 'للسيدات: الأحد والثلاثاء 10 صباحاً – 2 ظهراً' end,
  case when d.kind = 'gym' and d.ord % 2 = 0 then 'يوم تجريبي مجاني' end,
  case when d.kind in ('nutri', 'clinic') then 'DEMO-' || d.g end,
  case when d.kind in ('nutri', 'clinic') then 'جهة ترخيص تجريبية' end,
  case when d.kind in ('gym', 'arena') and d.ord % 3 = 1 then 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' end,
  (select c.id from public.org_categories c where c.org_type = d.type and c.is_active order by c.sort_order offset (d.g % greatest((select count(*) from public.org_categories c2 where c2.org_type = d.type and c2.is_active), 1)) limit 1),
  case when d.kind = 'food' then array['own_delivery','apps']::text[] else '{}'::text[] end,
  case when d.kind = 'food' then 'عمّان وضواحيها' end
from _d d;

-- hours
insert into public.organization_hours (organization_id, weekday, opens_at, closes_at, is_closed)
select d.id, w,
  case when w between 0 and 4 then (case d.kind when 'gym' then '06:00' when 'arena' then '08:00' when 'store' then '10:00' when 'food' then '09:00' else '10:00' end)::time when w = 5 then '14:00'::time end,
  case when w between 0 and 4 then (case d.kind when 'gym' then (case when d.ord % 3 = 0 then '23:59' else '23:00' end) when 'arena' then '23:30' when 'store' then '22:00' when 'food' then '21:00' else '18:00' end)::time when w = 5 then '22:00'::time end,
  w = 6 or (w = 5 and d.kind in ('nutri', 'clinic'))
from _d d, generate_series(0, 6) w;

-- services / prices
insert into public.organization_services (organization_id, name_ar, description_ar, price_jod, billing_period, sort_order)
select d.id, s.name, s.descr, s.base + (d.g % 7) * s.step, s.period::public.billing_period, s.so
from _d d join (values
  ('gym','اشتراك شهري','دخول كامل للصالة',25,3,'month',1), ('gym','اشتراك 3 أشهر','وفّر مع الاشتراك الربع سنوي',65,6,'quarter',2), ('gym','اشتراك سنوي',null,200,15,'year',3), ('gym','دخول يومي',null,3,0.5,'day',4),
  ('coach','حصة تدريب شخصي','ساعة فردية',10,2,'session',1), ('coach','برنامج أونلاين','خطة تدريب وغذاء مع متابعة',30,5,'month',2),
  ('arena','ملعب (ساعة)','سعر الساعة',18,2,'session',1), ('arena','اشتراك شهري',null,40,5,'month',2),
  ('nutri','جلسة تقييم أولية','قياس الجسم وتحديد الهدف',15,2,'session',1), ('nutri','نظام غذائي شهري','مع متابعة أسبوعية',35,5,'month',2),
  ('food','باقة أسبوعية','5 وجبات يومياً',45,5,'week',1), ('food','باقة شهرية',null,160,15,'month',2),
  ('clinic','جلسة علاج طبيعي',null,15,3,'session',1), ('clinic','تقييم إصابة',null,10,2,'session',2),
  ('store','خدمة تركيب','تركيب الأجهزة',10,2,'session',1)
) s(kind, name, descr, base, step, period, so) on s.kind = d.kind;

-- cover + gallery images from public/demo
insert into public.organization_media (organization_id, storage_path, alt_text, sort_order, is_cover)
select d.id, d.id::text || '/demo-' || m.f || '-' || m.n || '.webp', 'صورة تجريبية ' || m.n, m.n - 1, m.n = 1
from _d d
join (values ('gym','gym',3),('coach','coach',3),('arena','arena',3),('store','store',3),('nutri','nutri',1),('food','prod',3),('clinic','coach',2)) m0(kind, f, cnt) on m0.kind = d.kind
cross join lateral (select m0.f, g.n from generate_series(1, m0.cnt) g(n)) m;

-- offers
insert into public.offers (organization_id, title_ar, description_ar, discount_percent, starts_at, ends_at)
select d.id, (array['عرض التسجيل','خصم الطلاب','عرض الصيف','عرض الصديق','عرض نهاية الأسبوع'])[1 + d.g % 5],
       'عرض تجريبي لمعاينة شكل العروض', 10 + (d.g % 5) * 5, now() - interval '1 day', now() + ((5 + d.g % 25) || ' days')::interval
from _d d where d.g % 2 = 0;

-- trainers (gyms)
insert into public.org_trainers (organization_id, name_ar, title_ar, bio_ar, experience_years, specialties, photo_path, is_active, sort_order, is_head, education, education_place)
select d.id, (array['الكابتن أحمد','الكابتن ليث','الكابتن سارة','الكابتن مهند','الكابتن رنا','الكابتن بشار'])[1 + (d.g + t) % 6],
       (array['مدرب لياقة','مدرب أوزان','مدربة سيدات'])[1 + t % 3], 'مدرب تجريبي بخبرة ممتازة. بيانات وهمية.', 3 + (d.g + t) % 9,
       (array['تضخيم، قوة','تنشيف، كارديو','كروسفت، لياقة'])[1 + t % 3],
       d.id::text || '/demo-coach-' || (1 + t % 3) || '.webp', true, t, t = 0,
       case when t = 0 then 'بكالوريوس تربية رياضية' end, case when t = 0 then 'الجامعة الأردنية' end
from _d d, generate_series(0, 2) t where d.kind = 'gym';

-- classes (gyms)
insert into public.org_classes (organization_id, title_ar, weekday, starts_at, ends_at, women_only, note, is_active)
select d.id, c.title, c.wd, c.st::time, (c.st::time + interval '1 hour'), d.ord in (2, 5, 9), 'حصة تجريبية', true
from _d d cross join (values ('زومبا',0,'18:00'),('كروسفت',1,'19:00'),('يوغا',2,'17:30'),('سبينينغ',3,'20:00')) c(title, wd, st)
where d.kind = 'gym' and d.ord % 2 = 1;

-- facility slots (arenas): next 3 days
insert into public.facility_slots (organization_id, slot_date, starts_at, ends_at, status, note)
select d.id, (now() at time zone 'Asia/Amman')::date + dd, h::time, (h::time + interval '1 hour'),
       case when (d.g + dd + extract(hour from h::time)::int) % 3 = 0 then 'booked' else 'available' end, null
from _d d, generate_series(0, 2) dd, unnest(array['16:00','17:00','18:00','19:00','20:00','21:00']) h
where d.kind = 'arena';

-- products (stores): 6 each, approved, half with an old price
insert into public.products (organization_id, category_id, name_ar, brand, price_jod, old_price_jod, availability, description_ar, image_path, is_published)
select d.id, pc.id, '[تجريبي] ' || (array['واي بروتين','كرياتين','قفازات تدريب','حبل نط','دمبل 10 كغ','حزام رفع','شيكر','سماعات رياضية','مطاطة مقاومة','ملابس رياضية'])[1 + (d.g + p) % 10],
       'ماركة تجريبية', 8 + ((d.g + p) % 9) * 6, case when p % 2 = 0 then 12 + ((d.g + p) % 9) * 6 + 5 end,
       (array['available','available','limited','available'])[1 + p % 4]::public.availability_status, 'منتج تجريبي.',
       d.id::text || '/demo-prod-' || (1 + (d.g + p) % 5) || '.webp', true
from _d d, generate_series(0, 5) p
join lateral (select id from public.product_categories order by sort_order offset ((d.g + p) % greatest((select count(*) from public.product_categories), 1)) limit 1) pc on true
where d.kind = 'store';
update public.products set moderation_status = 'approved' where name_ar like '[تجريبي]%' and moderation_status <> 'approved';

-- menu (healthy food)
insert into public.menu_items (organization_id, section, name_ar, description_ar, price_jod, calories, protein_g, carbs_g, fat_g, image_path, is_available, sort_order)
select d.id, (array['وجبات رئيسية','سناك','سلطات'])[1 + m % 3], '[تجريبي] ' || (array['دجاج مشوي مع أرز','سلمون وخضار','بول بروتين','ستيك لحم وبطاطا حلوة','ساندويتش تونا','سلطة دجاج','شوفان بالفواكه','زبادي يوناني'])[1 + (d.g + m) % 8],
       'وجبة تجريبية', 3 + (m % 5) * 1.5, 350 + m * 60, 25 + m * 3, 30 + m * 5, 8 + m * 2,
       d.id::text || '/demo-prod-' || (1 + m % 3) || '.webp', true, m
from _d d, generate_series(0, 5) m where d.kind = 'food';

-- (flash deals skipped: the slot guard limits how many can be active; add them from /admin/flash)

-- reviews from the 4 demo users
insert into public.reviews (organization_id, user_id, rating, body)
select d.id, u.id, 3 + ((d.g + u.k) % 3),
       (array['مكان نظيف وتعامل ممتاز (تقييم تجريبي).','الأسعار معقولة لكن الزحمة مساءً (تقييم تجريبي).','تجربة جيدة جداً وأنصح فيه (تقييم تجريبي).','الخدمة سريعة والمكان مرتب (تقييم تجريبي).'])[1 + (d.g + u.k) % 4]
from _d d cross join (values ('d0000000-0000-4000-8000-000000000002'::uuid, 0), ('d0000000-0000-4000-8000-000000000003'::uuid, 1), ('d0000000-0000-4000-8000-000000000004'::uuid, 2)) u(id, k)
where (d.g + u.k) % 3 <> 0;

-- discount codes
insert into public.offer_codes (organization_id, title_ar, code, details_ar, ends_at)
select d.id, (array['خصم 10% على الاشتراك','خصم 15% للطلاب','أسبوع مجاني','خصم 20% أول شهر'])[1 + d.g % 4],
       'JGR' || (10 + d.g % 40), 'كود تجريبي لزوار المنصة', now() + interval '60 days'
from _d d where d.g % 3 <> 1 and d.kind in ('gym', 'store', 'arena', 'coach', 'nutri', 'food');
select set_config('app.reveal', '1', true);
update public.offer_codes set reveals = (abs(hashtext(code || id::text)) % 80) where code like 'JGR%';
select set_config('app.reveal', '', true);

-- equipment market (gyms / facilities / stores)
insert into public.equipment_listings (organization_id, title_ar, description_ar, condition, kind, price_jod, swap_for, image_path)
select d.id, '[تجريبي] ' || (array['تردميل احترافي','دراجة سبينينغ','مجموعة دمبل','بار أولمبي مع أوزان','جهاز صدر','بنش قابل للتعديل','جهاز سحب','كرسي رومانيان','أوزان مطاط'])[1 + (d.g + e) % 9],
       'إعلان تجريبي للمعاينة.', (array['used','like_new','new'])[1 + (d.g + e) % 3], case when (d.g + e) % 3 = 0 then 'swap' else 'sale' end,
       case when (d.g + e) % 3 = 0 then null else 80 + ((d.g + e) % 12) * 40 end,
       case when (d.g + e) % 3 = 0 then 'جهاز كارديو' end,
       d.id::text || '/demo-gym-' || (1 + (d.g + e) % 3) || '.webp'
from _d d, generate_series(0, 1) e where d.kind in ('gym', 'arena', 'store') and d.g % 2 = 1;

-- videos: reels (approved) + admin reviews. Guard trigger blocks non-admin review inserts, so disable it for this seed only.
alter table public.videos disable trigger videos_guard_trg;
insert into public.videos (organization_id, kind, platform, url, title_ar, cover_path, status, views)
select d.id, case when d.kind = 'gym' and d.ord % 3 = 1 then 'review' else 'reel' end, 'youtube',
       'https://www.youtube.com/shorts/dQw4w9WgXcQ', '[تجريبي] ' || (array['جولة سريعة','تمرين الصدر','نصيحة غذائية','قبل وبعد','تحدي الأسبوع'])[1 + d.g % 5],
       d.id::text || '/demo-' || (case d.kind when 'gym' then 'gym' when 'coach' then 'coach' when 'arena' then 'arena' when 'store' then 'store' else 'nutri' end) || '-1.webp',
       'approved', (d.g * 7) % 400
from _d d where d.kind in ('gym', 'coach', 'nutri', 'arena') and d.g % 2 = 0 or (d.kind = 'gym' and d.ord % 3 = 1);
alter table public.videos enable trigger videos_guard_trg;
