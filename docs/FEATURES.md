# Funcionalidades de Nexo

## Auth y onboarding

Implementado:

- Login con email/password.
- Registro con validacion de email, username, contrasena y terminos.
- Recuperar contrasena.
- Logout.
- Persistencia de sesion con Supabase Auth y AsyncStorage.
- Onboarding obligatorio como wizard de 3 pasos (identidad / perfil / intereses) con progress dots + labels, fade entre pasos, validacion incremental, "saltar foto", auto-normalizacion de username, contador de bio, emojis en cards de intereses, boton final disabled hasta 1+ intereses seleccionados. Fondo cosmico con 36 estrellas animadas (twinkle individual).
- Google OAuth funcional (configurado en Supabase) — pendiente trigger auto-create profile (`005_auto_create_profile.sql`).
- Modo demo con usuarios locales.

Pendiente:

- Flujo completo de email confirmation.
- Pantalla/UX de callback OAuth.
- Terminos y politica enlazados a documentos reales.
- Mejorar onboarding con recomendaciones iniciales de Orbitas.

## Home: sistema orbital

Implementado:

- `/home` renderiza `GalaxyOrbitMap`.
- Muestra Orbitas del usuario primero y recomendaciones despues.
- Visual de planetas con colores por categoria, estrellas, orbitas y senales.
- Detalle de Orbita en panel desktop y bottom sheet movil.
- Acciones para abrir Orbita, abrir chat y crear comunidad.
- Estados loading/empty/error.

Pendiente:

- Mejorar legibilidad en moviles pequenos.
- Ajustar animaciones/rendimiento.
- Mas informacion contextual sin saturar.
- Presencia real en vez de online estimado.

## Explorar

Implementado:

- `/discover` con busqueda debounce.
- Filtro por categoria.
- Hero con metricas.
- Grid responsive de `CommunityCard`.
- Skeleton loading.
- Empty state con mascota alien.
- Panel derecho en desktop ancho con populares, online y nuevas.

Pendiente:

- Ordenacion real por trending/actividad.
- Paginacion.
- Filtros por visibilidad/idioma/tamano.
- Mejor UX de filtros en mobile, idealmente bottom sheet.

## Navegacion

Implementado:

- Sidebar desktop con logo, nav, "Tus Orbitas" con filas ligeras + dot live, y footer de perfil clickeable (avatar + nombre + handle).
- "Perfil" filtrado del sidebar desktop (redundante con avatar de topbar y footer del sidebar). En bottom nav mobile sigue.
- **TopBar desktop nueva** (`AppTopBar`, 68px) con mascot animado + saludo dinamico por hora ("Buenos dias / Buenas tardes / Buenas noches / Aun explorando") + "Hola {nombre}" + acciones search/bell/avatar.
- Bottom nav mobile con accion central de crear.
- Rutas protegidas con `ProtectedStack`.
- Tabs principales ocultando tab bar nativo de Expo Router.

Pendiente:

- Estados de notificaciones/unread reales (ahora el bell tiene dot fijo mock).
- Mejor indicacion del contexto actual en rutas profundas.
- Gestos o sheets moviles para acciones secundarias.

## Orbitas

Implementado:

- Crear Orbita con nombre, categoria, descripcion, normas, visibilidad, avatar y banner.
- Slug automatico.
- Creador entra como `owner`.
- Creacion/obtencion de conversacion comunitaria.
- Listado de comunidades.
- Unirse y salir.
- Detalle de Orbita con:
  - hero visual
  - badges
  - online users
  - posts
  - chat
  - miembros
  - normas
  - gestion para roles con permisos
- Tarjetas de comunidad con banner, avatar, descripcion, miembros, online y actividad.

Pendiente:

- Edicion de Orbita.
- Gestion completa de roles.
- Invitaciones y comunidades privadas reales.
- Multiples canales por Orbita.
- Eventos/misiones como entidad propia.

## Roles

Implementado:

- Tipos: `owner`, `admin`, `mod`, `helper`, `member`.
- `RoleBadge`.
- Helpers de permisos en `community-permissions`.
- RLS para acciones sensibles en Supabase.
- Tab de gestion visible para roles con herramientas.

Pendiente:

- UI completa para cambiar roles.
- Auditoria de acciones.
- Separar permisos de `helper` con mas detalle.
- Mejor feedback cuando RLS deniega una accion.

## Posts, Ecos y comentarios

Implementado:

- Crear post por Orbita.
- Tipos de post: debate, ayuda, fanart, encuesta, historia, recomendacion, evento.
- Detalle de post.
- Comentarios y replies basicos.
- Reacciones/Ecos: inspirar, me pasa, curiosidad, apoyo.
- Guardar/desguardar post.
- Reportar posts.
- Feed por comunidad.
- Feed service con modos `for-you`, `following`, `trending` preparado.

Pendiente:

- Feed principal tradicional si se decide convivir con mapa orbital.
- Media upload en posts mas pulido.
- Encuestas reales.
- Edicion/borrado desde UI.
- Paginacion/infinite scroll mas completa en todos los listados.

## Chats v2

Implementado (esquema en migraciones 006/007, UI desde cero):

- **Multiples chats por Orbita**. Esquema `conversations` ampliado con `name`, `description`, `avatar_url`, `banner_url`, `created_by`, `visibility`, `slow_mode_seconds`, `is_default`. Drop del unique index legacy.
- **Lobby auto-creado** al crear una Orbita (trigger `create_default_community_chat`). No se puede borrar ni transferir admin.
- **Roles dentro del chat**: `admin` (1 unico), `co_admin` (max 3), `member`, `banned`. RPC transaccionales `transfer_chat_admin`, `promote_to_co_admin`, `demote_from_co_admin`. Override de mods de la orbita.
- **Crear chat dentro de la orbita**: tab "Chats" de `CommunityDetailScreen` lista todos los chats con boton "Crear chat" → `CreateChatScreen` (banner + avatar + nombre + descripcion + visibilidad + slow mode).
- **`ChatListScreen` global**: agrupado por orbita, search en vivo, badges de unread/lobby/lock/rol, mensajes directos separados arriba. Sin boton crear (la creacion vive dentro de la orbita).
- **`ChatRoomScreen`**: 2 columnas desktop (chat + info panel), mobile fullscreen + overlay. Mark-read automatico. Scroll-to-end al enviar.
- **`MessageBubble`**: gradient violeta para propios, glassmorphism con border lateral por rol para ajenos. Dot en avatar para admin/co-admin. Acciones flotantes en hover (react, pin, unpin, report).
- **`MessageComposer`**: input auto-grow, slow mode countdown visible, contador de caracteres a >800, send disabled cuando vacio o en cooldown.
- **`PinnedBar`**: max 3 fijados, colapsable, mods pueden desfijar (trigger DB enforce el limite).
- **`ChatInfoPanel`**: hero con avatar + descripcion, miembros ordenados por rol con contador `X/3 co-admins`, acciones por miembro (promote/demote/transfer/kick/ban/ver perfil), boton salir con warning especial si eres admin.
- **`RoleBadge`** compact o full (Crown dorado / ShieldCheck cyan / UserX rojo).
- **`chat_audit_log`** tabla con acciones tipadas, poblado por SECURITY DEFINER, leer = mods.
- **`message_reactions`** tabla (1 emoji por user por mensaje) y servicios `reactToMessage`/`unreactToMessage` listos.
- **`setMuted` y `markRead`** por miembro implementados.
- Realtime para inserts en `messages`.
- Reportar mensajes.
- Modo demo con eventos locales (extendido para los nuevos campos).

Pendiente:

