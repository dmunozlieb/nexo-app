insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'luna@nexo.local', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Luna Vega"}', false),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'kai@nexo.local', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Kai Nova"}', false),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'iris@nexo.local', crypt('Password123!', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}', '{"display_name":"Iris Sol"}', false)
on conflict (id) do nothing;

insert into public.profiles (id, username, display_name, bio)
values
  ('11111111-1111-4111-8111-111111111111', 'luna_vega', 'Luna Vega', 'Mod de arte, fanart y retos semanales.'),
  ('22222222-2222-4222-8222-222222222222', 'kai_nova', 'Kai Nova', 'Pregunto demasiado y guardo buenas recomendaciones.'),
  ('33333333-3333-4333-8333-333333333333', 'iris_sol', 'Iris Sol', 'Comunidades sanas, debates claros y musica rara.')
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  bio = excluded.bio;

insert into public.interests (id, name, slug, icon)
values
  ('aaaaaaaa-0000-4000-8000-000000000001', 'Arte', 'arte', 'art'),
  ('aaaaaaaa-0000-4000-8000-000000000002', 'Gaming', 'gaming', 'game'),
  ('aaaaaaaa-0000-4000-8000-000000000003', 'Lectura', 'lectura', 'book'),
  ('aaaaaaaa-0000-4000-8000-000000000004', 'Musica', 'musica', 'music'),
  ('aaaaaaaa-0000-4000-8000-000000000005', 'Tecnologia', 'tecnologia', 'code'),
  ('aaaaaaaa-0000-4000-8000-000000000006', 'Cine', 'cine', 'film')
on conflict (id) do nothing;

insert into public.user_interests (user_id, interest_id)
values
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000001'),
  ('11111111-1111-4111-8111-111111111111', 'aaaaaaaa-0000-4000-8000-000000000004'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-0000-4000-8000-000000000002'),
  ('22222222-2222-4222-8222-222222222222', 'aaaaaaaa-0000-4000-8000-000000000005'),
  ('33333333-3333-4333-8333-333333333333', 'aaaaaaaa-0000-4000-8000-000000000003')
on conflict do nothing;

insert into public.communities (
  id,
  slug,
  name,
  description,
  owner_id,
  visibility,
  category,
  rules
)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', 'atelier-nebula', 'Atelier Nebula', 'Fanart, procesos creativos y misiones de dibujo semanal.', '11111111-1111-4111-8111-111111111111', 'public', 'Arte', '["Acredita referencias", "Critica con respeto", "No publiques arte de terceros como propio"]'),
  ('bbbbbbbb-0000-4000-8000-000000000002', 'checkpoint-cafe', 'Checkpoint Cafe', 'Gaming tranquilo, recomendaciones y ayuda sin spoilers.', '22222222-2222-4222-8222-222222222222', 'public', 'Gaming', '["Marca spoilers", "No flame wars", "Comparte guias con contexto"]'),
  ('bbbbbbbb-0000-4000-8000-000000000003', 'club-orbita', 'Club Orbita', 'Lecturas, historias cortas y debates de mundos imaginarios.', '33333333-3333-4333-8333-333333333333', 'unlisted', 'Lectura', '["Debate ideas, no personas", "Usa avisos de contenido", "Respeta ritmos de lectura"]')
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  rules = excluded.rules;

insert into public.community_members (community_id, user_id, role)
values
  ('bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'member'),
  ('bbbbbbbb-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'mod'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'helper'),
  ('bbbbbbbb-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'owner'),
  ('bbbbbbbb-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'member')
on conflict do nothing;

insert into public.posts (id, community_id, author_id, type, title, body, status)
values
  ('cccccccc-0000-4000-8000-000000000001', 'bbbbbbbb-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'event', 'Mision semanal: paleta imposible', 'Crea una pieza usando solo violeta, cian y verde. Sube proceso y una nota de aprendizaje.', 'published'),
  ('cccccccc-0000-4000-8000-000000000002', 'bbbbbbbb-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'recommendation', 'Juego cooperativo corto para este finde', 'Busco algo de 2 a 4 horas, con buena conversacion y poca friccion para gente nueva.', 'published'),
  ('cccccccc-0000-4000-8000-000000000003', 'bbbbbbbb-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', 'debate', 'Finales abiertos: genialidad o salida facil?', 'Me gustan cuando cambian la lectura completa de la historia, pero no cuando parecen evadir cierre.', 'published')
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  status = excluded.status;

insert into public.post_reactions (post_id, user_id, reaction)
values
  ('cccccccc-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'inspire'),
  ('cccccccc-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'support'),
  ('cccccccc-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'curious'),
  ('cccccccc-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'relate')
on conflict do nothing;

insert into public.comments (id, post_id, author_id, body, status)
values
  ('dddddddd-0000-4000-8000-000000000001', 'cccccccc-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', 'Me apunto. Voy a probar con siluetas grandes primero.', 'published'),
  ('dddddddd-0000-4000-8000-000000000002', 'cccccccc-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'Si quereis algo amable, probad una aventura cooperativa de puzzles cortos.', 'published')
on conflict (id) do nothing;

insert into public.conversations (id, type, community_id)
values
  ('eeeeeeee-0000-4000-8000-000000000001', 'community', 'bbbbbbbb-0000-4000-8000-000000000001'),
  ('eeeeeeee-0000-4000-8000-000000000002', 'community', 'bbbbbbbb-0000-4000-8000-000000000002')
on conflict (id) do nothing;

insert into public.conversation_members (conversation_id, user_id)
select c.id, cm.user_id
from public.conversations c
join public.community_members cm on cm.community_id = c.community_id
on conflict do nothing;

insert into public.messages (conversation_id, sender_id, body, status)
values
  ('eeeeeeee-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'Bienvenidas a la sala del Atelier. Esta semana abrimos critica suave.', 'sent'),
  ('eeeeeeee-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', 'Puedo moderar el hilo de feedback del viernes.', 'sent'),
  ('eeeeeeee-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', 'Dejad recomendaciones sin spoilers aqui.', 'sent');
