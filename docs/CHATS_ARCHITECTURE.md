# Chats de Nexo — Arquitectura, backend y logica

Documento autoritativo para implementar el backend, datos, permisos y logica de los chats de Nexo. **Esta IA no debe tocar diseno visual**: estilos, componentes, layout y estetica los gestiona otra IA en paralelo. Aqui se define que existe, como se conecta y que falta para que el chat funcione correctamente de extremo a extremo.

> Punto de entrada para una IA backend o full-stack que va a continuar trabajando en chats. Lee este doc primero. Si necesitas contexto general del producto consulta `PROJECT_CONTEXT.md`, `ARCHITECTURE.md`, `FEATURES.md`. El estado de la ultima sesion vive en `SESSION_2026-05-25.md`.

---

## 0. Resumen ejecutivo

- Los chats de Nexo son entidades configurables ligadas a Orbitas (`type='community'`) o entre dos usuarios (`type='direct'`).
- Una Orbita tiene **multiples chats**. Al crearse, se crea automaticamente un chat por defecto llamado **Lobby** (`is_default=true`).
- Dentro de cada chat hay **roles propios** independientes del rol que el usuario tenga en la Orbita: `admin` (1 unico), `co_admin` (max 3), `member`, `banned`.
- Los moderadores y owner de la Orbita pueden moderar **cualquier chat** de su Orbita por override (`is_chat_moderator` lo contempla).
- Las acciones sensibles (transferir admin, promover, degradar, crear chat) viajan por **RPCs `SECURITY DEFINER`** que escriben tambien en `chat_audit_log`.
- El cliente hace inserts/updates simples cuando hay RLS suficiente (mensajes, reacciones, pinned, mute/read).
- **Realtime activo solo para `messages`**. Falta extender a `chat_pinned_messages`, `message_reactions` y `conversation_members`.

Stack relevante: Supabase (PostgreSQL + RLS + Realtime + RPCs), TanStack Query en cliente, modo demo en memoria como fallback (`src/services/demo-service.ts`).

---

## 1. Modelo de dominio

### 1.1 Conceptos

- **Conversation**: contenedor de mensajes. Tiene `type` (`'direct' | 'community'`), configuracion (`name`, `description`, `avatar_url`, `banner_url`, `visibility`, `slow_mode_seconds`, `is_default`) y, si es comunitaria, un `community_id`.
- **ConversationMember**: pertenencia de un usuario a un chat con su rol especifico de chat (`admin | co_admin | member | banned`), su flag `muted` y su `last_read_at`.
- **Message**: contenido publicado dentro de un chat. Tiene `body` saneado, `media_urls` (todavia sin uso real), `status` (`sent | hidden | deleted`).
- **ChatPinnedMessage**: vinculo conversation_id+message_id de un mensaje fijado. Max 3 simultaneos.
- **MessageReaction**: emoji por usuario por mensaje (PK composite). Un usuario puede aportar varios emojis distintos al mismo mensaje, pero no repetir el mismo emoji.
- **ChatAuditEntry**: bitacora inmutable de acciones de moderacion del chat.

### 1.2 Tipos TypeScript autoritativos

Definidos en `src/types/domain.ts`. No duplicar en otros archivos: importarlos.

```ts
export type ChatVisibility = "public" | "invite_only";
export type ChatRole = "admin" | "co_admin" | "member" | "banned";
export type ChatAuditAction =
  | "chat_created" | "chat_updated" | "chat_deleted"
  | "role_granted" | "role_revoked" | "admin_transferred"
  | "member_kicked" | "member_banned" | "member_unbanned"
  | "message_pinned" | "message_unpinned"
  | "slow_mode_changed";
export type MessageStatus = "sent" | "hidden" | "deleted";
export type ConversationType = "direct" | "community";
```

Entidades principales (resumen — referencia completa en `domain.ts:119-176`):

- `Conversation` — schema 1:1 con la tabla `conversations`.
- `ConversationMember` — schema 1:1 con `conversation_members`.
- `Message` — schema 1:1 con `messages`.
- `ChatPinnedMessage`, `MessageReaction`, `ChatAuditEntry` — schema 1:1.
- `ConversationPreview = Conversation & { community, last_message, unread_count, member_count, role }` — para listado.
- `ConversationMemberWithProfile = ConversationMember & { profile }`.
- `MessageWithMeta = Message & { sender, reactions: { emoji, count, reacted_by_me }[], is_pinned }`.
- `ChatDetails = { conversation, members, pinned_messages, current_user_role }`.

### 1.3 Invariantes de producto

