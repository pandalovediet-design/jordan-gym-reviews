-- Ready-made, named series ("سلاسل جاهزة") for من غير جيم / من غير حرمان. Admin-curated ordered lists of item ids. Additive only.
create table public.named_series (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  kind text not null check (kind in ('home', 'nutrition')),
  title_ar text not null check (char_length(title_ar) between 2 and 80),
  description_ar text check (char_length(description_ar) <= 300),
  item_ids uuid[] not null check (cardinality(item_ids) between 1 and 12),
  is_active boolean not null default true,
  sort_order integer not null default 100,
  created_at timestamptz not null default now()
);
create index named_series_list_idx on public.named_series (kind, is_active, sort_order, created_at desc);

alter table public.named_series enable row level security;
create policy named_series_public_read on public.named_series for select to anon, authenticated using (is_active);
create policy named_series_admin on public.named_series for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.named_series to anon;
grant select, insert, update, delete on public.named_series to authenticated;
