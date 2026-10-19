-- Categories (homepage sections chosen at registration), Pink Zone women-access flag,
-- and a Google Maps link instead of raw coordinates.

create table public.org_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) between 2 and 40),
  org_type public.org_type not null,
  name_ar text not null check (char_length(name_ar) between 2 and 60),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index org_categories_type_idx on public.org_categories (org_type, sort_order);

alter table public.org_categories enable row level security;
create policy org_categories_public_read on public.org_categories for select to anon, authenticated
  using (is_active or public.is_platform_admin());
create policy org_categories_admin_all on public.org_categories for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());

alter table public.organizations
  add column category_id uuid references public.org_categories (id) on delete set null,
  add column women_access text not null default 'none' check (women_access in ('none', 'women_only', 'women_hours')),
  add column women_hours_note text check (char_length(women_hours_note) <= 200),
  add column maps_url text check (
    char_length(maps_url) <= 500 and
    maps_url ~* '^https://(maps\.app\.goo\.gl/|goo\.gl/maps/|(www\.|maps\.)?google\.[a-z.]+/maps)'
  );
create index organizations_category_idx on public.organizations (category_id) where status = 'published';

-- A category must belong to the organization's own type.
create function public.organizations_category_check() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.category_id is not null and not exists (
    select 1 from public.org_categories c where c.id = new.category_id and c.org_type = new.type
  ) then
    raise exception 'category does not match organization type' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger organizations_category_check_trg
  before insert or update of category_id on public.organizations
  for each row execute function public.organizations_category_check();
revoke execute on function public.organizations_category_check() from public, anon, authenticated;

insert into public.org_categories (slug, org_type, name_ar, sort_order) values
  ('iron-gyms',      'gym',             'نوادي حديد وكمال أجسام', 10),
  ('crossfit',       'gym',             'كروس فت',                20),
  ('yoga-pilates',   'gym',             'يوغا وبيلاتس',           30),
  ('martial-arts',   'gym',             'فنون قتالية',            40),
  ('general-fitness','gym',             'نوادي لياقة عامة',       50),
  ('pools',          'sports_facility', 'مسابح',                  60),
  ('football-fields','sports_facility', 'ملاعب كرة قدم',          70),
  ('racket-courts',  'sports_facility', 'ملاعب تنس وبادل',        80),
  ('multi-facilities','sports_facility','منشآت رياضية متعددة',    90),
  ('personal-coaches','independent_coach','مدربون شخصيون',       100),
  ('online-coaches', 'independent_coach','تدريب أونلاين',        110),
  ('supplements',    'store',           'متاجر مكملات',          120),
  ('sportswear',     'store',           'ملابس رياضية',          130),
  ('equipment',      'store',           'أجهزة وأدوات',          140),
  ('nutritionists',  'nutritionist',    'أخصائيو تغذية',         150);

-- Listing view: append the new columns (existing columns keep their positions).
create or replace view public.organizations_listing with (security_invoker = true) as
select o.id, o.slug, o.name_ar, o.name_en, o.type, o.city, o.area, o.description_ar,
       o.verified_at, o.created_at,
       coalesce(p.featured_until > now(), false) as is_featured,
       coalesce(case when p.featured_until > now() then p.featured_rank end, 0) as featured_rank,
       o.category_id, c.slug as category_slug, c.name_ar as category_name,
       o.women_access, o.women_hours_note
from public.organizations o
left join public.org_promotions p on p.organization_id = o.id
left join public.org_categories c on c.id = o.category_id
where o.status = 'published';
grant select on public.organizations_listing to anon, authenticated;