| Invariante | Mecanismo de garantia |
|---|---|
| 1 solo `admin` por chat | Unique index parcial `conversation_members_one_admin` |
| 1 solo `Lobby` por Orbita | Unique index parcial `conversations_one_default_per_community` |
| Max 3 co-admins por chat | RPC `promote_to_co_admin` valida con `chat_co_admin_count` |
| Max 3 pinned por chat | Trigger `enforce_pinned_limit` antes de insert |
| 1 emoji por (mensaje, usuario, emoji) | PK composite en `message_reactions` |
| Lobby no se borra ni se transfiere admin | Policy `conversations_delete_admin_or_mod` exige `is_default = false`. **Falta enforce explicito en `transfer_chat_admin` (ver §6.1)**. |
| Banned no puede enviar mensajes | Policy `messages_insert_members_self` exige `chat_member_role <> 'banned'` |
| Transfer admin no deja al cedente sin nada | RPC `transfer_chat_admin` lo coloca como `co_admin` o `member` |
| Solo miembros de la Orbita crean chats en ella | RPC `create_community_chat` y policy `conversations_insert_community_member` |
| Slow mode 0-300s | CHECK constraint en la columna |

---

## 2. Esquema de base de datos

Ubicacion: `supabase/migrations/00{1,3,6,7,8}_*.sql`. Las relevantes para chats son **006, 007, 008**.

### 2.1 Tabla `conversations`

```sql
-- columnas heredadas: id, type, community_id, created_at
-- ampliadas en 006:
name              text
description       text
avatar_url        text
banner_url        text
created_by        uuid references profiles(id) on delete set null
visibility        text not null default 'public'
                  check (visibility in ('public', 'invite_only'))
slow_mode_seconds int  not null default 0
                  check (slow_mode_seconds between 0 and 300)
is_default        boolean not null default false
updated_at        timestamptz not null default now()
```

Indices:

- Drop `conversations_unique_community` (legacy 1 chat por Orbita).
- `conversations_one_default_per_community` UNIQUE parcial sobre `community_id` donde `is_default = true and community_id is not null`.

Trigger: `conversations_updated_at` ejecuta `public.set_updated_at()` antes de update.

### 2.2 Tabla `conversation_members`

```sql
-- columnas heredadas: conversation_id, user_id, joined_at
-- ampliadas en 006:
role         text not null default 'member'
             check (role in ('admin','co_admin','member','banned'))
muted        boolean not null default false
last_read_at timestamptz
```

Indices:

- `conversation_members_one_admin` UNIQUE parcial sobre `conversation_id` donde `role = 'admin'`.

### 2.3 Tabla `messages`

Sin cambios estructurales en 006. Heredada de la migracion 001:

```
id, conversation_id, sender_id, body, media_urls (text[]), status, created_at
```

`status = 'sent'` es el unico estado que la app pinta como mensaje activo; los demas (`hidden`, `deleted`) son para moderacion.

### 2.4 Tabla `chat_pinned_messages`

```sql
conversation_id uuid references conversations(id) on delete cascade,
message_id      uuid references messages(id) on delete cascade,
pinned_by       uuid references profiles(id) on delete set null,
pinned_at       timestamptz default now(),
primary key (conversation_id, message_id)
```

Trigger BEFORE INSERT `enforce_pinned_limit`: si ya hay 3 filas con ese `conversation_id`, lanza excepcion `'Maximo 3 mensajes fijados por chat'`.

### 2.5 Tabla `chat_audit_log`

```sql
id uuid primary key default gen_random_uuid(),
conversation_id uuid not null references conversations(id) on delete cascade,
actor_id uuid references profiles(id) on delete set null,
action text not null check (action in (
  'chat_created','chat_updated','chat_deleted',
  'role_granted','role_revoked','admin_transferred',
  'member_kicked','member_banned','member_unbanned',
  'message_pinned','message_unpinned','slow_mode_changed'
)),
target_id uuid,
metadata jsonb not null default '{}',
created_at timestamptz default now()
```

Indice `chat_audit_log_conversation_idx (conversation_id, created_at desc)`.

**Insert directo bloqueado por RLS** (`chat_audit_insert_blocked` con `with check (false)`). Solo se escribe desde funciones `SECURITY DEFINER`.

### 2.6 Tabla `message_reactions`

```sql
message_id uuid references messages(id) on delete cascade,
user_id    uuid references profiles(id) on delete cascade,
emoji      text check (char_length(emoji) between 1 and 8),
created_at timestamptz default now(),
primary key (message_id, user_id, emoji)
```

Indice `message_reactions_message_idx (message_id)`.

---

## 3. Helpers SQL

Definidos en `006_chats_v2.sql`. Todos `SECURITY DEFINER`, `stable`, `search_path = public`.

