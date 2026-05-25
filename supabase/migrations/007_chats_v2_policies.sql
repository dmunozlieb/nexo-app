-- Chats v2 explicit RLS policies (no \ir, safe to run directly in SQL Editor).
-- Ensures conversations + conversation_members + messages have the right policies
-- for the new chats model from migration 006.

alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

-- ============================================================================
-- conversations
-- ============================================================================

-- Read: members can read their conversations.
drop policy if exists "conversations_read_members" on public.conversations;
create policy "conversations_read_members"
on public.conversations for select
using (public.is_conversation_member(id, auth.uid()));

-- Insert: direct conversations require auth; community conversations require
-- the user to actually be a member of the orbita they are creating a chat in.
drop policy if exists "conversations_insert_authenticated" on public.conversations;
drop policy if exists "conversations_insert_community_member" on public.conversations;
create policy "conversations_insert_community_member"
on public.conversations for insert
with check (
  auth.uid() is not null
  and (
    type = 'direct'
    or (
      type = 'community'
      and community_id is not null
      and public.is_community_member(community_id, auth.uid())
    )
  )
);

-- Update: chat admin/co-admin/community moderators can change config.
drop policy if exists "conversations_update_mods" on public.conversations;
create policy "conversations_update_mods"
on public.conversations for update
using (public.is_chat_moderator(id, auth.uid()))
with check (public.is_chat_moderator(id, auth.uid()));

-- Delete: chat admin (non-default) or community moderator (override).
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

-- ============================================================================
-- conversation_members
-- ============================================================================

-- Read: any member can see the membership list.
drop policy if exists "conversation_members_read_self" on public.conversation_members;
create policy "conversation_members_read_self"
on public.conversation_members for select
using (public.is_conversation_member(conversation_id, auth.uid()));

-- Insert: self-join (with default member role) or self adding as admin
-- when the chat was just created via createChat (role = admin).
-- Both cases require auth.uid() = user_id.
drop policy if exists "conversation_members_insert_self_or_rpc" on public.conversation_members;
drop policy if exists "conversation_members_insert_self" on public.conversation_members;
create policy "conversation_members_insert_self"
on public.conversation_members for insert
with check (user_id = auth.uid());

-- Update: chat admins/co-admins/community mods can change member rows
-- (used for ban via role='banned', mute/last_read are self via separate policy below).
drop policy if exists "conversation_members_update_mods" on public.conversation_members;
create policy "conversation_members_update_mods"
on public.conversation_members for update
using (
  public.is_chat_moderator(conversation_id, auth.uid())
  or user_id = auth.uid()
)
with check (
  public.is_chat_moderator(conversation_id, auth.uid())
  or user_id = auth.uid()
);

-- Delete: leave self or kick by a moderator.
drop policy if exists "conversation_members_delete_self_or_mod" on public.conversation_members;
drop policy if exists "conversation_members_leave_or_mod" on public.conversation_members;
create policy "conversation_members_delete_self_or_mod"
on public.conversation_members for delete
using (
  user_id = auth.uid()
  or public.is_chat_moderator(conversation_id, auth.uid())
);

-- ============================================================================
-- messages
-- ============================================================================

drop policy if exists "messages_read_members" on public.messages;
create policy "messages_read_members"
on public.messages for select
using (public.is_conversation_member(conversation_id, auth.uid()));

drop policy if exists "messages_insert_members_self" on public.messages;
create policy "messages_insert_members_self"
on public.messages for insert
with check (
  sender_id = auth.uid()
  and public.is_conversation_member(conversation_id, auth.uid())
  and public.chat_member_role(conversation_id, auth.uid()) <> 'banned'
);

drop policy if exists "messages_update_sender_or_mod" on public.messages;
create policy "messages_update_sender_or_mod"
on public.messages for update
using (
  sender_id = auth.uid()
  or public.is_chat_moderator(conversation_id, auth.uid())
)
with check (
  sender_id = auth.uid()
  or public.is_chat_moderator(conversation_id, auth.uid())
);

drop policy if exists "messages_delete_sender_or_mod" on public.messages;
create policy "messages_delete_sender_or_mod"
on public.messages for delete
using (
  sender_id = auth.uid()
  or public.is_chat_moderator(conversation_id, auth.uid())
);
