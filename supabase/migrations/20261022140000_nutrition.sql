-- "من غير حرمان": public nutrition videos and written plans (admin-managed) + products shown under each item. Additive only.

create table public.nutrition_items (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  title_ar text not null check (char_length(title_ar) between 2 and 80),
  meal text not null check (meal in ('breakfast','lunch','dinner','snack','drink')),
  kind text not null default 'video' check (kind in ('video','plan')),
  summary_ar text check (char_length(summary_ar) <= 300),
  body_ar text check (char_length(body_ar) <= 6000),
  video_url text check (video_url is null or (char_length(video_url) <= 300 and video_url ~ '^https://')),
  platform text check (platform in ('youtube', 'instagram', 'tiktok', 'facebook')),
  cover_path text check (cover_path is null or char_length(cover_path) <= 200),
  calories integer check (calories between 0 and 5000),
  protein_g integer check (protein_g between 0 and 400),
  carbs_g integer check (carbs_g between 0 and 800),
  fat_g integer check (fat_g between 0 and 400),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  check (video_url is not null or body_ar is not null)
);
create index nutrition_items_list_idx on public.nutrition_items (is_active, meal, sort_order, created_at desc);

create function public.nutrition_items_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare host text;
begin
  if new.video_url is null then
    new.platform := null;
  else
    host := lower(substring(new.video_url from '^https://([^/?#]+)'));
    host := regexp_replace(coalesce(host, ''), '^(www\.|m\.|vm\.|vt\.)', '');
    new.platform := case
      when host in ('youtube.com', 'youtu.be') then 'youtube'
      when host = 'instagram.com' then 'instagram'
      when host = 'tiktok.com' then 'tiktok'
      when host in ('facebook.com', 'fb.watch') then 'facebook'
      else null end;
    if new.platform is null then raise exception 'unsupported video link' using errcode = '23514'; end if;
  end if;
  return new;
end $$;
revoke execute on function public.nutrition_items_guard() from public, anon, authenticated;
create trigger nutrition_items_guard_trg before insert or update on public.nutrition_items
  for each row execute function public.nutrition_items_guard();

alter table public.nutrition_items enable row level security;
create policy nutrition_items_public_read on public.nutrition_items for select to anon, authenticated using (is_active);
create policy nutrition_items_admin on public.nutrition_items for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.nutrition_items to anon;
grant select, insert, update, delete on public.nutrition_items to authenticated;

create table public.nutrition_products (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.nutrition_items (id) on delete cascade,
  name_ar text not null check (char_length(name_ar) between 2 and 80),
  store_label text check (char_length(store_label) <= 40),
  price_text text check (char_length(price_text) <= 30),
  image_path text check (image_path is null or char_length(image_path) <= 200),
  url text not null check (char_length(url) <= 500 and url ~ '^https://'),
  clicks integer not null default 0,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create index nutrition_products_item_idx on public.nutrition_products (item_id, sort_order);

create function public.nutrition_products_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT'
     and (select count(*) from public.nutrition_products where item_id = new.item_id) >= 4 then
    raise exception 'too many products' using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.nutrition_products_guard() from public, anon, authenticated;
create trigger nutrition_products_guard_trg before insert on public.nutrition_products
  for each row execute function public.nutrition_products_guard();

alter table public.nutrition_products enable row level security;
create policy nutrition_products_public_read on public.nutrition_products for select to anon, authenticated
  using (exists (select 1 from public.nutrition_items i where i.id = item_id and i.is_active));
create policy nutrition_products_admin on public.nutrition_products for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.nutrition_products to anon;
grant select, insert, update, delete on public.nutrition_products to authenticated;
