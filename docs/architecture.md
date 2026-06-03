# Arquitectura de Nexo

## Principio general

Nexo usa arquitectura por features. Las rutas de Expo Router viven en `app/`, la UI compartida en `src/components`, el dominio en `src/types`, los servicios por feature en `src/features/*/services`, los hooks de datos en `src/features/*/hooks`, y Supabase en `supabase/`.

Patron preferido:

```text
app route -> screen -> hook TanStack Query -> service -> Supabase o demo-service
```

Las pantallas componen UI y gestionan estados de interaccion. Los servicios hablan con Supabase o con el modo demo. Los componentes compartidos no deben conocer detalles del backend.

## Stack

- **Expo SDK 56** con `expo-router/entry`.
- **Expo Router** para navegacion por archivos.
- **React Native 0.85**, **React 19.2.3** y **React Native Web**.
- **TypeScript estricto** con `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes`.
- **Supabase** para Auth, DB, Storage, Realtime, RLS y funciones.
- **TanStack Query** para cache, queries, mutations e invalidaciones.
- **Zustand** para estado local pequeno (`themeMode`).
- **React Hook Form + Zod** para formularios.
- **Jest + jest-expo** para tests.
- **EAS** para builds nativas.

La documentacion oficial de Expo SDK 56 debe consultarse antes de modificar codigo: https://docs.expo.dev/versions/v56.0.0/

## Estructura de carpetas

```text
app/
  _layout.tsx                 providers globales y Stack raiz
  index.tsx                   redirect inicial segun auth/onboarding
  (auth)/                     login, registro, recuperar password
  (tabs)/                     home, discover, create post, chat, profile
  community/                  detalle y creacion de Orbitas
  chat/                       sala de chat
  post/                       detalle de post
  profile/                    perfil por id
  settings/                   ajustes y editar perfil
  moderation/                 cola de moderacion

src/
  components/
    brand/                    mascota e identidad
    community/                mapa orbital, roles, online users
    content/                  cards, posts, report modal
    layout/                   ScreenContainer, ProtectedStack
    navigation/               sidebar, bottom nav, tabs de comunidad
    ui/                       Button, TextInput, Badge, BottomSheet, etc.
  constants/                  constantes de posts y moderacion
  features/
    auth/
    chat/
    comments/
    communities/
    feed/
    moderation/
    posts/
    profile/
    search/
    settings/
  hooks/                      hooks genericos
  lib/                        Supabase, env, query client
  services/                   demo-service y storage-service
  stores/                     Zustand
  theme/                      tokens y useTheme
  types/                      domain y database
  utils/                      validation, sanitize, slug, format, permissions

supabase/
  migrations/                 schema, RLS, producto comunidades, storage
  functions/                  Edge Function opcional de moderacion
  policies.sql                politicas RLS completas
  seed.sql                    datos demo para Supabase local

tests/
  validation.test.ts          tests de validacion y sanitizacion
```

## Navegacion

`app/_layout.tsx` monta:

- `SafeAreaProvider`
- `WebInteractionReset`
- `QueryClientProvider`
- `AuthProvider`
- Stack raiz sin headers

`app/index.tsx` decide:

- sin sesion -> `/login`
- sesion sin onboarding -> `/onboarding`
- sesion completa -> `/home`

`app/(auth)/_layout.tsx` evita que usuarios autenticados vuelvan a login/registro.

`app/(tabs)/_layout.tsx` protege tabs y usa `AppNavigationFrame`. El tab bar nativo esta oculto; la navegacion real se renderiza con:

- `AppSidebar` en desktop (`width >= 980`)
- `AppBottomNav` en movil

Rutas principales:

- `/home`: sistema orbital (`HomeFeedScreen` + `GalaxyOrbitMap`)
- `/discover`: explorar Orbitas
- `/create`: crear post
- `/chat`: lista de chats
- `/profile`: perfil propio
- `/community/create`: crear Orbita
- `/community/[id]`: detalle de Orbita
- `/chat/[id]`: sala de chat
- `/post/[id]`: detalle de post
- `/profile/[id]`: perfil ajeno, opcionalmente con `communityId`
- `/settings`, `/settings/edit-profile`
- `/moderation`

Las rutas protegidas fuera de tabs usan `ProtectedStack`, que repite las comprobaciones de sesion/onboarding y envuelve la escena en `AppNavigationFrame`.

## Estado y datos

### Auth

`AuthProvider` restaura sesion desde Supabase o modo demo, carga perfil y expone:

- `initialized`
- `session`
- `profile`
- `isAuthenticated`
- `onboardingComplete`
- `refreshProfile`

El onboarding se considera completo cuando el perfil tiene `username`, `display_name` y el username no empieza por `nexo_`.

### Server state

TanStack Query vive en `src/lib/query-client.ts` con:

- `staleTime: 30_000`
- `gcTime: 10 min`
- `retry: 1` en queries
- `retry: 0` en mutations

