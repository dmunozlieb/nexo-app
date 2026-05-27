# Roles y permisos de Orbita — Arquitectura, backend y logica

Documento autoritativo para implementar la capa de roles y permisos de comunidad. **Esta IA no debe tocar diseno visual**: estilos, componentes, layout y estetica los gestiona otra IA en paralelo. Aqui se define que existe, como se conecta y que falta para que el sistema de roles funcione de extremo a extremo y sirva de fundamento al resto de features.

> Punto de entrada para una IA backend o full-stack. Lee este doc primero. Para contexto general: `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `FEATURES.md`. Para chats y senales: `CHATS_ARCHITECTURE.md`, `SIGNALS_ARCHITECTURE.md` (este doc es la capa transversal sobre la que apoyan). Estado de la ultima sesion: `SESSION_2026-05-25.md`.

---

## 0. Resumen ejecutivo

Los roles definen quien puede que en una Orbita. Es una capa transversal: chats y Senales delegan en `is_community_moderator` y derivados. Hoy existe `community_members.role` con 5 valores (`owner, admin, mod, helper, member`) y helpers `is_community_member` / `is_community_moderator`. Faltan: el estado `banned`, RPCs para mover roles, transfer atomico de owner, auditoria, y una definicion real de que hace `helper`.

### Que cubre V1

1. Anadir **`banned`** al enum de `community_members.role`.
2. **Matriz de permisos definida** (ver §1.4) y reflejada en helpers + RPCs.
3. **RPCs atomicas**: `set_community_role`, `transfer_community_owner`, `ban_community_member`, `unban_community_member`, `kick_community_member`.
4. **`community_audit_log`** centralizado (esta tabla vive aqui, no en Senales).
5. **`helper`** definido como rol social: puede aceptar respuestas en help threads **ajenos**, sin poder de moderacion real.
6. **Hook `useCommunityPermissions`** para UX (no seguridad).
7. **3 tipos de notificacion**: `community_role_changed`, `community_banned`, `community_owner_received`.

### Que queda fuera de V1

- Sanciones temporales (mute por N dias, timeout por N horas) — V2.
- Bulk actions (banear varios a la vez) — V2.
- Roles cosmeticos custom o badges personalizados — V2/V3.
- Configuracion granular `community_role_permissions` mas alla de `community_post_permissions` (ya cubierto por Senales).
- Restaurar al rol previo al desbanear (V1 restaura a `member`; el rol previo queda en metadata del audit).

### Stack relevante

Supabase (PostgreSQL + RLS + RPCs), TanStack Query en cliente, modo demo en memoria.

---

## 1. Modelo de dominio

### 1.1 Conceptos

- **Rol de comunidad**: nivel de privilegio del usuario en la Orbita. Vive en `community_members.role`. Es el rol "primario" — los chats tienen su propio rol secundario por encima (ver `CHATS_ARCHITECTURE.md`).
- **Owner**: 1 unico por Orbita. Creador o quien reciba transferencia. No puede abandonar sin transferir.
- **Admin**: brazo derecho del owner. Hace casi todo, no puede borrar Orbita ni transferir owner.
- **Mod**: moderador de contenido y miembros. Banea, kickea, pinea, oculta. No asigna roles.
- **Helper**: rol social, sin poder de moderacion. Su unico privilegio diferencial: aceptar respuestas en help threads ajenos (ver `SIGNALS_ARCHITECTURE.md`).
- **Member**: miembro normal.
- **Banned**: miembro sancionado. Sigue en la tabla `community_members` para preservar historico, pero no puede publicar, comentar, reaccionar ni unirse a chats. Si la Orbita es publica, puede leer.

### 1.2 Tipos TypeScript autoritativos

Definidos en `src/types/domain.ts`. Cambio V1:

```ts
// AMPLIAR el tipo existente
export type CommunityRole =
  | "owner" | "admin" | "mod" | "helper" | "member" | "banned";

// NUEVO
export type CommunityAuditAction =
  | "role_changed"
  | "owner_transferred"
  | "member_kicked"
  | "member_banned"
  | "member_unbanned"
  | "signal_pinned"
  | "signal_unpinned"
  | "signal_deleted_by_mod"
  | "signal_hidden"
  | "signal_restored"
  | "comment_pinned"
  | "comment_unpinned"
  | "comment_deleted_by_mod"
  | "comment_hidden"
  | "permissions_changed";

export type CommunityAuditEntry = {
  id: string;
  community_id: string;
  actor_id: string | null;
  action: CommunityAuditAction;
  target_id: string | null;     // user_id o post_id o comment_id segun action
  metadata: Json;
  created_at: string;
};