| Funcion | Devuelve | Uso |
|---|---|---|
| `chat_member_role(chat_id, user_id)` | `text` o NULL | Rol del usuario en el chat |
| `is_chat_admin(chat_id, user_id)` | `boolean` | `chat_member_role = 'admin'` |
| `is_chat_moderator(chat_id, user_id)` | `boolean` | admin o co_admin **o** `is_community_moderator(community_id, user_id)` |
| `chat_co_admin_count(chat_id)` | `int` | Para el limite de 3 |
| `is_conversation_member(chat_id, user_id)` | `boolean` | Heredada de 001/003. Usada por RLS de lectura |

Nota: `is_chat_moderator` **incluye override de mods/owner de la Orbita**. Esto es deliberado: el lobby no tiene "admin" propio mas alla del owner inicial, y los mods de la Orbita deben poder actuar sobre cualquier chat de su Orbita.

---

## 4. RPCs

Todas `SECURITY DEFINER`, `language plpgsql`. Las funciones que mutan estado **deben auditar** en `chat_audit_log`. Si anades una RPC nueva, mantenlo.

### 4.1 `create_community_chat` (migracion 008)

```sql
public.create_community_chat(
  input_community_id uuid,
  input_name text,
  input_description text default null,
  input_avatar_url text default null,
  input_banner_url text default null,
  input_visibility text default 'public',
  input_slow_mode_seconds int default 0
) returns public.conversations
```

Validaciones:

- `auth.uid() is not null`.
- `is_community_member(community_id, caller)`.
- `char_length(trim(name))` entre 2 y 50.
- `visibility in ('public','invite_only')`.
- `slow_mode_seconds in [0, 300]`.

Side-effects: inserta el chat, inserta el creador como `admin`, audita `chat_created`.

### 4.2 `transfer_chat_admin`

```sql
public.transfer_chat_admin(
  input_conversation_id uuid,
  input_new_admin_id uuid
) returns void
```

Comprobaciones:

- Caller es `admin` del chat (`is_chat_admin`).
- El destinatario es miembro con rol `co_admin` o `member`.

Logica:

- Si hay 3 co-admins ya → el anterior admin pasa a `member`.
- Si hay hueco → el anterior admin pasa a `co_admin`.
- Inserta `admin_transferred` en audit con metadata `{previous_admin_role}`.

**Carencia conocida**: no bloquea transferir el Lobby. Ver §6.1.

### 4.3 `promote_to_co_admin`

- Caller debe ser `admin`.
- `chat_co_admin_count < 3`.
- Solo opera si target es `member` (no degrada admin ni promueve a banned).
- Audita `role_granted`.

### 4.4 `demote_from_co_admin`

- Caller debe ser `admin`.
- Solo opera si target es `co_admin`.
- Audita `role_revoked`.

### 4.5 RPCs heredadas reutilizadas

- `get_or_create_community_conversation(input_community_id uuid)` — heredada de 003. Devuelve el lobby si existe, lo crea si no. **Verificar**: tras 006, podria entrar en conflicto con `create_default_community_chat`. Si hay duda, leer 003 y armonizar — pero esta funcion sigue siendo necesaria para abrir el chat por defecto de una Orbita sin conocer el `conversation_id`.
- `get_or_create_direct_conversation(input_other_user_id uuid)` — heredada. Devuelve o crea la DM entre el caller y el target.

---

## 5. Triggers

| Trigger | Tabla | Cuando | Funcion |
|---|---|---|---|
| `conversations_updated_at` | `conversations` | BEFORE UPDATE | `set_updated_at()` |
| `create_default_chat_on_community` | `communities` | AFTER INSERT | `create_default_community_chat()` — inserta el Lobby + admin |
| `pinned_messages_limit` | `chat_pinned_messages` | BEFORE INSERT | `enforce_pinned_limit()` — max 3 |

---

## 6. RLS

Habilitado en: `conversations`, `conversation_members`, `messages`, `chat_pinned_messages`, `chat_audit_log`, `message_reactions`.

Las policies criticas viven en **`007_chats_v2_policies.sql`** (compatible con SQL Editor de Supabase, sin `\ir`). Para las tablas nuevas las policies viven dentro de **`006_chats_v2.sql`**.

### 6.1 `conversations`

| Operacion | Policy | Quien |
|---|---|---|
| select | `conversations_read_members` | `is_conversation_member` |
| insert | `conversations_insert_community_member` | auth + (`type='direct'` o `is_community_member`) |
| update | `conversations_update_mods` | `is_chat_moderator` |
| delete | `conversations_delete_admin_or_mod` | `is_default = false` y (`is_chat_admin` o `is_community_moderator`) |

### 6.2 `conversation_members`

| Operacion | Policy | Quien |
|---|---|---|
| select | `conversation_members_read_self` | `is_conversation_member` |
| insert | `conversation_members_insert_self` | `user_id = auth.uid()` |
| update | `conversation_members_update_mods` | `is_chat_moderator` o self |
| delete | `conversation_members_delete_self_or_mod` | self o `is_chat_moderator` |

