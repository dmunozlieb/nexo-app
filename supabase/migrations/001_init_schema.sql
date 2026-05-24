create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null check (char_length(username) between 3 and 24 and username ~ '^[a-z0-9_]+$'),
  display_name text check (display_name is null or char_length(display_name) between 2 and 40),
  bio text check (bio is null or char_length(bio) <= 160),
  avatar_url text,
  banner_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  is_banned boolean not null default false
);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  slug text unique not null,
  icon text
);

create table if not exists public.user_interests (
  user_id uuid not null references public.profiles(id) on delete cascade,
  interest_id uuid not null references public.interests(id) on delete cascade,
  primary key (user_id, interest_id)
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  name text not null check (char_length(name) between 2 and 80),
  description text check (description is null or char_length(description) <= 600),
  avatar_url text,
  banner_url text,
  owner_id uuid not null references public.profiles(id) on delete restrict,
  visibility text not null default 'public' check (visibility in ('public', 'private', 'unlisted')),
  category text,
  rules jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'mod', 'helper', 'member')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('debate', 'help', 'fanart', 'poll', 'story', 'recommendation', 'event')),
  title text check (title is null or char_length(title) <= 120),
  body text check (body is null or char_length(body) <= 5000),
  media_urls text[] not null default '{}',
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (coalesce(char_length(body), 0) > 0 or coalesce(array_length(media_urls, 1), 0) > 0)
);

create table if not exists public.post_reactions (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  reaction text not null check (reaction in ('inspire', 'relate', 'curious', 'support')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, reaction)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  status text not null default 'published' check (status in ('published', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.saved_posts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  following_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('direct', 'community')),
  community_id uuid references public.communities(id) on delete cascade,
  created_at timestamptz not null default now(),
  check ((type = 'community' and community_id is not null) or (type = 'direct'))
);

create unique index if not exists conversations_unique_community
  on public.conversations(community_id)
  where type = 'community' and community_id is not null;

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (conversation_id, user_id)
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  media_urls text[] not null default '{}',
  status text not null default 'sent' check (status in ('sent', 'hidden', 'deleted')),
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('post', 'comment', 'message', 'profile', 'community')),
  target_id uuid not null,
  reason text not null check (reason in ('Acoso', 'Spam', 'Contenido sexual', 'Odio o violencia', 'Suplantacion', 'Informacion privada', 'Otro')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'reviewing', 'resolved', 'rejected')),
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id) on delete set null,
  resolved_at timestamptz
);

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_communities_visibility on public.communities(visibility);
create index if not exists idx_community_members_user on public.community_members(user_id);
create index if not exists idx_posts_community_created on public.posts(community_id, created_at desc);
create index if not exists idx_posts_author_created on public.posts(author_id, created_at desc);
create index if not exists idx_comments_post_created on public.comments(post_id, created_at);
create index if not exists idx_messages_conversation_created on public.messages(conversation_id, created_at);
create index if not exists idx_reports_status on public.reports(status, created_at desc);
create index if not exists idx_blocks_blocked on public.blocks(blocked_id);

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger set_communities_updated_at
before update on public.communities
for each row execute function public.set_updated_at();

create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

create trigger set_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    'nexo_' || substring(replace(new.id::text, '-', '') from 1 for 10),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_blocked_between(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.blocks b
    where (b.blocker_id = user_a and b.blocked_id = user_b)
       or (b.blocker_id = user_b and b.blocked_id = user_a)
  );
$$;

create or replace function public.is_community_member(input_community_id uuid, input_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members cm
    where cm.community_id = input_community_id
      and cm.user_id = input_user_id
  );
$$;

create or replace function public.is_community_moderator(input_community_id uuid, input_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.community_members cm
    where cm.community_id = input_community_id
      and cm.user_id = input_user_id
      and cm.role in ('owner', 'admin', 'mod')
  );
$$;

create or replace function public.can_read_community(input_community_id uuid, input_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.communities c
    where c.id = input_community_id
      and (
        c.visibility in ('public', 'unlisted')
        or public.is_community_member(c.id, input_user_id)
      )
  );
$$;

create or replace function public.is_conversation_member(input_conversation_id uuid, input_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.conversation_members cm
    where cm.conversation_id = input_conversation_id
      and cm.user_id = input_user_id
  );
$$;

create or replace function public.can_moderate_target(input_target_type text, input_target_id uuid, input_user_id uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  target_community_id uuid;
begin
  if input_user_id is null then
    return false;
  end if;

  if input_target_type = 'community' then
    target_community_id := input_target_id;
  elsif input_target_type = 'post' then
    select community_id into target_community_id from public.posts where id = input_target_id;
  elsif input_target_type = 'comment' then
    select p.community_id into target_community_id
    from public.comments c
    join public.posts p on p.id = c.post_id
    where c.id = input_target_id;
  elsif input_target_type = 'message' then
    select conversations.community_id into target_community_id
    from public.messages m
    join public.conversations conversations on conversations.id = m.conversation_id
    where m.id = input_target_id;
  elsif input_target_type = 'profile' then
    return exists (
      select 1
      from public.community_members target_member
      join public.community_members mod_member
        on mod_member.community_id = target_member.community_id
      where target_member.user_id = input_target_id
        and mod_member.user_id = input_user_id
        and mod_member.role in ('owner', 'admin', 'mod')
    );
  else
    return false;
  end if;

  return target_community_id is not null
    and public.is_community_moderator(target_community_id, input_user_id);
end;
$$;

create or replace function public.get_or_create_community_conversation(input_community_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  conversation_id uuid;
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_community_member(input_community_id, current_user_id) then
    raise exception 'Only community members can open this room';
  end if;

  select id into conversation_id
  from public.conversations
  where type = 'community'
    and community_id = input_community_id
  limit 1;

  if conversation_id is null then
    insert into public.conversations (type, community_id)
    values ('community', input_community_id)
    returning id into conversation_id;
  end if;

  insert into public.conversation_members (conversation_id, user_id)
  select conversation_id, cm.user_id
  from public.community_members cm
  where cm.community_id = input_community_id
  on conflict do nothing;

  return conversation_id;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('avatars', 'avatars', true, 6291456, array['image/jpeg', 'image/png', 'image/webp']),
  ('banners', 'banners', true, 8388608, array['image/jpeg', 'image/png', 'image/webp']),
  ('post-media', 'post-media', true, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('community-assets', 'community-assets', true, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
