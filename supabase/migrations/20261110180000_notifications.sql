-- GYM PRD v1.1: notifications. A member who saved a place to favourites is told when that place
-- publishes a post or a new offer. Rows are created by triggers only. Safe to re-run.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  kind text not null check (kind in ('post', 'offer')),
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;

drop policy if exists notifications_read_own on public.notifications;
create policy notifications_read_own on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
drop policy if exists notifications_delete_own on public.notifications;
create policy notifications_delete_own on public.notifications for delete to authenticated
  using (user_id = (select auth.uid()));
-- Marking as read goes through this function, so nothing else on the row can be edited.
create or replace function public.mark_notifications_read() returns void
language sql security definer set search_path = '' as $$
  update public.notifications set read_at = now()
   where user_id = (select auth.uid()) and read_at is null
$$;
revoke execute on function public.mark_notifications_read() from public, anon;
grant execute on function public.mark_notifications_read() to authenticated;

create or replace function public.notify_followers() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_kind text := tg_argv[0];
  v_text text;
begin
  if not exists (select 1 from public.organizations o where o.id = new.organization_id and o.status = 'published') then
    return new;
  end if;
  -- The two tables have different columns, so read the text through jsonb.
  v_text := left(coalesce(to_jsonb(new) ->> case when v_kind = 'post' then 'body' else 'title_ar' end, ''), 300);
  if v_text = '' then
    return new;
  end if;
  insert into public.notifications (user_id, organization_id, kind, body)
  select f.user_id, new.organization_id, v_kind, v_text
    from public.user_favorites f
   where f.organization_id = new.organization_id
   limit 5000;
  -- Keep each inbox small: only the latest 100 per member.
  delete from public.notifications n
   where n.organization_id = new.organization_id
     and n.id in (
       select x.id from (
         select id, row_number() over (partition by user_id order by created_at desc) as rn
           from public.notifications
          where user_id in (select user_id from public.user_favorites where organization_id = new.organization_id)
       ) x where x.rn > 100);
  return new;
end $$;
revoke execute on function public.notify_followers() from public, anon, authenticated;

drop trigger if exists business_posts_notify_trg on public.business_posts;
create trigger business_posts_notify_trg after insert on public.business_posts
  for each row execute function public.notify_followers('post');
drop trigger if exists offers_notify_trg on public.offers;
create trigger offers_notify_trg after insert on public.offers
  for each row execute function public.notify_followers('offer');