> Implicaciones: `setMuted` y `markRead` funcionan por la rama "self" de update.
> El cliente nunca hace UPDATE de `role` directamente — eso pasa solo por las RPCs.

### 6.3 `messages`

| Operacion | Policy |
|---|---|
| select | `messages_read_members` — `is_conversation_member` |
| insert | `messages_insert_members_self` — `sender_id = auth.uid()` y miembro y NO `banned` |
| update | `messages_update_sender_or_mod` |
| delete | `messages_delete_sender_or_mod` |

### 6.4 `chat_pinned_messages`

| Operacion | Policy |
|---|---|
| select | `chat_pinned_read_members` — miembro del chat |
| all (insert/update/delete) | `chat_pinned_manage_mods` — `is_chat_moderator` |

### 6.5 `chat_audit_log`

| Operacion | Policy |
|---|---|
| select | `chat_audit_read_mods` — `is_chat_moderator` |
| insert | `chat_audit_insert_blocked` — `with check (false)` (solo SECURITY DEFINER) |

### 6.6 `message_reactions`

| Operacion | Policy |
|---|---|
| select | `message_reactions_read_members` — miembro del chat del mensaje |
| insert | `message_reactions_write_self` — `user_id = auth.uid()` y miembro del chat |
| delete | `message_reactions_delete_self` — `user_id = auth.uid()` |

> Nota: no hay policy de UPDATE. Las reacciones son insert/delete; cambiar emoji = delete + insert.

---

## 7. Cliente: servicios, hooks y reglas

### 7.1 Servicio (`src/features/chat/services/chat-service.ts`)

Patron: cada funcion tiene su rama demo via `env.demoMode` o lanza `ensureNotDemo()` para flujos avanzados sin demo. No anadir `console.log`. Errores se propagan tal cual a TanStack Query.

**Lectura**

- `listConversations(userId): ConversationPreview[]` — `last_message: null`, `unread_count: 0`, `member_count: 0` (placeholders, ver §8).
- `listCommunityChats(communityId): Conversation[]` — ordena `is_default desc, created_at asc`.
- `getConversation(id): Conversation | null`.
- `getChatDetails(id, userId): ChatDetails` — agrupa `getConversation + listChatMembers + listPinnedMessages`.
- `listChatMembers(id): ConversationMemberWithProfile[]`.
- `listPinnedMessages(id): MessageWithMeta[]`.
- `listChatAuditLog(id): ChatAuditEntry[]` — limit 50, desc.
- `listMessages(id)` — limit 80, asc, filtra `status='sent'`.
- `listMessageReactions(messageIds[]): MessageReaction[]`.

**Lifecycle**

- `createChat(input, creatorId)` — invoca RPC `create_community_chat`.
- `updateChat(id, patch)` — UPDATE directo sobre `conversations` (RLS de mods aplica).
- `deleteChat(id)` — DELETE directo (RLS exige no-default + admin/mod).
- `getOrCreateCommunityConversation(communityId)` — RPC `get_or_create_community_conversation`.
- `getOrCreateDirectConversation({userId, otherUserId})` — RPC `get_or_create_direct_conversation`.

**Membership**

- `joinChat(id, userId)` — INSERT en `conversation_members` con role='member'. **RLS solo lo permite para si mismo**. Para chats `invite_only` esto fallara — ver §8 sobre invitaciones.
- `leaveChat(id, userId)` — DELETE self.
- `kickMember(id, userId)` — DELETE por mod (RLS lo aprueba).
- `banMember(id, userId)` — UPSERT con role='banned'.
- `unbanMember(id, userId)` — DELETE con `role='banned'`. **Esto saca al usuario del chat**. Si se quiere "desbanear y dejar como member" hay que crear una RPC dedicada (ver §8).

**Roles**

- `transferChatAdmin`, `promoteToCoAdmin`, `demoteFromCoAdmin` — RPCs ya cubiertas en §4.

**Mensajes**

- `sendMessage` — INSERT en `messages` con `body` saneado (`sanitizePlainText`). `media_urls: []`. `status: 'sent'`.
- `subscribeToMessages(id, cb)` — canal Realtime `conversation:{id}:{timestamp}:{rand}` escuchando `postgres_changes` INSERT. **No escucha UPDATE/DELETE**.

**Pinned**

- `pinMessage(chatId, msgId, pinnedBy)` — INSERT en `chat_pinned_messages`.
- `unpinMessage(chatId, msgId)` — DELETE.

**Reactions**

- `reactToMessage(messageId, userId, emoji)` — INSERT. Ignora errores con `duplicate` para idempotencia.
- `unreactToMessage(messageId, userId, emoji)` — DELETE.

