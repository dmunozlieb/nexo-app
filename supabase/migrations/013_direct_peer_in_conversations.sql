-- 013: incluir el perfil del otro participante (direct_peer) en los DMs.
create or replace function public.list_user_conversations(input_user_id uuid)
returns table (
  conv jsonb,
  community jsonb,
  last_message jsonb,
  unread_count integer,
  member_count integer,
  direct_peer jsonb,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    to_jsonb(c) as conv,
    to_jsonb(co) as community,
    (
      select to_jsonb(m)
      from public.messages m
      where m.conversation_id = c.id and m.status = 'sent'
      order by m.created_at desc
      limit 1
    ) as last_message,
    (
      select count(*)::int
      from public.messages m2
      where m2.conversation_id = c.id
        and m2.status = 'sent'
        and m2.sender_id <> input_user_id
        and m2.created_at > coalesce(cm.last_read_at, '-infinity'::timestamptz)
    ) as unread_count,
    (
      select count(*)::int
      from public.conversation_members cm2
      where cm2.conversation_id = c.id and cm2.role <> 'banned'
    ) as member_count,
    (
      select to_jsonb(p)
      from public.conversation_members cmp
      join public.profiles p on p.id = cmp.user_id
      where cmp.conversation_id = c.id
        and c.type = 'direct'
        and cmp.user_id <> input_user_id
      limit 1
    ) as direct_peer,
    cm.role as role
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  left join public.communities co on co.id = c.community_id
  where cm.user_id = input_user_id
    and input_user_id = auth.uid()
    and cm.role <> 'banned'
  order by (
    select max(m3.created_at)
    from public.messages m3
    where m3.conversation_id = c.id and m3.status = 'sent'
  ) desc nulls last, c.created_at desc;
$$;
