-- Anonymous reviews: anyone can review/report without an account. Writes are server-only (service role) with hashed device ids for rate limits.
alter table public.reviews
  alter column user_id drop not null,
  add column ip_hash text,
  add column cookie_hash text;
create index reviews_ip_hash_idx on public.reviews (organization_id, ip_hash, created_at desc) where ip_hash is not null;
create index reviews_cookie_hash_idx on public.reviews (organization_id, cookie_hash, created_at desc) where cookie_hash is not null;

alter table public.review_reports
  alter column reporter_id drop not null,
  add column device_hash text;
create unique index review_reports_device_uidx on public.review_reports (review_id, device_hash) where device_hash is not null;

-- Direct client inserts are closed: reviews and reports go through the server action only.
drop policy if exists reviews_insert on public.reviews;
drop policy if exists reports_insert on public.review_reports;