**Preferences**

- `setMuted(chatId, userId, muted)` — UPDATE self.
- `markRead(chatId, userId)` — UPDATE `last_read_at = now()` self.

### 7.2 Hooks (`src/features/chat/hooks/useChat.ts`)

Query keys oficiales:

```
["conversations", userId]
["community-chats", communityId]
["conversation", conversationId]
["chat-details", conversationId, currentUserId]
["chat-members", conversationId]
["chat-pinned", conversationId]
["chat-audit", conversationId]
["messages", conversationId]
```

Reglas:

- Toda mutation que cambia state visible invalida sus keys relacionadas. Ya implementado para create/update/delete/join/leave/kick/ban/transfer/promote/demote/pin/unpin/set-muted/send-message.
- `useReactMutation` / `useUnreactMutation` **NO invalidan** la cache de mensajes; cuando se implemente reactions en UI (§8) esto cambia: hay que decidir si se guarda el agregado dentro de `messages` (queryKey `["messages", id]`) o en una nueva key `["message-reactions", conversationId]`. Recomendado: nueva key separada, evita tocar el array de mensajes.
- `useMessageSubscription(conversationId)` hace `setQueryData` directo sobre `["messages", conversationId]`, deduplicando por id. **No reemplazarlo por invalidate** — el set directo es lo que permite render instantaneo sin refetch.

### 7.3 Modo demo (`src/services/demo-service.ts`)

Mantiene un store en memoria con las mismas formas (`Conversation`, `ConversationMember`, `Message`). Hay helper `buildDemoConversation(overrides)` con defaults sensatos para los nuevos campos. Las funciones avanzadas (createChat, transferChatAdmin, etc.) **no estan implementadas en demo**: el servicio lanza `DEMO_FEATURE_DISABLED`. Esto es intencional. Si se quiere extender el demo, mantener paridad de tipos pero **sin replicar RLS** — el demo no es un test de seguridad.

---

## 8. Lo que falta (backlog priorizado para esta IA)

Cada item incluye objetivo, mecanismo recomendado y criterio de aceptacion.

### P0 — Bloqueantes y bugs

#### 8.1 `unban` real (no kick disfrazado)

- **Hoy**: `unbanMember` borra la fila → el usuario deja de ser miembro.
- **Esperado**: `unbanMember` cambia `role` de `banned` a `member`, manteniendo membresia.
- **Como**:
  - Cambiar `chat-service.unbanMember` a UPDATE: `update conversation_members set role='member' where conversation_id=$1 and user_id=$2 and role='banned'`.
  - Crear RPC `unban_chat_member(input_conversation_id, input_user_id)` `SECURITY DEFINER` que valide `is_chat_moderator(caller)` y audite `member_unbanned`. La policy actual de UPDATE permite el cambio de rol al moderador, pero queremos auditarlo, asi que usar RPC.
- **Aceptacion**: tras banear y desbanear, el usuario sigue como miembro (`member`) y vuelve a poder enviar; aparece `member_unbanned` en `chat_audit_log`.

#### 8.2 Auditoria completa de moderacion

- **Hoy**: solo escriben en audit las RPCs `create_community_chat`, `transfer_chat_admin`, `promote_to_co_admin`, `demote_from_co_admin`. `kickMember`, `banMember`, `updateChat`, `deleteChat`, `pinMessage`, `unpinMessage`, slow-mode-change → **no auditan**.
- **Esperado**: cada accion de moderacion deja `chat_audit_log`.
- **Como**: convertir las acciones cliente-side actuales en RPCs `SECURITY DEFINER` que validen permisos y auditen:
  - `kick_chat_member(chat_id, user_id)` → DELETE + audit `member_kicked`.
  - `ban_chat_member(chat_id, user_id)` → UPSERT role='banned' + audit `member_banned`.
  - `unban_chat_member(chat_id, user_id)` → ver §8.1.
  - `pin_chat_message(chat_id, message_id)` → INSERT + audit `message_pinned` (deja que el trigger `enforce_pinned_limit` haga el limite).
  - `unpin_chat_message(chat_id, message_id)` → DELETE + audit `message_unpinned`.
  - `update_chat_config(chat_id, patch jsonb)` → UPDATE solo de los campos permitidos (`name, description, avatar_url, banner_url, visibility, slow_mode_seconds`) + audit `chat_updated` y, si cambio slow mode, tambien `slow_mode_changed` con `metadata={previous, next}`.
  - `delete_chat(chat_id)` → comprobar `is_default = false` y mod, DELETE + audit `chat_deleted`.
- **Aceptacion**: cualquier accion del panel de moderacion deja una entrada en `chat_audit_log` visible para los mods en `useChatAuditLog`.

#### 8.3 Proteger el Lobby de transferencias

