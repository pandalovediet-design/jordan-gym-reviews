-- Hardening after the first advisor run.

-- Trigger functions must not be callable through the REST/RPC API.
-- Triggers still fire: trigger functions are not subject to the caller's EXECUTE privilege.
revoke execute on function
  public.ensure_owner_remains(),
  public.handle_new_user(),
  public.organizations_add_owner(),
  public.organizations_guard(),
  public.products_guard(),
  public.reviews_guard()
from public, anon, authenticated;

-- Cover foreign keys that had no index.
create index inquiries_product_idx on public.inquiries (product_id, organization_id);
create index inquiries_user_idx on public.inquiries (user_id);
create index offers_product_idx on public.offers (product_id, organization_id);
create index organizations_created_by_idx on public.organizations (created_by);
create index review_reports_reporter_idx on public.review_reports (reporter_id);
create index review_responses_created_by_idx on public.review_responses (created_by);
create index review_responses_review_org_idx on public.review_responses (review_id, organization_id);
create index reviews_user_idx on public.reviews (user_id);