Cada feature define query keys propias. Tras mutations se invalidan queries relacionadas, por ejemplo comunidades, miembros, posts, mensajes o perfil.

### Estado local

Zustand solo guarda UI local por ahora:

- `themeMode: "dark" | "light"`
- `setThemeMode`

No metas server state en Zustand si puede vivir en TanStack Query.

### Supabase

`src/lib/supabase.ts` crea cliente con:

- AsyncStorage para persistencia de auth.
- `autoRefreshToken` y `persistSession`.
- Realtime con limite `eventsPerSecond: 8`.

Variables:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_DEMO_MODE`

No uses service role key en cliente.

### Modo demo

`src/services/demo-service.ts` implementa datos en memoria para auth, Orbitas, posts, comentarios, chats, perfiles, reportes y moderacion. Cualquier servicio nuevo que toque flujo principal debe mantener alternativa demo si se espera probar sin Supabase.

## Backend y permisos

Supabase contiene:

- tablas: `profiles`, `interests`, `user_interests`, `communities`, `community_members`, `posts`, `post_reactions`, `comments`, `saved_posts`, `follows`, `conversations`, `conversation_members`, `messages`, `reports`, `blocks`, `notifications`.
- RLS habilitado para tablas publicas.
- politicas para visibilidad, miembros, autores, moderadores, chats, reportes y bloqueos.
- buckets de Storage para avatars, banners, post media y community assets.
- RPCs para conversaciones comunitarias/directas.
- Realtime publicado para `messages`; `comments` y `notifications` estan preparados.

Regla: toda decision sensible debe vivir en RLS, RPC o Edge Function. La UI solo oculta o muestra acciones; no debe ser la unica barrera de seguridad.

## Features y limites de dominio

Tipos centrales en `src/types/domain.ts`:

- `Visibility = "public" | "private" | "unlisted"`
- `CommunityRole = "owner" | "admin" | "mod" | "helper" | "member"`
- `PostType = "debate" | "help" | "fanart" | "poll" | "story" | "recommendation" | "event"`
- `ReactionType = "inspire" | "relate" | "curious" | "support"` (el Eco es una unica interaccion: el cliente solo escribe `inspire` y desde la migracion `009` el CHECK de `post_reactions` solo admite ese valor; los literales legacy quedan en la union por compat de lectura)
- `ConversationType = "direct" | "community"`
- `ReportTargetType = "post" | "comment" | "message" | "profile" | "community"`

Validaciones viven en `src/utils/validation.ts`. Sanitizacion de texto en `src/utils/sanitize.ts`. Permisos de comunidad para UI en `src/utils/community-permissions.ts`.

## Patrones a respetar

- Nuevas pantallas: ruta fina en `app/` que exporta una screen de `src/features/.../screens`.
- Nuevas consultas: servicio en `services`, hook en `hooks`, query key estable.
- Nuevas mutations: invalidar caches relacionadas.
- Formularios: React Hook Form + Zod.
- Imagenes: `storage-service.ts`, `expo-image-picker`, Supabase Storage o data URL en modo demo.
- Iconos: `lucide-react-native` cuando exista icono adecuado.
- Estilos: `StyleSheet`, tokens centralizados, `useTheme`.
- Responsive: `useWindowDimensions`, breakpoints locales coherentes con los existentes.
- Errores: `getErrorMessage` y estados `LoadingState`, `ErrorState`, `EmptyState`/`AlienEmptyState`.

## Riesgos conocidos

- `online_count` es aproximado, no presencia real.
- `listConversations` en Supabase devuelve `last_message: null`; el modo demo si calcula ultimo mensaje.
- Perfil muestra banner como bloque de color; la carga/edicion de banner de perfil no esta completa.
- Moderacion existe, pero necesita UX/permisos mas finos.
- Algunas copias no tienen acentos por compatibilidad/teclado historico; no mezcles estilos de copy sin revisar.
- `docs/architecture.md` fue sustituido por este `docs/ARCHITECTURE.md` para seguir el contrato de documentacion interna.

## Navegacion desktop con AppTopBar

`src/components/navigation/AppTopBar.tsx` se renderiza en desktop por `AppNavigationFrame` encima de cada screen autenticada (alto 68 px). Contiene saludo dinamico por hora con `NexoMascot`, search → `/discover`, bell con notif dot (mock), avatar → `/profile`. El item "Perfil" se filtra del sidebar desktop porque queda redundante con el avatar de la topbar y el footer del sidebar; sigue presente en el bottom nav mobile.

`AppSidebar` recibe ahora el `profile: Profile | null` para pintar el footer clickeable con avatar + display name + handle + icono settings (navega a `/profile`).

## Onboarding wizard

`src/features/auth/screens/OnboardingScreen.tsx` es ahora un wizard de 3 pasos (`quien`, `identidad`, `orbita`) con validacion incremental (`form.trigger([fields])`). Mantiene los datos entre pasos via React Hook Form. Fade entre pasos con `Animated`, respetando `prefers-reduced-motion`.

El backdrop (`OnboardingBackdrop`) usa solo gradiente base + 36 estrellas con animacion twinkle individual + vignette top/bottom. Sin nebulosas (se intentaron varias estrategias y todas quedaban geometricas). El card central usa BlurView + bg `rgba(9,12,28,0.78)` + shadow negro para profundidad.

Los intereses se mapean a emojis via `INTEREST_EMOJI` (`art→🎨`, `game→🎮`, `book→📚`, `music→🎵`, `code→💻`, `film→🎬`). Si el `icon` no esta mapeado, fallback `✨`.

## Chats v2 — esquema y arquitectura

A partir de la migracion 006 los chats dejan de ser "1 conversacion por orbita" y pasan a ser entidades configurables con roles y herramientas de moderacion.

### Tablas

- `conversations` ampliada con `name`, `description`, `avatar_url`, `banner_url`, `created_by`, `visibility` (`'public' | 'invite_only'`), `slow_mode_seconds`, `is_default`, `updated_at`. Drop del unique index `conversations_unique_community`. Nuevo unique parcial `conversations_one_default_per_community` (solo 1 lobby por orbita).
- `conversation_members` ampliada con `role` (`'admin' | 'co_admin' | 'member' | 'banned'`), `muted`, `last_read_at`. Unique parcial `conversation_members_one_admin` para garantizar un solo admin por chat.
- `chat_pinned_messages` (PK conversation_id+message_id) — trigger que rechaza si ya hay 3 fijados.
- `chat_audit_log` (acciones tipadas: chat_created/updated/deleted, role_granted/revoked, admin_transferred, member_kicked/banned/unbanned, message_pinned/unpinned, slow_mode_changed). Insert bloqueado por RLS y poblado solo por funciones SECURITY DEFINER.
- `message_reactions` (PK message_id+user_id+emoji).

### Helpers y RPC SQL

- `chat_member_role(chat_id, user_id) → text`
- `is_chat_admin(chat_id, user_id) → boolean`
- `is_chat_moderator(chat_id, user_id) → boolean` (incluye override de mods de la orbita)
- `chat_co_admin_count(chat_id) → int`
- RPC `transfer_chat_admin(chat_id, new_admin_id)` — atomico, audita.
- RPC `promote_to_co_admin(chat_id, user_id)` — enforce max 3 co-admins.
- RPC `demote_from_co_admin(chat_id, user_id)`.
- Trigger `create_default_community_chat` — al crear una orbita, auto-crea Lobby + agrega owner como admin.
- Pendiente: RPC `create_community_chat` que invoca `chat-service.createChat`. Necesita ser creada en una nueva migracion 008.

### RLS (migracion 007 — aplicar manualmente, NO usar la 002 que tiene `\ir`)

- `conversations_insert_community_member`: type=direct o (type=community y `is_community_member`).
- `conversations_update_mods`: `is_chat_moderator`.
- `conversations_delete_admin_or_mod`: NO se borra el lobby, admin del chat o mod orbita.
- `conversation_members_insert_self`: user_id = auth.uid().
- `conversation_members_update_mods`: mods del chat o self.
- `conversation_members_delete_self_or_mod`.
- `messages_insert_members_self`: sender = auth.uid() Y miembro Y NO baneado.

### Reglas de producto

- Max 3 co-admins por chat.
- Transfer admin baja al anterior a co-admin (si hay hueco), sino a member.
- Cualquier miembro de la orbita puede crear chats. App-level pendiente: limitar a 5 por usuario.
- Lobby (`is_default = true`) no se puede borrar ni transferir admin — lo gestiona el owner de la orbita.
- Mods/owner de la orbita pueden moderar/borrar cualquier chat de su orbita.
- V1: solo `public` + `invite_only`. Skip `private` full-hidden para mantener RLS simple.

## Migraciones (estado actual)

- `001_init_schema.sql` aplicada.
- `002_rls_policies.sql` — contiene `\ir ../policies.sql` que el SQL Editor de Supabase no ejecuta. Las policies originales se aplicaron pegando `policies.sql` manualmente.
- `003_community_product.sql` aplicada.
- `004_storage_banner_upload_policies.sql` aplicada.
- `005_auto_create_profile.sql` — trigger auto-create profile + seed intereses. **Pendiente de aplicar**.
- `006_chats_v2.sql` — esquema chats v2 + helpers + RPC + triggers + RLS de nuevas tablas. **Pendiente de aplicar**.
- `007_chats_v2_policies.sql` — RLS explicito sin `\ir`, compatible con SQL Editor. **Pendiente de aplicar — sin esto da 403 al crear chats**.
- `008_create_community_chat_rpc.sql` — **NO existe todavia**. Necesario porque `chat-service.createChat` usa RPC `create_community_chat`.
