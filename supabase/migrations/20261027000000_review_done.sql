-- Admin review workflow: pages imported in bulk start as "not done"; the admin marks each one done after completing its data.
alter table public.organizations add column if not exists review_done_at timestamptz;
comment on column public.organizations.review_done_at is 'Set by admin when the page data was manually reviewed/completed (null = not done)';
create index if not exists organizations_review_done_idx on public.organizations (review_done_at);
