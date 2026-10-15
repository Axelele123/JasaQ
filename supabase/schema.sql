-- =====================================================================
-- JasaQ database schema for Supabase (Postgres)
-- Run this once in: Supabase Dashboard -> SQL Editor -> New query -> Run
--
-- Privacy model (enforced by the DATABASE, not by the website):
--   * Passwords are handled by Supabase Auth (hashed); never stored here.
--   * Email lives only in auth.users and is never exposed to other users.
--   * profiles         -> public info the user chooses to show.
--   * profile_private  -> private info (phone), readable ONLY by its owner.
--   * services/requests-> public listings, editable ONLY by their owner.
--   * conversations/messages -> readable ONLY by the two participants.
--   * avatars bucket   -> users can only write inside their own folder.
-- =====================================================================

-- ---------- Profiles (public) ----------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text unique check (username ~ '^[a-z0-9_]{3,20}$'),
  display_name  text not null default 'Pengguna JasaQ' check (char_length(display_name) between 1 and 60),
  role          text not null default 'provider' check (role in ('provider', 'umkm')),
  headline      text check (char_length(headline) <= 80),
  bio           text check (char_length(bio) <= 600),
  location      text check (char_length(location) <= 60),
  business_name text check (char_length(business_name) <= 80),
  skills        text[] not null default '{}' check (cardinality(skills) <= 12),
  website       text check (website is null or (website ~* '^https?://' and char_length(website) <= 200)),
  instagram     text check (instagram is null or instagram ~ '^[A-Za-z0-9._]{1,30}$'),
  -- Only images from our own storage bucket, so nobody can embed a tracking pixel as an avatar.
  avatar_url    text check (avatar_url is null or avatar_url like '%/storage/v1/object/public/avatars/%'),
  theme_color   text not null default '#3C8FFA' check (theme_color ~ '^#[0-9A-Fa-f]{6}$'),
  banner_style  text not null default 'waves' check (banner_style in ('waves', 'bubbles', 'plain')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ---------- Private profile data (owner only) ----------
create table if not exists public.profile_private (
  id         uuid primary key references public.profiles(id) on delete cascade,
  phone      text check (phone is null or phone ~ '^\+?[0-9 \-]{6,20}$'),
  updated_at timestamptz not null default now()
);

-- ---------- Listings ----------
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid default auth.uid() references public.profiles(id) on delete cascade, -- null = sample data
  title       text not null check (char_length(title) between 3 and 100),
  category    text not null check (category in ('design','social','photo','video','writing','web','admin','translate')),
  description text not null check (char_length(description) between 1 and 2000),
  price       integer not null check (price between 1000 and 100000000),
  unit        text not null check (char_length(unit) between 1 and 30),
  hours       smallint not null check (hours between 1 and 12),
  days        text[] not null check (cardinality(days) between 1 and 7 and days <@ array['Sen','Sel','Rab','Kam','Jum','Sab','Min']),
  location    text check (char_length(location) <= 60),
  delivery    text check (char_length(delivery) <= 40),
  includes    text[] not null default '{}' check (cardinality(includes) <= 10),
  created_at  timestamptz not null default now()
);

create table if not exists public.requests (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid default auth.uid() references public.profiles(id) on delete cascade, -- null = sample data
  title       text not null check (char_length(title) between 3 and 100),
  category    text not null check (category in ('design','social','photo','video','writing','web','admin','translate')),
  business    text not null check (char_length(business) between 1 and 80),
  description text not null check (char_length(description) between 1 and 2000),
  budget      integer not null check (budget between 1000 and 100000000),
  deadline    date not null,
  location    text check (char_length(location) <= 60),
  status      text not null default 'open' check (status in ('open', 'closed')),
  created_at  timestamptz not null default now()
);

create index if not exists services_owner_idx on public.services (owner_id);
create index if not exists services_created_idx on public.services (created_at desc);
create index if not exists requests_owner_idx on public.requests (owner_id);
create index if not exists requests_created_idx on public.requests (created_at desc);

-- ---------- Chat ----------
create table if not exists public.conversations (
  id              uuid primary key default gen_random_uuid(),
  user_a          uuid not null references public.profiles(id) on delete cascade,
  user_b          uuid not null references public.profiles(id) on delete cascade,
  last_message    text,
  last_message_at timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  check (user_a < user_b),          -- one row per pair, stored in a fixed order
  unique (user_a, user_b)
);

create table if not exists public.messages (
  id              bigint generated always as identity primary key,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id       uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body            text not null check (char_length(btrim(body)) between 1 and 2000),
  created_at      timestamptz not null default now(),
  read_at         timestamptz
);

create index if not exists messages_conv_idx on public.messages (conversation_id, created_at desc);
create index if not exists conversations_a_idx on public.conversations (user_a);
create index if not exists conversations_b_idx on public.conversations (user_b);

-- =====================================================================
-- Functions & triggers
-- =====================================================================

