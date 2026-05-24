# Arquitectura

Nexo usa arquitectura por features. Cada feature agrupa servicios Supabase, hooks TanStack Query, tipos y pantallas cuando aplica. La UI base vive en `src/components` y los tokens en `src/theme`.

## Capas

- `app/`: rutas, layouts protegidos y tabs.
- `src/features/*/services`: acceso a Supabase y operaciones de dominio.
- `src/features/*/hooks`: queries, mutations, realtime e invalidacion.
- `src/features/*/screens`: composicion de UI y formularios.
- `src/components`: piezas reutilizables sin conocimiento de backend.
- `supabase`: schema, RLS, seed y funciones.

## Flujo de auth

1. `AuthProvider` restaura sesion persistente desde Supabase.
2. `app/index.tsx` redirige a login, onboarding o home.
3. Los layouts protegidos verifican sesion y perfil completo.
4. El trigger `handle_new_user` crea un perfil inicial.
5. Onboarding actualiza username, display name, bio, avatar e intereses.

## Datos y permisos

Las reglas sensibles viven en PostgreSQL:

- Solo miembros publican en una Orbita.
- Autor o moderador puede editar/ocultar contenido.
- Mensajes solo son visibles para miembros de la conversacion.
- Bloqueos reducen visibilidad entre perfiles.
- Reportes los leen reporter y moderadores correspondientes.

## Realtime

La tabla `messages` esta en la publicacion `supabase_realtime`. El hook `useMessageSubscription` actualiza el cache local de mensajes por conversacion. Comentarios y notificaciones quedan preparados en la publicacion para activar experiencias en vivo despues.

## Performance

- `FlatList` para feed, comunidades, chat y perfiles.
- Paginacion infinita en feed.
- Invalidacion granular tras reacciones, guardados, posts y comentarios.
- `expo-image` para carga optimizada.
- Componentes visuales pequenos y sin consultas directas.

## Styling

El sistema de estilos usa tokens centralizados para colores, spacing, radios y tipografia. Dark mode es el modo inicial y light mode esta preparado en `palette.light`.

## Rediseño social/cosmico

La UI usa componentes reutilizables como `GradientCard`, `SectionTabs`, `RoleBadge`, `OnlineUsersBar` y `NexoMascot` para mantener una identidad alien/futurista sin acoplar pantallas a estilos puntuales.

Las Orbitas son el nucleo del producto: tienen creacion desde la app, membresia automatica del creador como Admin/owner, feed propio, sala general y tabs de posts, chats, miembros, normas e info.

## Roles

Los roles soportados son `owner`, `admin`, `mod`, `helper` y `member`.

- `owner/admin`: gestion critica de comunidad y roles.
- `mod`: moderacion de posts, reportes y miembros.
- `helper`: acceso visual a herramientas de apoyo y revision basica.
- `member`: publicar, comentar, reaccionar, chatear y reportar.

La UI usa helpers en `src/utils/community-permissions.ts`, pero las comprobaciones sensibles deben seguir viviendo en Supabase/RLS o Edge Functions.

## Perfiles contextuales y presencia

El perfil puede abrirse con `communityId` para mostrar rol, fecha de union y posts de ese usuario dentro de una Orbita concreta.

La presencia online empieza como aproximacion visual (`online_count` derivado de miembros en demo/cliente). La migracion `003_community_product.sql` añade `profiles.last_seen_at` para evolucionar hacia presencia real con updates periodicos o Realtime Presence.
