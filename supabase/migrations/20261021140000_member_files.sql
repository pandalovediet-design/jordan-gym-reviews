-- PDF files a coach attaches to a member (private bucket; the member downloads via a short-lived signed link
-- that the server issues only after checking the member's private token).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('member-files', 'member-files', false, 5242880, array['application/pdf'])
on conflict (id) do nothing;

create policy member_files_staff_read on storage.objects for select to authenticated
  using (bucket_id = 'member-files' and public.is_org_member(public.storage_org_id(name)));
create policy member_files_staff_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'member-files' and public.is_org_member(public.storage_org_id(name)));
create policy member_files_staff_delete on storage.objects for delete to authenticated
  using (bucket_id = 'member-files' and public.is_org_member(public.storage_org_id(name)));

create table public.member_files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  member_id uuid not null,
  title text not null check (char_length(title) between 2 and 120),
  storage_path text not null unique,
  size_bytes integer not null check (size_bytes between 1 and 5242880),
  created_at timestamptz not null default now(),
  check (storage_path like organization_id::text || '/%'),
  foreign key (member_id, organization_id)
    references public.org_members (id, organization_id) on delete cascade
);
create index member_files_member_idx on public.member_files (member_id, created_at desc);

create function public.member_files_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if (select count(*) from public.member_files f where f.member_id = new.member_id) >= 10 then
    raise exception 'too many files for this member' using errcode = '23514';
  end if;
  return new;
end $$;
revoke execute on function public.member_files_limit() from public, anon, authenticated;
create trigger member_files_limit_trg before insert on public.member_files
  for each row execute function public.member_files_limit();

alter table public.member_files enable row level security;
create policy member_files_rw on public.member_files for all to authenticated
  using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
grant select, insert, update, delete on public.member_files to authenticated;

-- What the member's own page may list / download, by the private token.
create function public.get_member_files(p_token uuid)
returns table (id uuid, title text, size_bytes integer, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select f.id, f.title, f.size_bytes, f.created_at
  from public.org_members m
  join public.organizations o on o.id = m.organization_id
  join public.member_files f on f.member_id = m.id and f.organization_id = m.organization_id
  where m.access_token = p_token and o.status = 'published'
  order by f.created_at desc
$$;
revoke execute on function public.get_member_files(uuid) from public;
grant execute on function public.get_member_files(uuid) to anon, authenticated;

create function public.get_member_file_path(p_token uuid, p_file uuid)
returns text
language sql stable security definer set search_path = '' as $$
  select f.storage_path
  from public.org_members m
  join public.organizations o on o.id = m.organization_id
  join public.member_files f on f.member_id = m.id and f.organization_id = m.organization_id
  where m.access_token = p_token and f.id = p_file and o.status = 'published'
$$;
revoke execute on function public.get_member_file_path(uuid, uuid) from public;
grant execute on function public.get_member_file_path(uuid, uuid) to anon, authenticated;
