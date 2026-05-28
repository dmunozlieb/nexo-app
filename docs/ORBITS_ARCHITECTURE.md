# Orbitas (comunidades) — Arquitectura del feature

Documento autoritativo de la **entidad Orbita** y sus superficies de producto. A diferencia de `CHATS_ARCHITECTURE.md` / `SIGNALS_ARCHITECTURE.md` / `ROLES_ARCHITECTURE.md` (solo backend/logica), este doc es **transversal**: cubre el modelo de datos, los servicios/hooks y las **pantallas** (mapa orbital de Home + detalle de Orbita), porque la Orbita es el contenedor sobre el que se apoyan roles, chats y senales.

> Punto de entrada para entender "que es una Orbita y como vive en la app". Para el detalle de cada subsistema: roles → `ROLES_ARCHITECTURE.md`, chats → `CHATS_ARCHITECTURE.md`, senales → `SIGNALS_ARCHITECTURE.md`. Spec visual de Home → `SCREEN_HOME.md`. Contexto general → `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`.

---

## 0. Resumen ejecutivo

- Una **Orbita** es una comunidad. A nivel de schema y codigo la tabla/tipo es `communities` (no renombrar); **"Orbita" vive solo en el copy de producto y la UI**.
- La pertenencia vive en `community_members` con un **rol** por usuario (`owner | admin | mod | helper | member`; `banned` pendiente — ver `ROLES_ARCHITECTURE.md`).
- La Orbita es el **contenedor** de: chats (`conversations` con `community_id`), senales (`posts`), roles y moderacion (`community_audit_log`, pendiente).
- Dos superficies de UI:
  1. **Home / mapa orbital** (`/home`): las Orbitas del usuario + recomendaciones como planetas en `GalaxyOrbitMap`.
  2. **Detalle de Orbita** (`/community/[id]`): pantalla propia, la de mayor permanencia. Tabs Senales · Destacados · Chats · Miembros · Info (+ Gestion para mods).
- Al crear una Orbita se crea su **Lobby** (chat por defecto) automaticamente (trigger, ver `CHATS_ARCHITECTURE.md`).

### Stack
Supabase (PostgreSQL + RLS + RPC + Storage), TanStack Query en cliente, modo demo en memoria (`src/services/demo-service.ts`), Expo Router para navegacion.

---

## 1. Modelo de dominio

### 1.1 Conceptos

- **Orbita (`communities`)**: comunidad con `slug`, `name`, `description`, `avatar_url`, `banner_url`, `owner_id`, `visibility`, `category`, `rules` (jsonb, lista de strings).
- **Miembro (`community_members`)**: `(community_id, user_id)` con `role` y `joined_at`.
- **Owner**: 1 unico por Orbita (creador o transferencia — invariante reforzada por `ROLES_ARCHITECTURE.md`, indice unico pendiente).
- **Visibilidad**: `public | unlisted | private` (`Visibility`). Hoy el listado solo trae `public` y `unlisted`.

### 1.2 Tipos TypeScript autoritativos

Definidos en `src/types/domain.ts` (no duplicar, importar):

```ts
export type Community = {
  id; slug; name; description; avatar_url; banner_url;
  owner_id; visibility: Visibility; category; rules: Json;
  created_at; updated_at;
};
export type CommunityMember = {
  community_id; user_id; role: CommunityRole; joined_at;
};
export type CommunityWithMeta = Community & {
  member_count: number;
  online_count?: number;        // hoy HEURISTICO (no presencia real)
  user_role?: CommunityRole | null;
  recent_post_count?: number;
  // flags de "vida" para el mapa (hoy opcionales / no poblados de forma fiable):
  new_posts_count?; active_chat?; event_today?; mission_active?;
};
export type CommunityMemberWithProfile = CommunityMember & { profile: Profile | null };
```

`CommunityRole` se define en `ROLES_ARCHITECTURE.md` (`owner|admin|mod|helper|member`, `banned` pendiente).

### 1.3 Invariantes

| Invariante | Estado |
|---|---|
| 1 owner por Orbita | Hoy por convencion (insert role='owner' al crear). Indice unico `community_members_one_owner` → **pendiente** (ROLES) |
| Al crear Orbita se crea su Lobby | Trigger `create_default_chat_on_community` (CHATS) |
| Owner no puede salir sin transferir | **Pendiente** (RPC `leave_community`, ROLES). Hoy `leaveCommunity` borra fila sin guard |
| Banned no escribe | **Pendiente** (rol `banned` + `is_member_in_good_standing`) |
| Rules es lista de strings saneada | Garantizado en `createCommunity` |

---

## 2. Esquema de base de datos

- `communities` y `community_members`: base en `001_init_schema.sql`.
- `003_community_product.sql`: anade `profiles.last_seen_at`, fija el check de `community_members.role` a 5 valores, y helpers de conversaciones.
- **Pendiente** (definido en otros docs, no aplicado): `banned` en el enum + `community_members_one_owner` (ROLES mig `014`), `community_audit_log` (ROLES `015` / SIGNALS `024`).

