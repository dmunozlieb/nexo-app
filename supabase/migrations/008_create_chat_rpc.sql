-- Create community chats atomically so RLS does not block insert + select before
-- the creator membership row exists.

create or replace function public.create_community_chat(
  input_community_id uuid,
  input_name text,
  input_description text default null,
  input_avatar_url text default null,
  input_banner_url text default null,
  input_visibility text default 'public',
  input_slow_mode_seconds int default 0
)
returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  created_chat public.conversations;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  if not public.is_community_member(input_community_id, caller_id) then
    raise exception 'Only community members can create chats';
  end if;

  if char_length(trim(input_name)) < 2 or char_length(trim(input_name)) > 50 then
    raise exception 'Chat name must be between 2 and 50 characters';
  end if;

  if input_visibility not in ('public', 'invite_only') then
    raise exception 'Invalid chat visibility';
  end if;

  if input_slow_mode_seconds < 0 or input_slow_mode_seconds > 300 then
    raise exception 'Invalid slow mode value';
  end if;

  insert into public.conversations (
    type,
    community_id,
    name,
    description,
    avatar_url,
    banner_url,
    created_by,
    visibility,
    slow_mode_seconds,
    is_default
  )
  values (
    'community',
    input_community_id,
    trim(input_name),
    nullif(trim(coalesce(input_description, '')), ''),
    input_avatar_url,
    input_banner_url,
    caller_id,
    input_visibility,
    input_slow_mode_seconds,
    false
  )
  returning * into created_chat;

  insert into public.conversation_members (conversation_id, user_id, role)
  values (created_chat.id, caller_id, 'admin')
  on conflict do nothing;

  insert into public.chat_audit_log (conversation_id, actor_id, action)
  values (created_chat.id, caller_id, 'chat_created');

  return created_chat;
end;
$$;