export type CommunityPermissions = {
  // capacidades calculadas para el usuario actual en la Orbita
  can_edit_community: boolean;
  can_delete_community: boolean;
  can_transfer_owner: boolean;
  can_assign_admin: boolean;
  can_assign_mod_or_helper: boolean;
  can_ban_or_kick: boolean;
  can_moderate_content: boolean;
  can_pin_signal: boolean;
  can_accept_any_help_answer: boolean;
  can_view_audit_log: boolean;
  can_create_signal: boolean;
  can_create_chat: boolean;
  can_react_or_comment: boolean;
};
```

### 1.3 Jerarquia y reglas de orden

Para validar quien puede asignar que rol, se usa un orden estricto:

```
owner > admin > mod > helper > member > banned
```

Reglas derivadas:
- Solo el `owner` asigna `admin`.
- `admin` asigna `mod` y `helper`.
- `mod` no asigna nada.
- Nadie puede asignar un rol **igual o superior** al suyo via `set_community_role`.
- El paso a/desde `banned` no va por `set_community_role`: va por RPCs dedicadas (`ban_community_member`, `unban_community_member`).
- El paso a/desde `owner` no va por `set_community_role`: va por `transfer_community_owner`.

### 1.4 Matriz de permisos

| Accion | owner | admin | mod | helper | member | banned |
|---|---|---|---|---|---|---|
| Leer Orbita publica/unlisted | si | si | si | si | si | si |
| Leer Orbita privada (siendo miembro) | si | si | si | si | si | si* |
| Crear Senal | si | si | si | si | si | no |
| Reaccionar a Senal / Eco / comentar | si | si | si | si | si | no |
| Crear chat dentro de la Orbita | si | si | si | si | si | no |
| Marcar respuesta aceptada en help propio | si | si | si | si | si | no |
| Marcar respuesta aceptada en help ajeno | si | si | si | si | no | no |
| Editar info de Orbita | si | si | no | no | no | no |
| Borrar Orbita | si | no | no | no | no | no |
| Transferir owner | si | no | no | no | no | no |
| Asignar admin | si | no | no | no | no | no |
| Asignar mod / helper | si | si | no | no | no | no |
| Quitar mod / helper (degradar a member) | si | si | no | no | no | no |
| Banear miembro | si | si | si | no | no | no |
| Desbanear miembro | si | si | si | no | no | no |
| Kickear miembro (no banear) | si | si | si | no | no | no |
| Borrar / ocultar Senal ajena | si | si | si | no | no | no |
| Borrar / ocultar comentario ajeno | si | si | si | no | no | no |
| Pinear Senal | si | si | si | no | no | no |
| Configurar `community_post_permissions` | si | si | no | no | no | no |
| Ver `community_audit_log` | si | si | si | no | no | no |
| Moderar cualquier chat de la Orbita (override) | si | si | si | no | no | no |

*Nota sobre banned en Orbita privada: a discutir. **Decision V1**: si la Orbita es privada y un miembro es baneado, conserva la lectura (sigue como miembro). El "ban" en V1 silencia escritura, no expulsa. Si quieres expulsion completa, usa `kick`.

### 1.5 Invariantes de producto V1

| Invariante | Mecanismo |
|---|---|
| 1 solo `owner` por Orbita | Indice unico parcial `community_members_one_owner` |
| `owner` no puede salir sin transferir | Policy `community_members_delete_self_or_mod` + check en RPC `leave_community` |
| Caller solo asigna roles estrictamente por debajo del suyo | Validacion en `set_community_role` |
| Caller no se cambia su propio rol via `set_community_role` | Excepcion explicita en la RPC (excepto degradar self a member) |
| Banned no escribe nada | Helper `is_member_in_good_standing` (rol distinto de `banned`) usado por todas las policies de escritura |
| Cambios de rol auditados | Todas las RPCs sensibles escriben en `community_audit_log` |
| Insert en `community_audit_log` bloqueado fuera de RPC | Policy `with check (false)` |
| Owner que recibe transferencia debe ser miembro activo | Check en `transfer_community_owner` |

---

## 2. Esquema de base de datos

### 2.1 Cambios a `community_members`

```sql
-- Quitar el check antiguo y reemplazar con uno que incluya 'banned'
alter table public.community_members
  drop constraint if exists community_members_role_check;
alter table public.community_members
  add constraint community_members_role_check
  check (role in ('owner','admin','mod','helper','member','banned'));

-- Garantizar 1 solo owner por Orbita
create unique index if not exists community_members_one_owner
  on public.community_members(community_id)
  where role = 'owner';
