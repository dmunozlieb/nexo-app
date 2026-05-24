# Funcionalidades de Nexo

## Auth y onboarding

Implementado:

- Login con email/password.
- Registro con validacion de email, username, contrasena y terminos.
- Recuperar contrasena.
- Logout.
- Persistencia de sesion con Supabase Auth y AsyncStorage.
- Onboarding obligatorio con username, nombre visible, bio, avatar e intereses.
- Google OAuth preparado en servicio, pendiente configuracion real de provider/redirects.
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

- Sidebar desktop con logo, nav y "Tus Orbitas".
- Bottom nav mobile con accion central de crear.
- Rutas protegidas con `ProtectedStack`.
- Tabs principales ocultando tab bar nativo de Expo Router.

Pendiente:

- Estados de notificaciones/unread.
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

## Chats

Implementado:

- Lista de conversaciones.
- Chat room con mensajes.
- Composer con validacion.
- Realtime para inserts en `messages`.
- Conversaciones comunitarias por RPC.
- Conversaciones directas preparadas.
- Reportar mensajes.
- Modo demo con eventos locales.

Pendiente:

- `last_message` real en Supabase para lista.
- Unread counts reales.
- Read receipts.
- Adjuntos/media.
- Multiples canales por Orbita.
- Moderacion de chat mas visible.
- Indicadores de typing/presencia.

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

- Banner real en perfil y editor.
- Listado de Orbitas del usuario.
- Intereses visibles/editables.
- Stats sociales.
- Estado de follow real en UI.
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
