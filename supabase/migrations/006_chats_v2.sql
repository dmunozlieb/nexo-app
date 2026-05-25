-- Chats v2: multiple chats per orbita, roles, configuration, moderation primitives.

-- 1) Drop the legacy "one chat per orbita" constraint so users can create multiple chats.
drop index if exists public.conversations_unique_community;

-- 2) Extend conversations with chat-style configuration.
alter table public.conversations
  add column if not exists name text,
  add column if not exists description text,
  add column if not exists avatar_url text,
  add column if not exists banner_url text,
  add column if not exists created_by uuid references public.profiles(id) on delete set null,
  add column if not exists visibility text not null default 'public'
    check (visibility in ('public', 'invite_only')),
  add column if not exists slow_mode_seconds int not null default 0
    check (slow_mode_seconds between 0 and 300),
  add column if not exists is_default boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Auto bump updated_at on changes.
drop trigger if exists conversations_updated_at on public.conversations;
create trigger conversations_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

-- Only one default chat ("Lobby") per orbita.
create unique index if not exists conversations_one_default_per_community
  on public.conversations(community_id)
  where is_default = true and community_id is not null;

-- 3) Roles inside a chat + per-member preferences.
alter table public.conversation_members
  add column if not exists role text not null default 'member'
    check (role in ('admin', 'co_admin', 'member', 'banned')),
  add column if not exists muted boolean not null default false,
  add column if not exists last_read_at timestamptz;

-- Only one chat admin at a time per conversation.
create unique index if not exists conversation_members_one_admin
  on public.conversation_members(conversation_id)
  where role = 'admin';

-- 4) Pinned messages (max 3 enforced via trigger).
create table if not exists public.chat_pinned_messages (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  message_id uuid not null references public.messages(id) on delete cascade,
  pinned_by uuid references public.profiles(id) on delete set null,
  pinned_at timestamptz not null default now(),
  primary key (conversation_id, message_id)
);

create or replace function public.enforce_pinned_limit()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.chat_pinned_messages where conversation_id = new.conversation_id) >= 3 then
    raise exception 'Maximo 3 mensajes fijados por chat';
  end if;
  return new;
end;
$$;

drop trigger if exists pinned_messages_limit on public.chat_pinned_messages;
create trigger pinned_messages_limit
before insert on public.chat_pinned_messages
for each row execute function public.enforce_pinned_limit();

-- 5) Audit log of moderation actions inside chats.
create table if not exists public.chat_audit_log (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'chat_created', 'chat_updated', 'chat_deleted',
    'role_granted', 'role_revoked', 'admin_transferred',
    'member_kicked', 'member_banned', 'member_unbanned',
    'message_pinned', 'message_unpinned',
    'slow_mode_changed'
  )),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists chat_audit_log_conversation_idx
  on public.chat_audit_log(conversation_id, created_at desc);

-- 6) Emoji reactions on messages (1 per user per emoji per message).
create table if not exists public.message_reactions (
  message_id uuid not null references public.messages(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 8),
  created_at timestamptz not null default now(),
  primary key (message_id, user_id, emoji)
);

create index if not exists message_reactions_message_idx
  on public.message_reactions(message_id);

