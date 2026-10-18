-- One main image per product, stored in the org-media bucket under <organization_id>/...
alter table public.products
  add column image_path text
    check (image_path is null or image_path like organization_id::text || '/%');
