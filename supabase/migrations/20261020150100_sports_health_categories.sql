insert into public.org_categories (slug, org_type, name_ar, sort_order, is_active)
select v.slug, 'sports_health'::public.org_type, v.name_ar, v.sort_order, true
from (values
 ('physiotherapy','علاج طبيعي وتأهيل',300),
 ('sports-medicine','طب رياضي وإصابات',301),
 ('sports-massage','مساج رياضي واستشفاء',302),
 ('chiropractic-cupping','كايروبراكتيك وحجامة',303),
 ('sports-psychology','علم نفس رياضي وأداء',304),
 ('body-analysis','تحليل جسم وفحوصات لياقة',305)
) as v(slug, name_ar, sort_order)
where not exists (select 1 from public.org_categories c where c.slug = v.slug);