-- 7) Helper functions for chat roles + co-admin capacity (max 3).
create or replace function public.chat_member_role(input_conversation_id uuid, input_user_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.conversation_members
  where conversation_id = input_conversation_id and user_id = input_user_id
  limit 1;
$$;

create or replace function public.is_chat_admin(input_conversation_id uuid, input_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.chat_member_role(input_conversation_id, input_user_id) = 'admin';
$$;

create or replace function public.is_chat_moderator(input_conversation_id uuid, input_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  with chat as (
    select community_id from public.conversations where id = input_conversation_id
  )
  select
    public.chat_member_role(input_conversation_id, input_user_id) in ('admin', 'co_admin')
    or exists (
      select 1 from chat where chat.community_id is not null
        and public.is_community_moderator(chat.community_id, input_user_id)
    );
$$;

create or replace function public.chat_co_admin_count(input_conversation_id uuid)
returns int
language sql
stable
as $$
  select count(*)::int from public.conversation_members
  where conversation_id = input_conversation_id and role = 'co_admin';
$$;

-- Transactional admin transfer: target becomes admin, previous admin becomes co_admin
-- (or member if all 3 co-admin slots are taken). Audit log entry written automatically.
create or replace function public.transfer_chat_admin(
  input_conversation_id uuid,
  input_new_admin_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  new_role_for_old text;
begin
  if not public.is_chat_admin(input_conversation_id, caller_id) then
    raise exception 'Solo el admin actual puede transferir el rol';
  end if;

  if not exists (
    select 1 from public.conversation_members
    where conversation_id = input_conversation_id
      and user_id = input_new_admin_id
      and role in ('co_admin', 'member')
  ) then
    raise exception 'El nuevo admin debe ser miembro activo del chat';
  end if;

  if public.chat_co_admin_count(input_conversation_id) >= 3 then
    new_role_for_old := 'member';
  else
    new_role_for_old := 'co_admin';
  end if;

  update public.conversation_members
  set role = 'admin'
  where conversation_id = input_conversation_id and user_id = input_new_admin_id;

  update public.conversation_members
  set role = new_role_for_old
  where conversation_id = input_conversation_id and user_id = caller_id;

  insert into public.chat_audit_log (conversation_id, actor_id, action, target_id, metadata)
  values (
    input_conversation_id,
    caller_id,
    'admin_transferred',
    input_new_admin_id,
    jsonb_build_object('previous_admin_role', new_role_for_old)
  );
end;
$$;

-- Promote a member to co_admin (enforces max 3 co-admins).
create or replace function public.promote_to_co_admin(
  input_conversation_id uuid,
  input_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  if not public.is_chat_admin(input_conversation_id, caller_id) then
    raise exception 'Solo el admin puede asignar co-admins';
  end if;

  if public.chat_co_admin_count(input_conversation_id) >= 3 then
    raise exception 'Maximo 3 co-admins por chat';
  end if;

  update public.conversation_members
  set role = 'co_admin'
  where conversation_id = input_conversation_id
    and user_id = input_user_id
    and role = 'member';

  if not found then
    raise exception 'El usuario no es miembro o ya tiene rol superior';
  end if;

  insert into public.chat_audit_log (conversation_id, actor_id, action, target_id)
  values (input_conversation_id, caller_id, 'role_granted', input_user_id);
end;
$$;

-- Demote a co_admin back to member.
create or replace function public.demote_from_co_admin(
  input_conversation_id uuid,
  input_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
begin
  if not public.is_chat_admin(input_conversation_id, caller_id) then
    raise exception 'Solo el admin puede revocar co-admins';
  end if;

  update public.conversation_members
  set role = 'member'
  where conversation_id = input_conversation_id
    and user_id = input_user_id
    and role = 'co_admin';

  if not found then
    raise exception 'El usuario no es co-admin';
  end if;

  insert into public.chat_audit_log (conversation_id, actor_id, action, target_id)
  values (input_conversation_id, caller_id, 'role_revoked', input_user_id);
end;
$$;

-- Auto create a default lobby chat whenever a community is created.
create or replace function public.create_default_community_chat()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  chat_id uuid;
begin
  insert into public.conversations (
    type, community_id, name, description, visibility, is_default, created_by
  )
  values (
    'community',
    new.id,
    'Lobby',
    'Espacio principal de la Orbita.',
    'public',
    true,
    new.owner_id
  )
  returning id into chat_id;

  insert into public.conversation_members (conversation_id, user_id, role)
  values (chat_id, new.owner_id, 'admin')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists create_default_chat_on_community on public.communities;
create trigger create_default_chat_on_community
after insert on public.communities
for each row execute function public.create_default_community_chat();

-- 8) RLS policies for the new tables and updated permissions.

alter table public.chat_pinned_messages enable row level security;
alter table public.chat_audit_log enable row level security;
alter table public.message_reactions enable row level security;

-- pinned messages
drop policy if exists "chat_pinned_read_members" on public.chat_pinned_messages;
create policy "chat_pinned_read_members"
on public.chat_pinned_messages for select
using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "chat_pinned_manage_mods" on public.chat_pinned_messages;
create policy "chat_pinned_manage_mods"
on public.chat_pinned_messages for all
using (public.is_chat_moderator(conversation_id, auth.uid()))
with check (public.is_chat_moderator(conversation_id, auth.uid()));

-- audit log
drop policy if exists "chat_audit_read_mods" on public.chat_audit_log;
create policy "chat_audit_read_mods"
on public.chat_audit_log for select
using (public.is_chat_moderator(conversation_id, auth.uid()));

-- inserts are made by SECURITY DEFINER functions, so block direct writes
drop policy if exists "chat_audit_insert_blocked" on public.chat_audit_log;
create policy "chat_audit_insert_blocked"
on public.chat_audit_log for insert
with check (false);

-- message reactions
drop policy if exists "message_reactions_read_members" on public.message_reactions;
create policy "message_reactions_read_members"
on public.message_reactions for select
using (
  exists (
    select 1 from public.messages m
    where m.id = message_reactions.message_id
      and public.is_conversation_member(m.conversation_id, auth.uid())
  )
);

drop policy if exists "message_reactions_write_self" on public.message_reactions;
create policy "message_reactions_write_self"
on public.message_reactions for insert
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.messages m
    where m.id = message_reactions.message_id
      and public.is_conversation_member(m.conversation_id, auth.uid())
  )
);

drop policy if exists "message_reactions_delete_self" on public.message_reactions;
create policy "message_reactions_delete_self"
on public.message_reactions for delete
using (user_id = auth.uid());

-- Conversations: allow chat admin/co_admin and community mods to update or delete (except defaults).
drop policy if exists "conversations_update_mods" on public.conversations;
create policy "conversations_update_mods"
on public.conversations for update
using (
  public.is_chat_moderator(id, auth.uid())
)
with check (
  public.is_chat_moderator(id, auth.uid())
);

drop policy if exists "conversations_delete_admin_or_mod" on public.conversations;
create policy "conversations_delete_admin_or_mod"
on public.conversations for delete
using (
  is_default = false
  and (
    public.is_chat_admin(id, auth.uid())
    or (
      community_id is not null
      and public.is_community_moderator(community_id, auth.uid())
    )
  )
);

-- Conversation members: chat admins/co_admins can update roles (within rules), community mods can ban.
drop policy if exists "conversation_members_update_mods" on public.conversation_members;
create policy "conversation_members_update_mods"
on public.conversation_members for update
using (public.is_chat_moderator(conversation_id, auth.uid()))
with check (public.is_chat_moderator(conversation_id, auth.uid()));

drop policy if exists "conversation_members_delete_self_or_mod" on public.conversation_members;
create policy "conversation_members_delete_self_or_mod"
on public.conversation_members for delete
using (
  user_id = auth.uid()
  or public.is_chat_moderator(conversation_id, auth.uid())
);