- **Hoy**: `transfer_chat_admin` permite transferir el admin del lobby. Aunque la UI no lo ofrece, no esta blindado en BD.
- **Esperado**: si `conversations.is_default = true`, `transfer_chat_admin` lanza excepcion.
- **Como**: anadir al inicio del cuerpo de la RPC:
  ```sql
  if exists (select 1 from public.conversations where id = input_conversation_id and is_default = true) then
    raise exception 'No se puede transferir el admin del Lobby';
  end if;
  ```
- **Aceptacion**: intento de transferencia desde el Lobby retorna error con ese mensaje.

#### 8.4 Slow mode aplicado server-side

- **Hoy**: el cliente respeta `slow_mode_seconds` por estado local pero el server **no enforces** la espera entre mensajes. Un cliente malicioso puede saltarselo.
- **Esperado**: rechazar mensaje si el sender envio uno hace menos de `slow_mode_seconds` y no es mod.
- **Como**: trigger BEFORE INSERT en `messages`:
  ```sql
  -- pseudo
  if slow_mode_seconds > 0 and not is_chat_moderator(conv, sender) then
    if exists (
      select 1 from messages
      where conversation_id = NEW.conversation_id
        and sender_id = NEW.sender_id
        and created_at > now() - (slow_mode_seconds || ' seconds')::interval
    ) then
      raise exception 'Slow mode activo, espera unos segundos';
    end if;
  end if;
  ```
- **Aceptacion**: enviar 2 mensajes seguidos en un chat con slow mode 5s sin ser mod → segundo INSERT falla.

#### 8.5 Limite de chats activos por usuario por Orbita

- **Hoy**: ilimitado.
- **Esperado**: max 5 chats activos creados por el mismo usuario en la misma Orbita.
- **Como**: validar en `create_community_chat` antes de insertar:
  ```sql
  if (select count(*) from conversations where community_id = input_community_id and created_by = caller_id) >= 5 then
    raise exception 'Maximo 5 chats por usuario en esta Orbita';
  end if;
  ```
- **Aceptacion**: el 6 intento devuelve ese error.

### P1 — Datos que faltan en los listados

#### 8.6 `last_message` y `unread_count` reales en `listConversations`

- **Hoy**: ambos devuelven valores placeholder (`null` / `0`).
- **Esperado**: cada `ConversationPreview` trae el ultimo mensaje real y el numero de mensajes posteriores a `last_read_at`.
- **Como** (recomendado): RPC `list_user_conversations(user_id)` que devuelve filas `conversation + last_message_json + unread_count + member_count + role`. Implementacion sugerida:
  ```sql
  -- por cada membership del usuario:
  -- last_message = (select * from messages where conversation_id = c.id and status='sent' order by created_at desc limit 1)
  -- unread_count = count(messages where conversation_id = c.id and created_at > coalesce(last_read_at, '-infinity'))
  -- member_count = count(conversation_members where conversation_id = c.id and role <> 'banned')
  ```
  Devuelve composite o usa view + RLS.
- **Aceptacion**: `useConversations` muestra preview real y badge de no leidos correcto. La query no degrada notablemente con N chats.

#### 8.7 Realtime extendido

- **Hoy**: solo `messages` esta subscrito (INSERT). Pinned, reactions, role/ban changes no se reflejan en otros clientes en vivo.
- **Esperado**: cambios relevantes propagan en vivo a clientes con el chat abierto.
- **Como**: anadir suscripciones en hooks o helpers nuevos:
  - `subscribeToPinned(chatId, cb)` → `chat_pinned_messages` (INSERT + DELETE) → invalida `["chat-pinned", id]`.
  - `subscribeToReactions(chatId, cb)` → `message_reactions` filtrado por mensajes del chat (requiere join, mas facil escuchar todo y filtrar en cliente, **o** un canal por mensaje cuando este abierto). Recomendado: cuando se monte la UI de reacciones, suscribir por chat con filtro `eq(conversation_id, ...)` sobre una **view** `message_reactions_with_conversation` que exponga `conversation_id` (Realtime postgres_changes no permite join directo). Alternativa: trigger replicado que copie `conversation_id` a la fila.
  - `subscribeToMembers(chatId, cb)` → cambios de `conversation_members` → invalida `["chat-members", id]` y `["chat-details", id]`.
- **Aceptacion**: dos clientes en el mismo chat ven en vivo: nuevo pinned, nueva reaccion, nuevo miembro, ban.

#### 8.8 Reacciones agregadas y query keys