`online_count` **no existe en BD**: se calcula en el cliente (`communities-service.ts` → `Math.max(1, ceil(member_count * 0.35))`). Presencia real (via `profiles.last_seen_at` o Realtime presence) es backlog.

---

## 3. Servicios y hooks (lo real hoy)

`src/features/communities/services/communities-service.ts` (con rama `env.demoMode`):

| Funcion | Notas |
|---|---|
| `listCommunities({query, category})` | public/unlisted, limit 40 |
| `getCommunity(idOrSlug)` | por id o slug |
| `createCommunity(input, ownerId)` | inserta community + member owner + crea Lobby (`get_or_create_community_conversation`) |
| `getCommunityMembership(communityId, userId)` | fila del usuario o null |
| `listJoinedCommunities(userId)` | (ojo: `member_count: 0` placeholder) |
| `listCommunityMembers(communityId)` | con `profile` |
| `joinCommunity` / `leaveCommunity` | **INSERT/DELETE directos** (no RPC; sin guards de owner/banned) |
| `listCommunityPosts({communityId, userId})` | posts published, con reactions/saved |

Hooks (`src/features/communities/hooks/useCommunities.ts`), query keys:
`["communities", q, cat]`, `["community", idOrSlug]`, `["community-membership", id, userId]`, `["joined-communities", userId]`, `["community-members", id]`, `["community-posts", id, userId]`. Mutations: `useJoin/Leave/CreateCommunityMutation`.

Permisos UI: `src/utils/community-permissions.ts` (`canViewModTools`, `canEditCommunity`, `canManageRoles`, etc.). **Es UX, no seguridad** — el server real (`useCommunityPermissions` + RPC) esta pendiente (ROLES).

---

## 4. Superficies de UI y navegacion

### 4.1 Home — mapa orbital (`/home`)
- Host: `src/features/feed/screens/HomeFeedScreen.tsx`; mapa: `src/components/community/GalaxyOrbitMap.tsx`.
- Datos: `useCommunities()` + `useJoinedCommunities()` → planetas (tus Orbitas primero, recomendaciones despues).
- Tap en planeta → panel/bottom-sheet de detalle rapido → CTA "Entrar a la Orbita" navega a `/community/[id]`.
- Spec visual completa: `SCREEN_HOME.md`.

### 4.2 Detalle de Orbita (`/community/[id]`)
- Pantalla **propia y separada de Home** (decision de producto: es la de mas permanencia).
- Archivo: `src/features/communities/screens/CommunityDetailScreen.tsx` + componentes en `src/features/communities/components/`:
  - `FeaturedSignals.tsx` (Destacados: top de senales por Ecos, client-side).
  - `MembersByRole.tsx` (Miembros agrupados por rol; sin online — TODO presencia).
  - `OrbitInfoTab.tsx` (Info: descripcion, categoria, creacion, creador, equipo mod, normas, reportar comunidad, acciones admin).
- Estructura:
  - **Header**: banner, avatar, nombre, badges (categoria/miembros/online/rol), descripcion, acciones (Unirse/Salir, Crear senal, Chat).
  - **Tabs** (`CommunityTabs`): Senales · Destacados · Chats · Miembros · Info (+ Gestion si `canViewModTools`).
  - **Senales**: feed via `useCommunityPosts` (`PostCard`).
  - **Chats**: `useCommunityChats` (Lobby + chats; "ultimo mensaje/no leidos/activos" pendientes, CHATS).
  - **Info/Gestion**: reportar (`targetType:"community"`), acciones admin (editar/roles → "Proximamente" hasta RPC de roles).

### 4.3 Rutas relacionadas
```
app/(tabs)/home.tsx        mapa orbital
app/community/[id].tsx     detalle de Orbita
app/community/create.tsx   crear Orbita
app/(tabs)/create.tsx      crear senal (recibe communityId)
app/chat/[id].tsx          sala de chat (Lobby/canales)
app/profile/[id].tsx       perfil de miembro
```

---

## 5. Cross-feature: la Orbita como contenedor

| Subsistema | Relacion | Doc |
|---|---|---|
| **Roles** | `community_members.role` define permisos en toda la Orbita; chats y senales delegan en `is_community_moderator` | `ROLES_ARCHITECTURE.md` |
| **Chats** | `conversations.community_id`; Lobby auto; mods de Orbita moderan cualquier chat | `CHATS_ARCHITECTURE.md` |
| **Senales** | `posts.community_id`; feed, destacados, pins | `SIGNALS_ARCHITECTURE.md` |
| **Moderacion** | reportes `targetType:"community"`; audit log pendiente | ROLES/SIGNALS §audit |

---

## 6. Lo que falta (backlog priorizado)

