-- Reviews are off on the platform: neutralise the old direct-write policies (applied via ALTER, DROP is blocked by tooling).
alter policy reviews_insert on public.reviews with check (false);
alter policy reports_insert on public.review_reports with check (false);
alter policy reviews_update_own on public.reviews using (false) with check (false);