- **Hoy**: `MessageWithMeta.reactions` esta pensado pero `listMessages` no las devuelve y `useReactMutation` no actualiza cache.
- **Esperado**: cliente puede pintar emoji + count + flag `reacted_by_me` por mensaje. Mutations actualizan el agregado.
- **Como**:
  - Agregar en cliente: nueva query `useMessageReactionsByConversation(conversationId)` que llame a una RPC o view que devuelva `{ message_id, emoji, count, reacted_by_me }`.
  - En mutations `useReactMutation/useUnreactMutation` invalidar `["message-reactions", conversationId]` y, opcionalmente, hacer optimistic update.
- **Aceptacion**: reaccionar refleja instantaneamente count y estado propio sin recargar.

#### 8.9 Mute → no notificaciones

- **Hoy**: `muted` se guarda pero no afecta a nada (no hay sistema de notificaciones de chat aun).
- **Esperado**: cuando exista `notifications` para chat, respetar `muted = true` para no generar notificacion al miembro.
- **Como**: documentar en el flujo de notificaciones (fuera del scope de este doc) que el lookup de destinatarios debe excluir `muted = true`. **Sin accion inmediata** hasta que exista feature de notificaciones de chat.

### P2 — Extensiones de scope (cuando se aborden)

Estas no son P0 pero las menciono para que esta IA no las invente sin alinear primero.

- **Invitaciones a chats `invite_only`**: hoy la RLS de `conversation_members_insert_self` deja entrar a cualquier miembro de la Orbita. Para chats privados real hay que anadir una tabla `chat_invites(chat_id, invited_user_id, invited_by, status, expires_at)` y una RPC `accept_chat_invite` que cree el `conversation_members` row. NO implementar hasta que producto lo pida explicitamente.
- **Adjuntos / media**: la columna `messages.media_urls text[]` ya existe pero no se usa. Cuando se aborde, definir buckets de Storage, validaciones de mime/tamano y politica de moderacion antes de tocar codigo.
- **@mentions**: parsear en `body` del mensaje. Generara una notificacion por mencion. Requiere feature de notificaciones primero.
- **Typing indicators / presencia**: usar Supabase Realtime Presence en un canal por chat. No persiste en BD.
- **Read receipts visibles**: derivar de `conversation_members.last_read_at`. Implica leer todas las filas y mostrar avatars en el ultimo mensaje leido. Cuidar privacidad antes de exponerlo.

### P3 — Tests y observabilidad

- **Tests de RLS**: no existen. Crear suite en `tests/rls/chats.test.sql` o equivalente con `supabase db test` que pruebe:
  - usuario no miembro no puede leer ni escribir mensajes.
  - usuario `banned` no puede insertar mensaje pero si leer.
  - miembro no admin no puede invocar `transfer_chat_admin`.
  - `enforce_pinned_limit` rechaza el 4 pin.
  - `create_community_chat` rechaza no-miembros y nombres invalidos.
- **Rate limiting**: no hay. Si se decide aplicar, hacerlo en Edge Functions encima de las RPCs sensibles (`create_community_chat`, `sendMessage` cuando se mueva a RPC) y no en cliente.

---

## 9. Decisiones cerradas (no volver a abrir)

- **No** soporte a chats `private` (full-hidden) en V1. Solo `public` e `invite_only`. Mantiene RLS simple y suficiente.
- **El Lobby existe siempre y no se borra**. Es el unico chat con `is_default = true` por Orbita.
- **Mods/owner de la Orbita pueden moderar cualquier chat de su Orbita**. Esta es la razon por la que `is_chat_moderator` mira `is_community_moderator`.
- **Transfer admin nunca deja al cedente fuera**. Pasa a co-admin si hay hueco, a member si no.
- **Auditoria solo via SECURITY DEFINER**. El cliente nunca escribe en `chat_audit_log` directo.
- **`messages.status` se queda con 3 valores** (`sent | hidden | deleted`). Moderacion los usa, la UI por defecto solo pinta `sent`.

---

## 10. Estado de migraciones (corte 2026-05-26)

```
001_init_schema.sql                aplicada
002_rls_policies.sql               NO usar (\ir incompatible); las policies originales se aplicaron via policies.sql manual
003_community_product.sql          aplicada
004_storage_banner_upload_policies aplicada
005_auto_create_profile.sql        PENDIENTE de aplicar
006_chats_v2.sql                   PENDIENTE de aplicar
007_chats_v2_policies.sql          PENDIENTE de aplicar (sin esto da 403 al crear chats)
008_create_chat_rpc.sql            PENDIENTE de aplicar (sin esto createChat falla — el cliente la invoca)
011_list_user_conversations.sql    PENDIENTE de aplicar (aplica despues de 010; RPC para previews con last_message, unread_count y member_count reales)
012_chat_background.sql            PENDIENTE de aplicar (add background_url a conversations + RPC set_chat_background)
```

Orden de aplicacion en el SQL Editor de Supabase: 005 → 006 → 007 → 008.