### P0 — Integridad y seguridad de la Orbita
1. **Join/Leave por RPC** con invariantes: owner no sale sin transferir; respetar `banned`. Hoy son INSERT/DELETE directos (grieta). Depende de ROLES `017`.
2. **Owner unico** garantizado por indice (`community_members_one_owner`).
3. **`member_count` real** y coherente en todos los paths (hoy `listJoinedCommunities` devuelve `0`).

### P1 — Datos de "vida" reales
4. **Presencia online real** (sustituir la heuristica `*0.35`) via `last_seen_at` o Realtime presence → alimenta Home, badges y secciones Online de Miembros.
5. **Senales fijadas** (`post_pins`) para Destacados (SIGNALS `014`).
6. **Chats**: ultimo mensaje + no leidos por canal (CHATS §8.6).

### P2 — Gestion de Orbita (UI)
7. **Editar Orbita** (nombre, descripcion, banner, icono, categoria, normas) — pantalla + servicio `updateCommunity` (no existe).
8. **Gestion de roles** (asignar/banear/kick) — hooks de ROLES `useSetRoleMutation`, etc.
9. **`useCommunityPermissions`** server-side (sustituir el util UI-only).

### P3 — Descubrimiento
10. **Discover** (`/discover`): recomendaciones por intereses, busqueda, categorias.

### Fuera de scope (MVP)
- Eventos y misiones (no implementar; sin modelo de datos).
- Panel lateral desktop del detalle (follow-up de UI).

---

## 7. Decisiones cerradas (no reabrir)

- **Schema = `communities`/`community_members`**. "Orbita" es solo copy. No renombrar tablas/rutas a `orbit`.
- **Detalle en pantalla propia** (`/community/[id]`), separada de Home.
- **`online_count` es heuristico hoy** y debe migrar a presencia real; no construir features criticas asumiendo que es exacto.
- **Permisos UI != seguridad**: la barrera real vive en RLS/RPC (ROLES).
- **Sin eventos ni misiones en MVP.**

---

## 8. Reglas de oro

1. **No renombrar `community` a `orbit`** en codigo/schema/rutas.
2. **Acciones sensibles (rol/ban/transfer/leave-owner) por RPC**, nunca INSERT/UPDATE directo (cuando se implementen, ROLES).
3. **Pasar siempre por hooks/servicios**; no consultas Supabase directas en pantallas.
4. **Conservar modo demo** al tocar `communities-service`.
5. **Reutilizar componentes** (`PostCard`, `CommunityTabs`, `RoleBadge`, `AlienEmptyState`, `OrbitInfoTab`, etc.) antes de crear nuevos.
6. **Marcar el dato mock/heuristico** (p.ej. online) con comentario y no presentarlo como real.
7. **Validar** `npm run typecheck` y `expo export --platform web` antes de cerrar.

---

## 9. Mapa rapido de archivos

```
supabase/migrations/001_init_schema.sql        communities + community_members (base)
supabase/migrations/003_community_product.sql  role check + last_seen_at + conv helpers

src/types/domain.ts                            Community, CommunityMember, CommunityWithMeta, ...
src/features/communities/services/communities-service.ts   servicios (Supabase + demo)
src/features/communities/hooks/useCommunities.ts           hooks + query keys
src/features/communities/screens/CommunityDetailScreen.tsx detalle de Orbita
src/features/communities/screens/CreateCommunityScreen.tsx crear Orbita
src/features/communities/components/FeaturedSignals.tsx    tab Destacados
src/features/communities/components/MembersByRole.tsx      tab Miembros
src/features/communities/components/OrbitInfoTab.tsx       tab Info
src/components/community/GalaxyOrbitMap.tsx                mapa orbital (Home)
src/features/feed/screens/HomeFeedScreen.tsx              host del mapa
src/utils/community-permissions.ts                        permisos UI (no seguridad)

docs/SCREEN_HOME.md         spec visual Home
docs/ROLES_ARCHITECTURE.md  roles/permisos/audit
docs/CHATS_ARCHITECTURE.md  chats (Lobby, canales)
docs/SIGNALS_ARCHITECTURE.md senales (posts, destacados, pins)
```

---

## 10. Fases de implementacion (roadmap)

- **Fase 1 (hecha):** detalle de Orbita evolucionado — tabs Senales/Destacados/Chats/Miembros/Info, limpieza de mocks, componentes reutilizables. Todo client-side.
- **Fase 2:** Editar Orbita + gestion de roles (UI sobre hooks de ROLES cuando existan) + reportar/auditoria.
- **Fase 3:** presencia online real + datos de chat (ultimo mensaje/no leidos) + senales fijadas → Home y detalle "vivos" con datos reales.
- **Fase 4:** panel lateral desktop del detalle + Discover.
- **Backend transversal:** aplicar migraciones de chats (005-008) y luego roles (014-018) antes de cerrar P0.