```

### 2.2 Tabla nueva `community_audit_log`

```sql
create table if not exists public.community_audit_log (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null check (action in (
    'role_changed',
    'owner_transferred',
    'member_kicked',
    'member_banned',
    'member_unbanned',
    'signal_pinned',
    'signal_unpinned',
    'signal_deleted_by_mod',
    'signal_hidden',
    'signal_restored',
    'comment_pinned',
    'comment_unpinned',
    'comment_deleted_by_mod',
    'comment_hidden',
    'permissions_changed'
  )),
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists community_audit_log_community_idx
  on public.community_audit_log(community_id, created_at desc);
```

Esta tabla es la unica fuente de moderacion de comunidad. Las acciones de `signal_*` y `comment_*` enumeradas aqui son las que escribira la capa de Senales — el doc de Senales referencia este enum, no lo duplica.

### 2.3 Notificaciones

No requiere tablas nuevas. La tabla `notifications` existente acepta cualquier `type` text. Se anaden 3 tipos al copy del cliente:

- `community_role_changed`
- `community_banned`
- `community_owner_received`

Payloads en §9.

---

## 3. Helpers SQL

Lo que ya hay:

| Funcion existente | Devuelve |
|---|---|
| `is_community_member(community_id, user_id)` | boolean — esta en la tabla, **sin importar rol** |
| `is_community_moderator(community_id, user_id)` | boolean — `role in (owner, admin, mod)` |
| `can_read_community(community_id, user_id)` | boolean — visibilidad publica/unlisted o miembro |

Lo que hay que anadir:

```sql
-- Miembro y no baneado. Es el helper que deben usar las policies de ESCRITURA.
create or replace function public.is_member_in_good_standing(
  input_community_id uuid, input_user_id uuid
) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.community_members cm
    where cm.community_id = input_community_id
      and cm.user_id = input_user_id
      and cm.role <> 'banned'
  );
$$;

-- Devuelve el rol o NULL si no es miembro.
create or replace function public.community_member_role(
  input_community_id uuid, input_user_id uuid
) returns text
language sql stable security definer set search_path = public as $$
  select role from public.community_members
  where community_id = input_community_id and user_id = input_user_id
  limit 1;
$$;

-- Orden numerico de rol (para comparar jerarquia).
create or replace function public.community_role_rank(input_role text)
returns int language sql immutable as $$
  select case input_role
    when 'owner'  then 5
    when 'admin'  then 4
    when 'mod'    then 3
    when 'helper' then 2
    when 'member' then 1
    when 'banned' then 0
    else -1 end;
$$;

