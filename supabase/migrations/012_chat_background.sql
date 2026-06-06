-- 012: fondo (wallpaper) del chat. Compartido a nivel de conversación.
alter table public.conversations
  add column if not exists background_url text;

-- Cambia el fondo. community -> mods del chat; direct -> cualquier miembro.
create or replace function public.set_chat_background(
  input_conversation_id uuid,
  input_background_url text
) returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  conv public.conversations;
  allowed boolean;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select * into conv from public.conversations where id = input_conversation_id;
  if not found then
    raise exception 'Chat no encontrado';
  end if;

  if conv.type = 'community' then
    allowed := public.is_chat_moderator(input_conversation_id, caller_id);
  else
    allowed := public.is_conversation_member(input_conversation_id, caller_id);
  end if;

  if not allowed then
    raise exception 'No tienes permiso para cambiar el fondo';
  end if;

  update public.conversations
  set background_url = nullif(trim(coalesce(input_background_url, '')), '')
  where id = input_conversation_id
  returning * into conv;

  if conv.type = 'community' then
    insert into public.chat_audit_log (conversation_id, actor_id, action)
    values (input_conversation_id, caller_id, 'chat_updated');
  end if;

  return conv;
end;
$$;
