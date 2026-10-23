-- 1) Per-activity color theme for the public page and the owner dashboard (null = platform default).
alter table public.organizations
  add column if not exists theme text check (theme in ('emerald', 'night', 'gold', 'ocean', 'rose', 'ember'));

-- 2) Covering indexes for foreign keys flagged by the performance advisor.
create index if not exists equipment_reports_listing_idx on public.equipment_reports (listing_id);
create index if not exists member_checkins_by_idx on public.member_checkins (checked_in_by);
create index if not exists member_checkins_member_org_idx on public.member_checkins (member_id, organization_id);
create index if not exists member_files_member_org_idx on public.member_files (member_id, organization_id);
create index if not exists member_files_org_idx on public.member_files (organization_id);
create index if not exists member_programs_org_idx on public.member_programs (organization_id);
create index if not exists menu_items_branch_org_idx on public.menu_items (branch_id, organization_id);
create index if not exists monthly_votes_nominee_org_idx on public.monthly_votes (nominee_org_id);
create index if not exists monthly_votes_voter_idx on public.monthly_votes (voter_id);
create index if not exists offers_branch_org_idx on public.offers (branch_id, organization_id);
create index if not exists org_classes_branch_org_idx on public.org_classes (branch_id, organization_id);
create index if not exists org_trainers_branch_org_idx on public.org_trainers (branch_id, organization_id);
create index if not exists organization_hours_branch_org_idx on public.organization_hours (branch_id, organization_id);
create index if not exists organization_hours_org_idx on public.organization_hours (organization_id);
create index if not exists organization_services_branch_org_idx on public.organization_services (branch_id, organization_id);
create index if not exists partners_org_idx on public.partners (organization_id);
create index if not exists products_branch_org_idx on public.products (branch_id, organization_id);
create index if not exists video_reports_video_idx on public.video_reports (video_id);
