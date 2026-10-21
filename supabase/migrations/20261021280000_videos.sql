-- Videos: platform reviews (admin only, any org) + reels from members (admin-approved). Links only, no uploads.
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('review', 'reel')),
  platform text not null default 'youtube' check (platform in ('youtube', 'instagram', 'tiktok', 'facebook')),
  url text not null check (char_length(url) <= 300 and url ~ '^https://'),
  title_ar text check (char_length(title_ar) between 2 and 80),
  cover_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  views integer not null default 0,
  created_at timestamptz not null default now(),
  check (cover_path is null or cover_path like organization_id::text || '/%')
);
create index videos_public_idx on public.videos (status, kind, created_at desc);
create index videos_org_idx on public.videos (organization_id);
create trigger videos_lock_org before update on public.videos
  for each row execute function public.lock_organization_id();

create function public.videos_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  host text := lower(substring(new.url from '^https://([^/?#]+)'));
begin
  host := regexp_replace(coalesce(host, ''), '^(www\.|m\.|vm\.|vt\.)', '');
  new.platform := case
    when host in ('youtube.com', 'youtu.be') then 'youtube'
    when host = 'instagram.com' then 'instagram'
    when host in ('tiktok.com') then 'tiktok'
    when host in ('facebook.com', 'fb.watch') then 'facebook'
    else null end;
  if new.platform is null then raise exception 'unsupported video link' using errcode = '23514'; end if;
  if tg_op = 'INSERT' then
    new.views := 0;
    if not public.is_platform_admin() then
      if new.kind <> 'reel' then raise exception 'reviews are platform only' using errcode = '42501'; end if;
      new.status := 'pending';
      if (select count(*) from public.videos where organization_id = new.organization_id and kind = 'reel') >= 3 then
        raise exception 'too many videos' using errcode = '23514';
      end if;
    end if;
  elsif not public.is_platform_admin() then
    new.kind := old.kind;
    if coalesce(current_setting('app.view', true), '') <> '1' then new.views := old.views; end if;
    new.status := case when new.url is distinct from old.url then 'pending' else old.status end;
  end if;
  return new;
end $$;
revoke execute on function public.videos_guard() from public, anon, authenticated;
create trigger videos_guard_trg before insert or update on public.videos
  for each row execute function public.videos_guard();

alter table public.videos enable row level security;
create policy videos_public_read on public.videos for select to anon, authenticated
  using (status = 'approved' and public.org_is_published(organization_id));
create policy videos_member_rw on public.videos for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy videos_admin on public.videos for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select on public.videos to anon;
grant select, insert, update, delete on public.videos to authenticated;

create function public.count_video_view(p_id uuid) returns void
language plpgsql volatile security definer set search_path = '' as $$
begin
  perform set_config('app.view', '1', true);
  update public.videos v set views = v.views + 1
  where v.id = p_id and v.status = 'approved' and public.org_is_published(v.organization_id);
  perform set_config('app.view', '', true);
end $$;
revoke execute on function public.count_video_view(uuid) from public;
grant execute on function public.count_video_view(uuid) to anon, authenticated;

create table public.video_reports (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.videos (id) on delete cascade,
  reason text check (char_length(reason) <= 200),
  created_at timestamptz not null default now()
);
alter table public.video_reports enable row level security;
create policy video_reports_admin on public.video_reports for all to authenticated
  using (public.is_platform_admin()) with check (public.is_platform_admin());
grant select, delete on public.video_reports to authenticated;

create function public.report_video(p_id uuid, p_reason text) returns boolean
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.videos where id = p_id and status = 'approved') then return false; end if;
  if (select count(*) from public.video_reports where video_id = p_id) >= 10 then return true; end if;
  insert into public.video_reports (video_id, reason) values (p_id, nullif(left(btrim(coalesce(p_reason, '')), 200), ''));
  return true;
end $$;
revoke execute on function public.report_video(uuid, text) from public;
grant execute on function public.report_video(uuid, text) to anon, authenticated;