- `ChatSettingsScreen` (editar config + audit log UI + boton borrar chat).
- UI de reactions (picker + render de counts debajo del mensaje).
- Adjuntar imagenes desde composer (`media_urls` ya en schema).
- @mentions parsing + notificacion.
- `last_message` real y `unread_count` real en `listConversations`.
- Realtime de pinned + reactions (ahora solo messages).
- Aplicar `banner_url` del chat como fondo del MessageList con overlay.
- App-level: limite 5 chats activos por usuario por orbita.
- RPC `create_community_chat` (la usa `chat-service.createChat`) — NO existe, requiere migracion 008.
- Indicadores typing/presencia.

## Usuarios online / presencia

Implementado:

- `online_count` visual aproximado en servicios y demo.
- `OnlineIndicator`.
- `OnlineUsersBar`.
- `profiles.last_seen_at` preparado en migracion.

Pendiente:

- Realtime Presence o heartbeat.
- Actualizar `last_seen_at`.
- Diferenciar online, ausente y offline.
- Privacidad de presencia.

## Perfiles

Implementado:

- Perfil propio y ajeno.
- Perfil contextual por comunidad con rol y posts filtrados.
- Editar nombre visible, username, bio y avatar.
- Seguir usuario.
- Bloquear usuario.
- Reportar perfil.
- Abrir chat directo.

Pendiente:

- **Rediseno de `ProfileScreen` con estructura cerrada** (spec en `docs/SCREEN_PROFILE.md`): cabecera de identidad + tabs Publicaciones / Orbitas / Info, 3 modos (propio / ajeno / contextual), acciones limpias (propio solo "Editar perfil"; ajeno Seguir/Mensaje + `•••` con Bloquear/Reportar). Orden de trabajo: UI primero con datos existentes, servicios nuevos en 2a tanda.
- Banner real en perfil y editor (campo `banner_url` ya existe, falta pintarlo).
- Listado de Orbitas del usuario (tab Orbitas — `listJoinedCommunities` listo).
- Intereses visibles/editables (requiere `getUserInterests(userId)`; onboarding solo escribe).
- Stats sociales: seguidores/siguiendo (requiere servicio de conteo); orbitas/publicaciones salen del largo de las listas.
- Estado de follow real en UI (requiere `isFollowing`; hoy el follow es a ciegas).
- Bio por Orbita en modo contextual (columna nueva en `community_members` + `updateMembershipBio` + migracion + demo).
- Gestion de bloqueos.

## Moderacion, reportes y bloqueos

Implementado:

- `ReportModal`.
- Reportar post, mensaje y perfil; servicio soporta post, comment, message, profile, community.
- Cola de moderacion.
- Resolver/rechazar reportes.
- Ocultar post, comentario o mensaje.
- Notificacion tipo warning preparada.
- Bloqueos en servicio y politicas.

Pendiente:

- Permisos de moderacion mas visibles y auditables.
- Filtros de cola.
- Detalle de target reportado.
- Gestion de reportes por Orbita.
- UI de bloqueos.
- Sanciones escalables: warn, mute, kick, ban.

## Settings y notificaciones

Implementado:

- Ajustes de cuenta.
- Editar perfil.
- Panel de privacidad.
- Tema oscuro/claro.
- Logout.
- Notificaciones preparadas con `expo-notifications`.

Pendiente:

- Configuracion real de push con EAS project, FCM/APNs y channels.
- Preferencias de notificaciones por Orbita.
- Privacidad avanzada.

## Backend y demo

Implementado:

- Migrations Supabase.
- RLS.
- Seed.
- Storage buckets y policies.
- Edge Function opcional `moderation-action`.
- Demo service sin Docker.

Pendiente:

- Validar migraciones en entorno limpio.
- Tests de RLS.
- Rate limiting real en acciones sensibles.
- Observabilidad/logging.

## Web/deploy

Implementado/preparado:

- Expo web con Metro.
- `npx expo export --platform web`.
- Existe carpeta `dist` generada previamente.
- EAS configurado para Android.

Pendiente:

- Deploy web final.
- Revisar rutas web, metadata y favicon.
- QA responsive desktop/tablet/mobile.
- Configuracion de dominio, privacidad y soporte.
