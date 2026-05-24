alter table public.profiles
add column if not exists last_seen_at timestamptz;

do $$
begin
  alter table public.community_members
    drop constraint if exists community_members_role_check;
  alter table public.community_members
    add constraint community_members_role_check
    check (role in ('owner', 'admin', 'mod', 'helper', 'member'));
end $$;

create or replace function public.get_or_create_direct_conversation(input_other_user_id uuid)
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

  if current_user_id = input_other_user_id then
    raise exception 'Cannot create a direct conversation with self';
  end if;

  if public.is_blocked_between(current_user_id, input_other_user_id) then
    raise exception 'Conversation blocked by privacy settings';
  end if;

  select c.id into conversation_id
  from public.conversations c
  join public.conversation_members a
    on a.conversation_id = c.id
   and a.user_id = current_user_id
  join public.conversation_members b
    on b.conversation_id = c.id
   and b.user_id = input_other_user_id
  where c.type = 'direct'
  limit 1;

  if conversation_id is null then
    insert into public.conversations (type, community_id)
    values ('direct', null)
    returning id into conversation_id;

    insert into public.conversation_members (conversation_id, user_id)
    values
      (conversation_id, current_user_id),
      (conversation_id, input_other_user_id)
    on conflict do nothing;
  end if;

  return conversation_id;
end;
$$;
