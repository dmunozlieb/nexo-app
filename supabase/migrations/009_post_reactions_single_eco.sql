-- El Eco se colapso en una unica interaccion: el cliente solo escribe "inspire"
-- (ver SIGNALS_ARCHITECTURE.md). Esta migracion alinea el schema con ese modelo:
-- los tipos legacy `relate`/`curious`/`support` dejan de permitirse en
-- post_reactions. Es idempotente y conserva los Ecos existentes.

-- 1) Garantizar un Eco "inspire" para cada (post, usuario) que dejo cualquier
--    reaccion legacy y que aun no tenga inspire. Evita perder el Eco al borrar.
insert into public.post_reactions (post_id, user_id, reaction, created_at)
select post_id, user_id, 'inspire', created_at
from public.post_reactions
where reaction <> 'inspire'
on conflict (post_id, user_id, reaction) do nothing;

-- 2) Borrar las reacciones legacy ya migradas a inspire.
delete from public.post_reactions
where reaction <> 'inspire';

-- 3) Estrechar el CHECK para que el schema solo admita "inspire". Al ser la
--    reaccion constante, la PK (post_id, user_id, reaction) pasa a garantizar un
--    unico Eco por usuario y Senal.
alter table public.post_reactions
  drop constraint if exists post_reactions_reaction_check;

alter table public.post_reactions
  add constraint post_reactions_reaction_check check (reaction = 'inspire');