Para los items del backlog (§8) crear migraciones **nuevas** numeradas a partir de **009**. No editar las migraciones ya escritas; corregir con una migracion adicional.

Convencion: una migracion = un bloque coherente. Por ejemplo:

- `009_chat_moderation_rpcs.sql` → §8.1, §8.2, §8.3 (RPCs kick/ban/unban/pin/unpin/update/delete + audit + Lobby guard).
- `010_chat_slow_mode_trigger.sql` → §8.4.
- `011_chat_creation_limit.sql` → §8.5.
- `012_list_user_conversations_rpc.sql` → §8.6.
- `013_chat_reactions_view.sql` → vista o RPC para §8.8.

---

## 11. Reglas de oro para la IA que continue

1. **Cualquier accion sensible va por RPC `SECURITY DEFINER`** que valide permisos con los helpers existentes y escriba en `chat_audit_log` si la accion existe en el enum.
2. **No relajar RLS** para "que funcione". Si una operacion no pasa, la solucion es una RPC o ajustar la operacion del cliente; nunca abrir la policy.
3. **No tocar la migracion 002**. Tiene `\ir` y el SQL Editor de Supabase no lo entiende.
4. **No introducir nuevas tablas o columnas sin migracion versionada**. La 009 en adelante es tuya.
5. **No filtrar en cliente lo que la RLS deberia filtrar**. Lo que sale del query es lo que el usuario puede ver, y punto.
6. **No meter `console.log` en chat-service**. Usa `throw` y deja que el caller maneje.
7. **Mantener paridad de tipos** entre `src/types/domain.ts`, las columnas en SQL y el demo. Si anades campo, los tres deben quedar coherentes en la misma sesion.
8. **No tocar UI** salvo para mover logica al hook/servicio. Si necesitas un componente nuevo o cambio visual, deja un TODO claro y avisa al usuario para que se lo pase a la IA de diseno.
9. **Validar siempre con `npm run typecheck` y `npm test`** antes de cerrar. Si tocas SQL, prueba la migracion en una base limpia o documenta el orden de aplicacion.
10. **Modo demo**: si una funcion nueva tiene equivalente razonable en memoria, anadirla; si no, lanzar `DEMO_FEATURE_DISABLED` con mensaje claro. No silenciar.

---

## 12. Mapa rapido de archivos

```
supabase/migrations/006_chats_v2.sql            schema + helpers + RPCs roles + triggers + RLS de tablas nuevas
supabase/migrations/007_chats_v2_policies.sql   RLS de conversations / conversation_members / messages
supabase/migrations/008_create_chat_rpc.sql     RPC create_community_chat

src/types/domain.ts                             tipos autoritativos (ChatRole, ChatVisibility, etc.)
src/features/chat/services/chat-service.ts      capa de servicios (Supabase + demo fallback)
src/features/chat/hooks/useChat.ts              hooks TanStack Query (queries + mutations + realtime)
src/services/demo-service.ts                    store en memoria para modo demo
src/utils/sanitize.ts                           sanitizePlainText para el body de mensajes
src/utils/validation.ts                         MessageInput schema (Zod)
```

UI (no tocar logica desde aqui, vive de los hooks):

```
src/features/chat/screens/ChatListScreen.tsx
src/features/chat/screens/ChatRoomScreen.tsx
src/features/chat/screens/CreateChatScreen.tsx
src/features/chat/components/*
```

---

## 13. Checklist de "primer commit" para la siguiente IA

Si te encargan empezar, este es un orden razonable:

1. Aplicar manualmente migraciones 005, 006, 007, 008 en Supabase (orden estricto).
2. Verificar que al crear una Orbita nueva aparece un Lobby con el owner como admin.
3. Verificar que `useCreateChatMutation` crea un chat y deja al creador como admin en `conversation_members`.
4. Escribir migracion **009** con las RPCs de moderacion auditadas (§8.1, §8.2, §8.3).
5. Ajustar `chat-service.ts` para llamar a esas RPCs en vez de hacer DELETE/UPSERT directo (`kickMember`, `banMember`, `unbanMember`, `updateChat`, `deleteChat`, `pinMessage`, `unpinMessage`).
6. Anadir migracion **010** con trigger de slow mode (§8.4).
7. Anadir migracion **011** con limite de chats por usuario por Orbita (§8.5).
8. Anadir migracion **012** con RPC para `last_message` + `unread_count` y ajustar `listConversations` (§8.6).
9. Extender Realtime a `chat_pinned_messages` y `conversation_members` (§8.7).
10. Correr `npm run typecheck`, `npm test`, y probar end-to-end en modo no-demo con 2 usuarios.

Cuando termines, actualiza este doc con lo nuevo en §8 (mover items a §0 o a "implementado") y refleja el estado en `FEATURES.md` y `ROADMAP.md`.
