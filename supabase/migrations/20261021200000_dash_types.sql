-- Per-type dashboard additions: product old price (discount display), facility time slots, coach profile extras.

alter table public.products add column old_price_jod numeric(10, 2) check (old_price_jod is null or old_price_jod > price_jod);

alter table public.coach_profiles add column session_mode text check (session_mode in ('onsite', 'online', 'both'));
alter table public.coach_profiles add column certificates text check (char_length(certificates) <= 300);

create table public.facility_slots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  slot_date date not null,
  starts_at time not null,
  ends_at time not null,
  status text not null default 'available' check (status in ('available', 'booked')),
  note text check (char_length(note) <= 100),
  created_at timestamptz not null default now(),
  check (ends_at > starts_at),
  unique (organization_id, slot_date, starts_at)
);
create index facility_slots_org_date_idx on public.facility_slots (organization_id, slot_date);
create trigger facility_slots_lock_org before update on public.facility_slots
  for each row execute function public.lock_organization_id();

create function public.facility_slots_guard() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    if public.org_type_of(new.organization_id) <> 'sports_facility' then
      raise exception 'slots are for sports facilities only' using errcode = '23514';
    end if;
    if new.slot_date < (now() at time zone 'Asia/Amman')::date - 1 or new.slot_date > (now() at time zone 'Asia/Amman')::date + 60 then
      raise exception 'slot date out of range' using errcode = '23514';
    end if;
    if (select count(*) from public.facility_slots where organization_id = new.organization_id
        and slot_date >= (now() at time zone 'Asia/Amman')::date) >= 300 then
      raise exception 'too many slots' using errcode = '23514';
    end if;
  end if;
  return new;
end $$;
revoke execute on function public.facility_slots_guard() from public, anon, authenticated;
create trigger facility_slots_guard_trg before insert on public.facility_slots
  for each row execute function public.facility_slots_guard();

alter table public.facility_slots enable row level security;
create policy facility_slots_public_read on public.facility_slots for select to anon, authenticated
  using (public.org_is_published(organization_id));
create policy facility_slots_member_rw on public.facility_slots for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
grant select on public.facility_slots to anon;
grant select, insert, update, delete on public.facility_slots to authenticated;
