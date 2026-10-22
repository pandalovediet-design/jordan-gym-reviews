-- Gym badges: owner-declared "has a prayer room / mosque" and "no music".
-- Additive only: two boolean columns + the listing view gets them appended at the END (create or replace view keeps column order).

alter table public.organizations
  add column has_mosque boolean not null default false,
  add column no_music boolean not null default false;

create or replace view public.organizations_listing with (security_invoker = true) as
select o.id, o.slug, o.name_ar, o.name_en, o.type, o.city, o.area, o.description_ar,
       case when o.verified_until is null or o.verified_until > now() then o.verified_at end as verified_at, o.created_at,
       coalesce(p.featured_until > now(), false) as is_featured,
       coalesce(case when p.featured_until > now() then p.featured_rank end, 0) as featured_rank,
       o.category_id, c.slug as category_slug, c.name_ar as category_name,
       o.women_access, o.women_hours_note,
       o.free_trial_note,
       o.latitude, o.longitude,
       coalesce(
         (select min(s.price_jod) from public.organization_services s
           where s.organization_id = o.id and s.is_active and s.price_jod > 0 and s.billing_period = 'month'),
         (select min(s.price_jod) from public.organization_services s
           where s.organization_id = o.id and s.is_active and s.price_jod > 0)
       ) as min_price_jod,
       1 + (select count(*) from public.org_branches b where b.organization_id = o.id and b.is_active and not b.is_main) as branch_count,
       array(select distinct b.city from public.org_branches b
              where b.organization_id = o.id and b.is_active and not b.is_main and b.city is not null) as branch_cities,
       exists (select 1 from public.org_branches b where b.organization_id = o.id and b.is_active and b.women_access = 'women_only') as branch_women_only,
       exists (select 1 from public.org_branches b where b.organization_id = o.id and b.is_active and b.women_access = 'women_hours') as branch_women_hours,
       coalesce((select jsonb_agg(jsonb_build_object('lat', b.latitude, 'lng', b.longitude))
                  from public.org_branches b
                  where b.organization_id = o.id and b.is_active and not b.is_main and b.latitude is not null), '[]'::jsonb) as branch_points,
       case when p.glow_until > now() then p.glow_color end as glow_color,
       o.has_mosque, o.no_music
from public.organizations o
left join public.org_promotions p on p.organization_id = o.id
left join public.org_categories c on c.id = o.category_id
where o.status = 'published';
grant select on public.organizations_listing to anon, authenticated;
