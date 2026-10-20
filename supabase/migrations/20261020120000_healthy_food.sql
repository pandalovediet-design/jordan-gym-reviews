-- Healthy food: restaurants, cloud kitchens and home chefs share one type with three categories.
insert into public.org_categories (slug, org_type, name_ar, sort_order) values
  ('healthy-restaurants', 'healthy_food', 'مطاعم أكل صحي', 160),
  ('cloud-kitchens',      'healthy_food', 'مطابخ سحابية',  170),
  ('home-chefs',          'healthy_food', 'طهاة منزليون',  180);
update public.org_categories set name_ar = 'ملاعب تنس وبادل وسكواش' where slug = 'racket-courts';

alter table public.organizations
  add column delivery_modes text[] not null default '{}'
    check (delivery_modes <@ array['own_delivery', 'apps', 'pickup']::text[]),
  add column delivery_areas text check (char_length(delivery_areas) <= 300);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  branch_id uuid,
  section text check (char_length(section) <= 40),
  name_ar text not null check (char_length(name_ar) between 2 and 120),
  description_ar text check (char_length(description_ar) <= 500),
  price_jod numeric(10, 3) not null check (price_jod >= 0),
  calories integer check (calories between 0 and 5000),
  protein_g numeric(5, 1) check (protein_g between 0 and 500),
  carbs_g numeric(5, 1) check (carbs_g between 0 and 1000),
  fat_g numeric(5, 1) check (fat_g between 0 and 500),
  image_path text check (image_path is null or image_path like organization_id::text || '/%'),
  is_available boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (branch_id, organization_id) references public.org_branches (id, organization_id) on delete cascade
);
create index menu_items_org_idx on public.menu_items (organization_id, sort_order);
create trigger menu_items_set_updated_at before update on public.menu_items
  for each row execute function public.set_updated_at();
alter table public.menu_items enable row level security;
create policy menu_items_public_read on public.menu_items for select to anon, authenticated
  using (public.org_is_published(organization_id));
create policy menu_items_member_read on public.menu_items for select to authenticated
  using (public.is_org_member(organization_id));
create policy menu_items_write on public.menu_items for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy menu_items_admin on public.menu_items for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.menu_items to anon;
grant select, insert, update, delete on public.menu_items to authenticated;