-- Helpers de capacidad (composables, sin parametrizar accion).
create or replace function public.can_edit_community(input_community_id uuid, input_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.community_role_rank(public.community_member_role(input_community_id, input_user_id)) >= 4;
$$;

create or replace function public.can_assign_mod_or_helper(input_community_id uuid, input_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.community_role_rank(public.community_member_role(input_community_id, input_user_id)) >= 4;
$$;

create or replace function public.can_accept_any_help_answer(input_community_id uuid, input_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.community_role_rank(public.community_member_role(input_community_id, input_user_id)) >= 2;
$$;
```

> Nota: `is_community_moderator` ya cubre el caso `>= 3` (mod o superior). Reutilizarla en vez de duplicar.

---

## 4. RPCs

Todas `SECURITY DEFINER`, `language plpgsql`, validacion al inicio, **siempre auditan** en `community_audit_log`.

### 4.1 `set_community_role`

```sql
public.set_community_role(
  input_community_id uuid,
  input_user_id uuid,
  input_new_role text  -- 'admin' | 'mod' | 'helper' | 'member'
) returns void
```

Validaciones (en orden):
- `auth.uid()` no nulo.
- `input_new_role in ('admin','mod','helper','member')`. **`owner` y `banned` no se asignan por aqui**.
- Caller es miembro activo de la Orbita.
- Caller rank > target_new_rank (estrictamente). Es decir, un `admin` (4) puede asignar `mod` (3), `helper` (2) o `member` (1). No puede asignar `admin` (4) — eso solo el owner via la rama dedicada de promote_to_admin (V1 dejamos al owner usar `set_community_role` para asignar `admin`; ver excepcion abajo).
- Excepcion: para asignar `admin`, caller debe ser `owner`. Si new_role = `admin`, exigir `owner`.
- Caller no es el target (no se modifica su propio rol).
- Target no es el `owner` (no se degrada owner por aqui — eso requiere transfer).
- Target no es `banned` (no se "asciende" un baneado por aqui — primero unban).

Side-effects:
- UPDATE `community_members.role`.
- INSERT en `community_audit_log` con action=`role_changed`, target_id=user_id, metadata=`{previous_role, new_role}`.
- INSERT en `notifications` para el target con type=`community_role_changed`.

### 4.2 `transfer_community_owner`

```sql
public.transfer_community_owner(
  input_community_id uuid,
  input_new_owner_id uuid
) returns void
```

Validaciones:
- Caller es el `owner` actual (`community_member_role` = 'owner').
- `input_new_owner_id` es miembro activo (no banned).
- `input_new_owner_id` != caller.

Side-effects (atomico, una transaccion):
- UPDATE el caller a `admin`.
- UPDATE el target a `owner`.
- UPDATE `communities.owner_id` al nuevo owner (la columna `owner_id` existe en el schema base — mantener sincronia).
- INSERT audit con action=`owner_transferred`, target_id=new_owner_id, metadata=`{previous_owner_id, previous_owner_new_role: 'admin'}`.
- INSERT notificacion para el nuevo owner con type=`community_owner_received`.

> Nota: la unique-index `community_members_one_owner` se respeta porque las dos updates van en la misma transaccion. Postgres valida el indice al COMMIT, asi que ambas updates compiten — para evitarlo:
>
> 1. Bajar al caller a `admin` primero.
> 2. Despues subir al target a `owner`.
>
> El orden importa, esta documentado en el cuerpo de la RPC.

### 4.3 `ban_community_member`

```sql
public.ban_community_member(
  input_community_id uuid,
  input_user_id uuid,
  input_reason text default null
) returns void
```

Validaciones:
- Caller es `is_community_moderator`.
- Target es miembro y no es `owner` ni el propio caller.
- Si target es `admin`, solo el owner puede banearlo.

Side-effects:
- Lee `previous_role` actual del target.
- UPDATE `role = 'banned'`.
- INSERT audit con action=`member_banned`, target_id=user_id, metadata=`{previous_role, reason}`.
- INSERT notificacion con type=`community_banned` (payload con `community_id`, `reason?`).

### 4.4 `unban_community_member`

```sql
public.unban_community_member(
  input_community_id uuid,
  input_user_id uuid
) returns void
```

Validaciones:
- Caller es `is_community_moderator`.
- Target tiene rol = `banned`.

Side-effects:
- UPDATE `role = 'member'`. **V1 no restaura el rol previo**; queda como `member`. El rol previo esta en el audit (`member_banned.metadata.previous_role`) si se quiere consultar.
- INSERT audit con action=`member_unbanned`, target_id=user_id.

### 4.5 `kick_community_member`

```sql
public.kick_community_member(
  input_community_id uuid,
  input_user_id uuid
) returns void
```

Validaciones:
- Caller es `is_community_moderator`.
- Target no es `owner` ni el propio caller.
- Si target es `admin`, solo el owner puede kickearlo.

Side-effects:
- DELETE de `community_members` (rompe la membresia, sin marcar `banned`).
- INSERT audit con action=`member_kicked`, target_id=user_id, metadata=`{previous_role}`.

> Diferencia con ban: el kick **borra la fila**; el usuario puede volver a unirse si la Orbita es publica. El ban **mantiene la fila** con `role='banned'`; el usuario no puede actuar ni re-unirse hasta que un mod desbanee.

### 4.6 `leave_community`

```sql
public.leave_community(input_community_id uuid) returns void
```

- Si caller es `owner`: error "transfiere primero".
- Si caller es `banned`: error "estas baneado, no puedes 'salir' voluntariamente".
- En cualquier otro caso: DELETE de la fila propia.

No audita (no es accion de moderacion, es salida voluntaria).

---

## 5. Triggers

| Trigger | Tabla | Cuando | Funcion |
|---|---|---|---|
| `set_communities_updated_at` | `communities` | BEFORE UPDATE | existente |
| (sin trigger especifico de roles en V1) | | | |

Si en V2 se anaden sanciones temporales, ahi habra un trigger de auto-expiracion. V1 no.

---

## 6. RLS

Habilitar en `community_audit_log`. Las policies existentes de `community_members` deben revisarse para incluir el flujo `banned`.

### 6.1 `community_audit_log`

```sql
alter table public.community_audit_log enable row level security;

create policy "community_audit_read_mods"
on public.community_audit_log for select
using (public.is_community_moderator(community_id, auth.uid()));

create policy "community_audit_insert_blocked"
on public.community_audit_log for insert
with check (false);
```

Inserts solo por RPCs `SECURITY DEFINER`.

### 6.2 Ajustes a `community_members`

```sql
-- Insert: self-join (sigue como esta, pero excluir 'banned')
drop policy if exists "community_members_insert_self" on public.community_members;
create policy "community_members_insert_self"
on public.community_members for insert
with check (
  user_id = auth.uid()
  and role = 'member'  -- al unirse, siempre member
);

-- Update: solo via RPC. Bloquear update directo desde cliente.
drop policy if exists "community_members_update_mods" on public.community_members;
create policy "community_members_update_via_rpc"
on public.community_members for update
using (false)
with check (false);

-- Delete: self (leave) o mod via RPC kick.
-- Como el kick va por RPC SECURITY DEFINER, la policy solo cubre el caso "self".
drop policy if exists "community_members_delete_self_or_mod" on public.community_members;
create policy "community_members_delete_self"
on public.community_members for delete
using (
  user_id = auth.uid()
  and role <> 'owner'
);
```

> Las RPCs `set_community_role`, `ban_community_member`, `unban_community_member`, `kick_community_member`, `transfer_community_owner` son `SECURITY DEFINER` — bypassean RLS. La policy `community_members_update_via_rpc` con `false` no las afecta, las protege de updates directos desde cliente.

### 6.3 Recordatorio: helper `is_member_in_good_standing`

Todas las policies de **escritura** en chats, Senales, comentarios, reactions, etc. deben usar `is_member_in_good_standing` en vez de `is_community_member` cuando sea relevante. Cosas a auditar tras esta migracion:

- `posts_insert_member` → debe usar `is_member_in_good_standing`.
- `post_reactions_insert_member` → idem.
- `comments_insert_member` → idem.
- `conversations_insert_community_member` (chats) → idem.
- `messages_insert_members_self` (chats) → ya filtra por `chat_member_role <> 'banned'`, pero conviene tambien comprobar el `banned` de Orbita para chats comunitarios.

Las policies de **lectura** mantienen `is_community_member` o `can_read_community` segun corresponda.

---

## 7. Cliente: servicios, hooks y reglas

### 7.1 Nuevo servicio `community-roles-service.ts`

Ubicacion sugerida: `src/features/communities/services/community-roles-service.ts`.

```ts
// Lectura
listAuditLog(communityId): Promise<CommunityAuditEntry[]>
getMyPermissions(communityId, userId): Promise<CommunityPermissions>

// Mutaciones (todas via RPC)
setCommunityRole(communityId, userId, newRole): Promise<void>
transferCommunityOwner(communityId, newOwnerId): Promise<void>
banCommunityMember(communityId, userId, reason?): Promise<void>
unbanCommunityMember(communityId, userId): Promise<void>
kickCommunityMember(communityId, userId): Promise<void>
leaveCommunity(communityId): Promise<void>
```

Patron identico al resto: `env.demoMode` con rama demo o `ensureNotDemo()`.

### 7.2 Hook `useCommunityPermissions(communityId)`

```ts
export function useCommunityPermissions(communityId?: string) {
  return useQuery({
    queryKey: ["community-permissions", communityId, currentUserId],
    queryFn: () => getMyPermissions(communityId ?? "", currentUserId ?? ""),
    enabled: Boolean(communityId && currentUserId),
    staleTime: 30_000,
  });
}
```

**Implementacion server-side**: RPC `community_my_permissions(input_community_id uuid)` que devuelve un row `CommunityPermissions` calculado a partir del rol del caller. Una sola llamada, no N consultas.

```sql
public.community_my_permissions(input_community_id uuid)
returns table (
  can_edit_community boolean,
  can_delete_community boolean,
  can_transfer_owner boolean,
  can_assign_admin boolean,
  can_assign_mod_or_helper boolean,
  can_ban_or_kick boolean,
  can_moderate_content boolean,
  can_pin_signal boolean,
  can_accept_any_help_answer boolean,
  can_view_audit_log boolean,
  can_create_signal boolean,
  can_create_chat boolean,
  can_react_or_comment boolean
)
```

Esta RPC NO es seguridad — es UX. Sirve para que el cliente oculte botones que el RLS rechazaria. Las validaciones reales viven en las RPCs y policies.

### 7.3 Hooks adicionales

```ts
useCommunityAuditLog(communityId)   // ["community-audit", communityId]
useSetRoleMutation()                // invalida community-members + community-permissions
useTransferOwnerMutation()          // invalida lo mismo + community details
useBanMemberMutation()              // invalida lo mismo
useUnbanMemberMutation()            // invalida lo mismo
useKickMemberMutation()             // invalida lo mismo
useLeaveCommunityMutation()         // invalida lista de comunidades del user
```

### 7.4 Mensajes de error mapeados

Las RPCs lanzan errores con texto claro en espanol. Mapper en `getErrorMessage` para no quemar copy:

| Error de RPC | Mensaje user-facing |
|---|---|
| `Authentication required` | `Necesitas iniciar sesion.` |
| `Only the owner can transfer` | `Solo el owner puede transferir la Orbita.` |
| `Cannot modify your own role` | `No puedes cambiar tu propio rol desde aqui.` |
| `Insufficient privileges` | `No tienes permisos suficientes para esta accion.` |
| `Target is already banned` | `Este usuario ya esta baneado.` |
| `Owner cannot leave without transferring` | `Como owner, primero transfiere la Orbita a otro miembro.` |

### 7.5 Modo demo

Mantener paridad: el demo-service debe simular el estado de roles en memoria, permitir ejecutar las RPCs mock (sin validacion real, solo side-effect) y mantener un `community_audit_log` en memoria para que la UI no se rompa.

---

## 8. Cross-feature: como impacta chats y Senales

### 8.1 Chats

- `is_chat_moderator(chat_id, user_id)` ya hace override con `is_community_moderator`. Tras esta migracion, **`is_community_moderator` sigue siendo `role in (owner,admin,mod)`** — no incluye `banned`. Correcto.
- Anadir comprobacion `is_member_in_good_standing` en la policy `conversations_insert_community_member` y en `messages_insert_members_self` para chats comunitarios.
- Un usuario `banned` de la Orbita **NO** debe poder enviar mensajes en chats de esa Orbita. Hoy `messages_insert_members_self` solo mira el rol de chat (`<> 'banned'` a nivel chat), no el de Orbita. **Esta es una grieta a tapar** — actualizar la policy.

### 8.2 Senales

- Todas las policies de escritura en `posts`, `post_reactions`, `comments`, `comment_reactions`, `post_event_rsvps`, `post_poll_votes` deben usar `is_member_in_good_standing`.
- La RPC `create_signal` ya menciona en su validacion "miembro y no banned" — esta es la concrecion.
- El `community_audit_log` de este doc cubre las acciones `signal_*` y `comment_*` enumeradas. El doc de Senales no las redefine.

### 8.3 Reportes

Sin cambios estructurales en V1. Si un usuario baneado abre un reporte, lo permitimos (no es escritura sobre la Orbita en si). Se podria cambiar mas adelante.

---

## 9. Notificaciones

Tipos a anadir en V1 al copy/mapper:

| Tipo | Cuando | Payload | Texto sugerido |
|---|---|---|---|
| `community_role_changed` | tu rol cambia (no a banned) | `{community_id, previous_role, new_role, by_user_id}` | "Tu rol en {orbita} es ahora {role}." |
| `community_banned` | te banean | `{community_id, reason?}` | "Has sido baneado de {orbita}." |
| `community_owner_received` | recibes transferencia de owner | `{community_id, previous_owner_id}` | "Eres el nuevo owner de {orbita}." |

Insercion centralizada en las RPCs correspondientes (`set_community_role`, `ban_community_member`, `transfer_community_owner`).

Notar que **no hay notificacion de `unban`** en V1. Se asume que si el user vuelve a la Orbita lo nota por si mismo, y no queremos saturar.

---

## 10. Estado de migraciones

Convencion: `siguiente_disponible` = el primer numero libre tras todo lo de chats (`009-013` reservado para chats backlog) o lo de Senales si Senales se aplica primero.

**Orden recomendado**: **Chats → Roles → Senales**. Roles antes que Senales porque Senales depende de `banned` y `community_audit_log`.

Migraciones de roles a crear (continuando despues de `008_create_chat_rpc.sql` y del backlog de chats):

| Mig | Contenido |
|---|---|
| `014_community_banned_role.sql` | Drop+add check en `community_members.role` incluyendo `banned` + unique index `community_members_one_owner` |
| `015_community_audit_log.sql` | Tabla `community_audit_log` + RLS (read mods, insert blocked) |
| `016_community_role_helpers.sql` | `is_member_in_good_standing`, `community_member_role`, `community_role_rank`, `can_edit_community`, `can_assign_mod_or_helper`, `can_accept_any_help_answer` |
| `017_community_role_rpcs.sql` | RPCs: `set_community_role`, `transfer_community_owner`, `ban_community_member`, `unban_community_member`, `kick_community_member`, `leave_community`, `community_my_permissions` |
| `018_community_role_policies.sql` | Update de policies en `community_members` (update via RPC, delete self) + ajustes en policies de `posts`, `post_reactions`, `comments`, `conversations`, `messages` para usar `is_member_in_good_standing` |

Si Senales se programa **despues** de Roles (recomendado), el doc de Senales (`SIGNALS_ARCHITECTURE.md`) referencia el `community_audit_log` ya creado en `015_*` en lugar de crear el suyo. Renumerar las migraciones de Senales empezando en **019** si se mantiene este orden.

Si por algun motivo se hace Senales **antes** que Roles, la tabla `community_audit_log` puede crearse alli (ver `SIGNALS_ARCHITECTURE.md §11.15`). En ese caso, la migracion `015_community_audit_log.sql` solo confirma el estado y no recrea la tabla (`create table if not exists`).

---

## 11. Lo que falta (backlog priorizado)

### P0 — Habilitar roles V1

#### 11.1 `banned` en enum + helper `is_member_in_good_standing`

- Aplicar migracion `014`.
- Validar que ninguna query SQL existente asume el enum cerrado de los 5 valores.
- Aceptacion: insertar un row con `role='banned'` funciona; el helper devuelve `false` para ese usuario.

#### 11.2 `community_audit_log` operativo

- Aplicar migracion `015`.
- RPCs de roles auditan correctamente.
- Aceptacion: cualquier accion de role/transfer/ban/kick deja una fila visible para mods.

#### 11.3 RPCs de roles funcionando

- Aplicar migraciones `016`, `017`.
- Tests de happy path + error path para cada una.
- Aceptacion: la UI puede llamar a las 6 RPCs y obtener errores legibles cuando deniega.

#### 11.4 Cerrar grieta de `banned` en chats y Senales

- Aplicar migracion `018` ajustando policies cross-feature.
- Revisar manualmente las policies de los archivos `002_rls_policies.sql` (manual), `006_chats_v2.sql` y las de Senales si ya existen.
- Aceptacion: un usuario `banned` de una Orbita no puede enviar mensajes en chats de esa Orbita ni reaccionar/comentar/postear.

#### 11.5 `community_my_permissions` RPC y hook

- Crear la RPC en migracion `017`.
- Crear hook `useCommunityPermissions` en cliente.
- Aceptacion: la UI puede llamar al hook y obtener los flags sin N consultas por boton.

### P1 — UX y feedback

#### 11.6 Pantalla de gestion de roles

- (Para la IA de diseno) Tab "Gestion" en `CommunityDetailScreen` con listado de miembros, su rol actual, acciones (asignar rol, banear, kickear). Esta IA solo deja los hooks listos.
- Aceptacion: los hooks `useSetRoleMutation`, `useBanMemberMutation`, etc. funcionan y el cache de members/permissions se invalida correctamente.

#### 11.7 Audit log visible

- (Para la IA de diseno) Vista de audit log con paginacion. Esta IA solo deja `useCommunityAuditLog`.
- Aceptacion: el hook devuelve las ultimas 50 entradas ordenadas desc.

#### 11.8 Mapeo de errores RPC a copy

- Implementar el mapper §7.4 en `getErrorMessage`.
- Aceptacion: errores user-facing en espanol claros.

### P2 — Diferido a V2

- Sanciones temporales (`banned_until`, timeout de N horas con job de auto-restauracion).
- Bulk actions.
- Restaurar rol previo al desbanear.
- Roles cosmeticos / badges custom.
- Configuracion granular `community_role_permissions` por feature mas alla de `community_post_permissions`.

### P3 — Tests y observabilidad

- Suite de tests de RLS:
  - `banned` no puede insertar Senal / comentario / mensaje / reaccion.
  - Mod no puede asignar admin (solo owner).
  - Owner no puede salir sin transferir.
  - Caller no puede cambiar su propio rol.
  - Audit log no se inserta desde cliente.
- Tests de RPCs:
  - `transfer_community_owner` mantiene el unique index `community_members_one_owner` sin violarlo.
  - Concurrent `ban_community_member` no deja estado inconsistente.

---

## 12. Decisiones cerradas (no volver a abrir)

- **`banned` es un rol**, no un flag separado. Paridad con chats.
- **Helper queda como rol social**, con un unico privilegio diferencial: aceptar respuestas en help ajenos. Sin moderacion.
- **`set_community_role` cubre admin/mod/helper/member**. `owner` y `banned` van por RPCs dedicadas.
- **Solo el owner asigna admin**. Un admin no puede crear otro admin.
- **Owner no puede abandonar sin transferir**. Forzado en RPC `leave_community`.
- **Unban restaura a `member`** en V1, no al rol previo. El rol previo queda en audit metadata.
- **Banned conserva lectura** en Orbita privada (sigue como miembro, solo se le silencia escritura).
- **Insert en `community_audit_log` bloqueado fuera de RPC**. Cliente nunca escribe directo.
- **`useCommunityPermissions` es UX, no seguridad**. Las validaciones reales viven en RLS/RPCs.
- **3 notificaciones V1**: role_changed, banned, owner_received. Sin notificacion de unban.

---

## 13. Reglas de oro para la IA que continue

1. **Roles van por RPC**. El cliente no escribe `community_members.role` directo bajo ninguna circunstancia. Las policies de UPDATE estan bloqueadas precisamente por eso.
2. **Auditar siempre las acciones sensibles** en `community_audit_log`. Si la accion no encaja en el enum, ampliar el enum en migracion nueva, no usar `metadata` como volcadero.
3. **`is_member_in_good_standing` para escritura, `is_community_member` para lectura**. No confundirlos.
4. **No relajar RLS**. Si una operacion no pasa, ajustar la RPC o la operacion cliente.
5. **El owner es 1 unico**. Cualquier operacion que cree riesgo de doble owner debe ir en transaccion y respetar el unique index.
6. **No tocar UI** salvo para mover logica al hook/servicio.
7. **Mantener paridad tipos / SQL / demo** en la misma sesion.
8. **Mensajes de error en espanol y claros** desde la RPC. El cliente solo los re-mapea.
9. **No reusar el enum de audit para chats**. Chats tiene su propio `chat_audit_log` con su propio enum. Son tablas distintas con scope distinto.
10. **Validar con `npm run typecheck` y `npm test`** antes de cerrar. Tests de RLS si tocas policies.

---

## 14. Mapa rapido de archivos

```
supabase/migrations/014_community_banned_role.sql        PENDIENTE — enum + unique owner
supabase/migrations/015_community_audit_log.sql          PENDIENTE — tabla audit + RLS
supabase/migrations/016_community_role_helpers.sql       PENDIENTE — helpers SQL
supabase/migrations/017_community_role_rpcs.sql          PENDIENTE — 6 RPCs + community_my_permissions
supabase/migrations/018_community_role_policies.sql      PENDIENTE — RLS de community_members + cross-feature

src/types/domain.ts                                       ampliar CommunityRole, nuevos types
src/features/communities/services/community-roles-service.ts   nuevo
src/features/communities/hooks/useCommunityRoles.ts            nuevo
src/features/communities/hooks/useCommunityPermissions.ts      nuevo
src/utils/community-permissions.ts                             revisar: hoy es UI-only, mantener pero alinear con server
src/services/demo-service.ts                                   anadir paridad demo
src/utils/errors.ts (getErrorMessage)                          anadir mapping de errores RPC
```

UI (no tocar logica desde aqui):

```
src/features/communities/screens/CommunityDetailScreen.tsx     tab Gestion (a disenar)
src/features/moderation/screens/*                              filtro por Orbita (a disenar)
```

---

## 15. Checklist de "primer commit" para la siguiente IA

Si te encargan empezar:

1. Aplicar migraciones de chats pendientes (005, 006, 007, 008) — bloqueo previo.
2. Aplicar migracion **014_community_banned_role.sql**.
3. Aplicar migracion **015_community_audit_log.sql**.
4. Aplicar migracion **016_community_role_helpers.sql**.
5. Aplicar migracion **017_community_role_rpcs.sql** con las 6 RPCs + `community_my_permissions`.
6. Aplicar migracion **018_community_role_policies.sql** ajustando policies cross-feature.
7. Ampliar `src/types/domain.ts` con `CommunityRole = ... | 'banned'`, `CommunityAuditAction`, `CommunityAuditEntry`, `CommunityPermissions`.
8. Crear `community-roles-service.ts` con las 6 funciones de mutacion + 2 de lectura.
9. Crear `useCommunityRoles.ts` con las mutations correspondientes.
10. Crear `useCommunityPermissions.ts`.
11. Anadir paridad demo en `demo-service.ts`.
12. Anadir mapper de errores RPC en `getErrorMessage`.
13. Validar `npm run typecheck`, `npm test`, y E2E: crear Orbita, asignar mod, banear miembro, intentar publicar siendo banned (debe fallar), desbanear, transferir owner, verificar que audit log refleja todo.
14. Si todo OK, dejar el path libre para que la IA de Senales empiece (renumerar migraciones de Senales a partir de **019**).
15. Actualizar este doc moviendo items de §11 a "implementado", reflejar en `FEATURES.md` y `ROADMAP.md`.
