# AI_TASKS - Lista operativa para futuras sesiones

Usa este archivo como backlog practico. Marca o actualiza tareas cuando se completen.

## Antes de tocar codigo

- [ ] Leer `docs/SESSION_2026-05-25.md` para el ultimo estado.
- [ ] Leer `AGENTS.md`.
- [ ] Leer `docs/PROJECT_CONTEXT.md`.
- [ ] Leer `docs/ARCHITECTURE.md`.
- [ ] Leer `docs/DESIGN_SYSTEM.md`.
- [ ] Consultar Expo SDK 56: https://docs.expo.dev/versions/v56.0.0/
- [ ] Revisar `git status --short`.
- [ ] Confirmar si el cambio afecta modo demo.

## Validacion base

- [ ] Ejecutar `npm run typecheck` tras cambios TS/TSX.
- [ ] Ejecutar `npm run lint` tras cambios de codigo.
- [ ] Ejecutar `npm test` si se toca validacion, utils, servicios o logica.
- [ ] Ejecutar `npx expo export --platform web` si se toca navegacion, web o release.
- [ ] Probar mobile y desktop cuando se toca UI.

## Acciones de Supabase pendientes (criticas, hacer antes que nada)

- [ ] Aplicar `supabase/migrations/005_auto_create_profile.sql` en SQL Editor.
- [ ] Aplicar `supabase/migrations/006_chats_v2.sql` en SQL Editor.
- [ ] Aplicar `supabase/migrations/007_chats_v2_policies.sql` en SQL Editor (sin esto = 403 al crear chats).
- [ ] Crear `008_create_community_chat_rpc.sql` con RPC SECURITY DEFINER `create_community_chat(community_id, name, description, avatar_url, banner_url, visibility, slow_mode_seconds)` — necesario porque `chat-service.createChat` lo invoca.
- [ ] Rotar el Google OAuth client_secret si aun no se hizo (se filtro en sesion anterior).

## Tareas de producto prioritarias (proxima sesion)

### Chat v2 — completar
- [ ] `ChatSettingsScreen` con form de editar `name/description/avatar/banner/visibility/slow_mode_seconds` + boton "Borrar chat" + audit log visible (`useChatAuditLog` ya existe).
- [ ] UI de reactions: emoji picker en menu flotante de cada bubble + render counts debajo del mensaje.
- [ ] Adjuntar imagenes desde composer (`media_urls` ya en schema).
- [ ] @mentions parsing en `body` + notificacion.
- [ ] Aplicar `banner_url` del chat como fondo del MessageList con overlay oscuro.
- [ ] Realtime de pinned + reactions (ahora solo `messages`).
- [ ] `last_message` real y `unread_count` real en `listConversations`.
- [ ] App-level: limitar a 5 chats activos por usuario por orbita.
- [ ] Long-press para acciones de bubble en mobile (ahora solo hover web).

### Otros productos
- [ ] Pulir responsive mobile del sistema orbital.
- [ ] Revisar solapamientos y legibilidad en `GalaxyOrbitMap`.
- [ ] Extender bottom sheets a filtros de explorar y acciones contextuales.
- [ ] **Rediseno `ProfileScreen`** — estructura cerrada en `docs/SCREEN_PROFILE.md` (cabecera + tabs Publicaciones/Orbitas/Info, 3 modos, acciones limpias). UI primero con datos existentes.
  - [ ] UI: banner real, tabs (`SectionTabs`), tab Orbitas (`CommunityCard` + `listJoinedCommunities`), stats parciales (orbitas/publicaciones), acciones (propio solo "Editar perfil"; ajeno Seguir/Mensaje + `•••`).
  - [ ] Servicio `getUserInterests(userId)` + demo → chips de intereses.
  - [ ] Servicio de conteo seguidores/siguiendo + `isFollowing(viewer, profile)` + demo → stats y toggle real Seguir/Siguiendo.
  - [ ] Bio por Orbita: migracion (columna en `community_members`) + tipo `CommunityMember` + `updateMembershipBio` + demo + UI en modo contextual.
- [ ] Convertir `online_count` aproximado en presencia real.
- [ ] Mejorar cola de moderacion con preview del contenido reportado.
- [ ] Crear UI para gestionar bloqueos.
- [ ] Mejorar onboarding con recomendaciones de Orbitas.
- [ ] Notificaciones reales en `AppTopBar.bell` (ahora el dot es mock fijo).
- [ ] Preparar deploy web documentado.

## Tareas tecnicas

- [ ] Revisar que todo servicio nuevo tenga rama demo si afecta flujos principales.
- [ ] Mantener query keys consistentes e invalidaciones despues de mutations.
- [ ] Evitar consultas Supabase directas en componentes compartidos.
- [ ] Revisar RLS antes de confiar en permisos de UI.
- [ ] Actualizar `src/types/database.ts` si cambia schema.
- [ ] Agregar tests a validaciones o utils cuando se cambien reglas.
- [ ] Revisar Storage policies si se agregan nuevos buckets o rutas.
- [ ] Documentar migraciones nuevas en `docs/ARCHITECTURE.md`.

## Tareas de diseno

- [ ] Mantener dark/cosmico/alien como direccion visual.
- [ ] Evitar UI generica tipo dashboard.
- [ ] No saturar con glow/gradientes.
- [ ] Revisar contraste de texto sobre fondos cosmicos.
- [ ] Usar `lucide-react-native` para iconos.
- [ ] Reutilizar `Button`, `TextInput`, `GradientCard`, `BottomSheet`, `Badge`, `Avatar`.
- [ ] Revisar que el bottom nav no tape contenido.
- [ ] Revisar que textos largos no rompan cards o botones.

## Tareas de seguridad

- [ ] No introducir secrets ni service role keys.
- [ ] No guardar claves privadas en `.env.example`.
- [ ] Mantener RLS como autoridad final.
- [ ] Sanitizar texto de usuario.
- [ ] Validar formularios con Zod.
- [ ] No usar imagenes protegidas como assets oficiales.
- [ ] Revisar reportes/bloqueos al tocar perfiles, posts, chats o comunidades.

## Ideas futuras

- [ ] Misiones/eventos como entidad propia dentro de Orbitas.
- [x] Canales multiples por Orbita. _(esquema y UI base hechos en sesion 2026-05-25)_
- [ ] Reputacion comunitaria.
- [ ] Notificaciones push por mencion/respuesta/chat.
- [ ] Busqueda global de posts, Orbitas y usuarios.
- [x] Moderation audit log (chat). _(tabla `chat_audit_log` creada, falta UI)_
- [ ] Moderation audit log global (posts/perfiles/orbitas).
- [ ] Web SEO/metadata para Orbitas publicas.