-- Create the profile rows automatically when someone signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, role, business_name)
  values (
    new.id,
    coalesce(nullif(left(btrim(new.raw_user_meta_data->>'display_name'), 60), ''), 'Pengguna JasaQ'),
    case when new.raw_user_meta_data->>'role' = 'umkm' then 'umkm' else 'provider' end,
    nullif(left(btrim(new.raw_user_meta_data->>'business_name'), 80), '')
  );
  insert into public.profile_private (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
drop trigger if exists profile_private_touch on public.profile_private;
create trigger profile_private_touch before update on public.profile_private
  for each row execute function public.touch_updated_at();

-- Is the current user one of the two people in this conversation?
create or replace function public.is_participant(conv uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.conversations c
    where c.id = conv and (select auth.uid()) in (c.user_a, c.user_b)
  );
$$;

-- Open (or reuse) the 1-to-1 conversation with another user.
create or replace function public.start_conversation(other uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  me  uuid := auth.uid();
  a   uuid;
  b   uuid;
  cid uuid;
begin
  if me is null then raise exception 'Not authenticated'; end if;
  if other is null or other = me then raise exception 'Invalid recipient'; end if;
  if not exists (select 1 from public.profiles where id = other) then raise exception 'User not found'; end if;
  a := least(me, other);
  b := greatest(me, other);
  insert into public.conversations (user_a, user_b) values (a, b)
    on conflict (user_a, user_b) do nothing;
  select id into cid from public.conversations where user_a = a and user_b = b;
  return cid;
end;
$$;

-- Mark the other person's messages as read (users can't edit message text).
create or replace function public.mark_read(conv uuid)
returns void language sql security definer set search_path = '' as $$
  update public.messages
     set read_at = now()
   where conversation_id = conv
     and read_at is null
     and sender_id <> (select auth.uid())
     and public.is_participant(conv);
$$;

-- Keep the conversation preview up to date.
create or replace function public.on_message_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.conversations
     set last_message = left(new.body, 120), last_message_at = new.created_at
   where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_after_insert on public.messages;
create trigger messages_after_insert after insert on public.messages
  for each row execute function public.on_message_insert();

-- Let users delete their own account and all their data (right to be forgotten).
-- Remove your avatar files first (the website does this automatically).
create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  delete from auth.users where id = auth.uid();   -- cascades to every table above
end;
$$;

revoke execute on function public.start_conversation(uuid) from public, anon;
revoke execute on function public.mark_read(uuid)         from public, anon;
revoke execute on function public.delete_my_account()     from public, anon;
grant  execute on function public.start_conversation(uuid) to authenticated;
grant  execute on function public.mark_read(uuid)         to authenticated;
grant  execute on function public.delete_my_account()     to authenticated;

-- =====================================================================
-- Row Level Security (who can read / write what)
-- =====================================================================
alter table public.profiles        enable row level security;
alter table public.profile_private enable row level security;
alter table public.services        enable row level security;
alter table public.requests        enable row level security;
alter table public.conversations   enable row level security;
alter table public.messages        enable row level security;

-- profiles: everyone can view, only the owner can edit. Rows are created by the signup trigger.
drop policy if exists "profiles are public" on public.profiles;
create policy "profiles are public" on public.profiles
  for select using (true);
drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- profile_private: only the owner can see or change it.
drop policy if exists "owner reads private" on public.profile_private;
create policy "owner reads private" on public.profile_private
  for select to authenticated using (id = (select auth.uid()));
drop policy if exists "owner updates private" on public.profile_private;
create policy "owner updates private" on public.profile_private
  for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- services & requests: public to read, only the owner can create/edit/delete.
drop policy if exists "services are public" on public.services;
create policy "services are public" on public.services for select using (true);
drop policy if exists "owner inserts service" on public.services;
create policy "owner inserts service" on public.services
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "owner updates service" on public.services;
create policy "owner updates service" on public.services
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "owner deletes service" on public.services;
create policy "owner deletes service" on public.services
  for delete to authenticated using (owner_id = (select auth.uid()));

drop policy if exists "requests are public" on public.requests;
create policy "requests are public" on public.requests for select using (true);
drop policy if exists "owner inserts request" on public.requests;
create policy "owner inserts request" on public.requests
  for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy if exists "owner updates request" on public.requests;
create policy "owner updates request" on public.requests
  for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
drop policy if exists "owner deletes request" on public.requests;
create policy "owner deletes request" on public.requests
  for delete to authenticated using (owner_id = (select auth.uid()));

-- conversations: only participants can see them. Created via start_conversation().
drop policy if exists "participants read conversations" on public.conversations;
create policy "participants read conversations" on public.conversations
  for select to authenticated
  using ((select auth.uid()) in (user_a, user_b));

-- messages: only participants can read; you can only send as yourself. No edits/deletes.
drop policy if exists "participants read messages" on public.messages;
create policy "participants read messages" on public.messages
  for select to authenticated using (public.is_participant(conversation_id));
drop policy if exists "participants send messages" on public.messages;
create policy "participants send messages" on public.messages
  for insert to authenticated
  with check (sender_id = (select auth.uid()) and public.is_participant(conversation_id));

-- =====================================================================
-- Realtime chat (Realtime also respects the RLS rules above)
-- =====================================================================
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- Avatar storage: public images, users can only write to "<their-user-id>/..."
-- =====================================================================
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "avatar read own folder" on storage.objects;
create policy "avatar read own folder" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatar upload own folder" on storage.objects;
create policy "avatar upload own folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatar update own folder" on storage.objects;
create policy "avatar update own folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
drop policy if exists "avatar delete own folder" on storage.objects;
create policy "avatar delete own folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
