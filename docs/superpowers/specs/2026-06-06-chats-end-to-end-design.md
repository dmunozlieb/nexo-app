# Chats end-to-end — Design Spec

**Fecha:** 2026-06-06
**Rama:** `feature/chats`
**Objetivo:** Que el sistema de chats sea usable de punta a punta. El backend está maduro (migraciones 006–008, servicios, hooks, RLS, RPCs) pero hay brechas de cliente y datos que impiden usarlo de verdad. Esta rama las cierra.

Documento de referencia autoritativo del backend: `docs/CHATS_ARCHITECTURE.md`. Este spec **no reabre** las decisiones cerradas de §9 de ese doc.

---

## 0. Estado de partida (auditoría)

**Funciona:** migraciones 006–008 (multi-chat por Órbita, Lobby auto, roles admin/co_admin/member/banned, pinned máx 3, audit log, reactions backend, RLS, RPCs transaccionales). `ChatListScreen`, `ChatRoomScreen` (realtime INSERT, envío, slow-mode client-side, pinned bar, panel de info con moderación de miembros, reportar mensaje), `CreateChatScreen`.

**Brechas que cierra esta rama:**
1. La sala revienta en **demo mode** — `getChatDetails`/`listChatMembers`/`listPinnedMessages` lanzan `ensureNotDemo()`.
2. **Reactions** sin UI ni datos en cliente (backend completo, pero `MessageBubble.onReact` no se cablea y no se renderiza nada).
3. **`last_message` / `unread_count`** son placeholders (`null`/`0`) en producción.
4. No hay **pantalla de ajustes** del chat (config / audit log / borrar).
5. No se puede **personalizar el fondo** del chat.

**Fuera de alcance (anotado, no se toca):** RPCs P0 de moderación auditada (§8.1–8.5 del doc de arquitectura: unban real, audit de kick/ban/pin/update/delete, blindar Lobby, slow-mode server-side, límite de chats), realtime extendido (pinned/reactions/members, §8.7), invitaciones a `invite_only` (§P2), adjuntos, @mentions, typing/presencia.

---

## 1. Arreglar demo mode (P0 bloqueante)

**Problema:** la app corre con `EXPO_PUBLIC_DEMO_MODE=true`. `ChatRoomScreen` llama `useChatDetails` → `getChatDetails` → `ensureNotDemo()` → excepción → `ErrorState`. La sala no se puede abrir en demo.

**Cambios:**
- `src/services/demo-service.ts`: añadir
  - `demoGetChatDetails(conversationId, currentUserId)` → `{ conversation, members, pinned_messages, current_user_role }` desde los stores en memoria.
  - `demoListChatMembers(conversationId)` → `ConversationMemberWithProfile[]`.
  - `demoListPinnedMessages(conversationId)` → `MessageWithMeta[]` (vacío si no hay pins seed).
  - `demoUpdateChat(conversationId, patch)` y `demoDeleteChat(conversationId)` (para settings).
  - `demoListChatAuditLog(conversationId)` → `ChatAuditEntry[]` (puede devolver `[]` o 2–3 entradas seed).
- `src/features/chat/services/chat-service.ts`: en `getChatDetails`, `listChatMembers`, `listPinnedMessages`, `updateChat`, `deleteChat`, `listChatAuditLog` reemplazar el `ensureNotDemo()` por la rama `if (env.demoMode) return demoX(...)`.

**Aceptación:** en demo se abre cualquier sala, se ve el panel de info con miembros, y la pantalla de ajustes carga sin error.

---

## 2. Reactions end-to-end (sin SQL nuevo)

Reutiliza el `listMessageReactions(messageIds)` existente; la agregación se hace en cliente (decisión del doc §8.8: query key separada, no tocar el array de mensajes).

**Datos / hooks (`useChat.ts`):**
- `useMessageReactions(conversationId, messageIds, currentUserId)`:
  - queryKey `["message-reactions", conversationId]`, `enabled` cuando hay `messageIds`.
  - llama `listMessageReactions(messageIds)` y agrega a `Map<messageId, { emoji, count, reacted_by_me }[]>`.
- `useReactMutation` / `useUnreactMutation`: **optimistic update** sobre `["message-reactions", conversationId]` (insertar/quitar la propia reacción ajustando count y `reacted_by_me`), rollback en error, `invalidate` en `onSettled`.

**Demo (`demo-service.ts`):** store `messageReactions` en memoria + `demoListMessageReactions(messageIds)`, `demoReactToMessage(messageId, userId, emoji)` (idempotente), `demoUnreactToMessage(...)`. Cableados en los servicios `listMessageReactions`/`reactToMessage`/`unreactToMessage` por `env.demoMode` (hoy lanzan `ensureNotDemo`).

**UI:**
- `MessageBubble`: render de píldoras agregadas bajo la burbuja a partir de las reacciones del mensaje (emoji + count; la propia resaltada con color de acento; tap → toggle). Popover quick-react colgado del botón 🙂 ya presente: set curado + "···" para set completo.
- Set curado (decisión cerrada): `✨ 🔭 🚀 🛸 💫 👽`. Definir en `src/features/chat/constants/reactions.ts`.
- `ChatRoomScreen`: pasar `onReact` y los datos de reacciones a `MessageBubble` (hoy `onReact` no se pasa). Cablear `useMessageReactions` + las mutations.

**Aceptación:** reaccionar refleja count y estado propio al instante; en demo y en real; un usuario no repite el mismo emoji (PK / idempotencia).

---

## 3. `last_message` + `unread_count` reales — migración `009_list_user_conversations.sql`

**Migración (nueva, ≥009):** RPC `public.list_user_conversations(input_user_id uuid)` `SECURITY DEFINER`, `set search_path = public`, que por cada membership no `banned` del usuario devuelve el `conversation` + `community` + `last_message` (jsonb del último `messages.status='sent'`) + `unread_count` (mensajes con `created_at > coalesce(last_read_at, '-infinity')`) + `member_count` (miembros con `role <> 'banned'`) + `role`.
- Validar `input_user_id = auth.uid()` para no filtrar conversaciones ajenas.

**Cliente:**
- `chat-service.listConversations(userId)`: en real, invocar la RPC y mapear a `ConversationPreview[]` (sustituye la query actual con placeholders).
- Demo: `demoListConversations` ya calcula `last_message` y `member_count`; añadir `unread_count` (mensajes posteriores a `last_read_at`).

**Aceptación:** `ChatListScreen` muestra preview real del último mensaje y badge de no leídos correcto en demo y en real.

---

## 4. ChatSettingsScreen

**Routing:** reestructurar `app/chat/[id].tsx` → `app/chat/[id]/index.tsx` (la sala) + `app/chat/[id]/settings.tsx` (ajustes). Verificar que `app/chat/_layout.tsx` sigue cubriendo la subruta.

**Acceso:** icono de engranaje en `ChatHeader`, visible solo si `currentUserRole ∈ {admin, co_admin}` o mod de la Órbita (`canModerate`).

**Contenido (`src/features/chat/screens/ChatSettingsScreen.tsx`):**
- **Identidad:** banner + avatar (reutiliza pipeline de upload existente).
- **Nombre / descripción** (editables).
- **Visibilidad:** `public` / `invite_only`.
- **Modo lento:** off / 5s / 15s / 30s (dentro de 0–300).
- **Fondo del chat:** entrada que abre el `BackgroundPicker` (ver §5).
- **Guardar:** `useUpdateChatMutation`.
- **Historial de moderación:** lista solo-lectura de `chat_audit_log` vía `useChatAuditLog` (mods).
- **Eliminar chat:** `useDeleteChatMutation`; visible solo a admin y oculto si `is_default` (Lobby).

Sigue las convenciones visuales existentes (NebulaBackdrop, tokens, breakpoints; coherente con `CreateChatScreen` y edit-profile).

**Aceptación:** un admin edita config y se refleja; ve el audit log; puede borrar un chat no-Lobby; el Lobby no muestra "Eliminar".

---

## 5. Fondo del chat (wallpaper) — migración `010_chat_background.sql`

**Modelo:** columna nueva `background_url text` en `conversations` (separada del `banner_url` de identidad). Guarda o un id de preset (`preset:<id>`) o una URL de imagen subida. Compartido a nivel de conversación (lo que cambia uno lo ve el otro).

**Presets:** definidos en cliente como **gradientes cósmicos** (sin assets externos protegidos; se pintan con `LinearGradient`/SVG). Catálogo en `src/features/chat/constants/backgrounds.ts` (`{ id, label, gradient }`). Más opción "Ninguno".

**Subir imagen:** reutiliza el pipeline de upload a Supabase Storage ya existente (expo-image-picker + bucket de banners/avatars).

**Permisos — RPC `set_chat_background(input_conversation_id uuid, input_background_url text)`** `SECURITY DEFINER`, `set search_path = public`:
- Si `conversations.type = 'community'` → exige `is_chat_moderator(conv, auth.uid())` (admin + co-admins + mods de la Órbita).
- Si `conversations.type = 'direct'` → exige `is_conversation_member(conv, auth.uid())` (cualquiera de los dos).
- Actualiza `background_url`. (No relajar la RLS de `conversations`; el update de DMs no pasaría por `conversations_update_mods`, por eso va por RPC.)
- Opcional: para `community`, auditar `chat_updated` en `chat_audit_log`.

**Cliente:**
- `chat-service`: `setChatBackground(conversationId, backgroundUrl)` → RPC en real; `demoSetChatBackground` en demo.
- Hook `useSetChatBackgroundMutation` → invalida `["conversation", id]` y `["chat-details", id]`.
- Componente `src/features/chat/components/BackgroundPicker.tsx` (modal): grid de presets + "Ninguno" + "Subir imagen"; resalta el activo.
- Punto de entrada: icono 🖼️ en `ChatHeader` (visible con permiso: mods en community, cualquier miembro en direct) y enlace desde `ChatSettingsScreen`.
- `ChatRoomScreen`: pintar el fondo detrás del `FlatList` — gradiente del preset o `<Image>` de la URL — con velo oscuro (`rgba` overlay) para legibilidad del texto.

**Tipos:** añadir `background_url` a `Conversation` en `src/types/domain.ts` y al `buildDemoConversation` (paridad SQL/TS/demo, regla de oro del doc).

**Aceptación:** un admin de Órbita y cualquiera de los dos en un DM pueden fijar/quitar fondo (preset o subido); se ve detrás de los mensajes con texto legible; en demo el cambio persiste en memoria; un usuario sin permiso no ve el control.

---

## 6. Migraciones nuevas

| Archivo | Contenido |
|---|---|
| `009_list_user_conversations.sql` | RPC `list_user_conversations` (last_message + unread_count + member_count + role). |
| `010_chat_background.sql` | Columna `conversations.background_url` + RPC `set_chat_background` (permisos community vs direct). |

No editar migraciones existentes. Documentar orden de aplicación en `CHATS_ARCHITECTURE.md` §10 al cerrar.

---

## 7. Paridad de tipos (regla de oro)

Cualquier campo nuevo (`background_url`) debe quedar coherente en los tres sitios en la misma sesión: columna SQL, `src/types/domain.ts`, y `demo-service.ts` (`buildDemoConversation`).

---

## 8. Validación

- `npm run typecheck` (gate principal; `npm run lint` está roto en este entorno).
- `npm test`.
- Prueba visual en demo (app en `:8081`): abrir sala, reaccionar, cambiar fondo, abrir ajustes, ver unread en la lista.
- Si se prueba en real: aplicar 009 y 010 en orden tras 006–008.

---

## 9. Mapa de archivos tocados

```
supabase/migrations/009_list_user_conversations.sql        (nuevo)
supabase/migrations/010_chat_background.sql                 (nuevo)
src/types/domain.ts                                         (background_url en Conversation)
src/services/demo-service.ts                               (demo de details/members/pinned/audit/update/delete/reactions/background + unread)
src/features/chat/services/chat-service.ts                 (ramas demo + setChatBackground + listConversations vía RPC)
src/features/chat/hooks/useChat.ts                         (useMessageReactions, optimistic react/unreact, useSetChatBackgroundMutation)
src/features/chat/constants/reactions.ts                   (nuevo: set curado)
src/features/chat/constants/backgrounds.ts                 (nuevo: presets)
src/features/chat/components/MessageBubble.tsx             (píldoras + popover quick-react)
src/features/chat/components/ChatHeader.tsx                (engranaje ajustes + icono fondo)
src/features/chat/components/BackgroundPicker.tsx          (nuevo)
src/features/chat/screens/ChatRoomScreen.tsx              (cablear reactions + fondo)
src/features/chat/screens/ChatSettingsScreen.tsx          (nuevo)
src/features/chat/screens/ChatListScreen.tsx              (consumir unread/last_message reales — sin cambio si el preview ya lee los campos)
app/chat/[id]/index.tsx                                    (reestructura desde app/chat/[id].tsx)
app/chat/[id]/settings.tsx                                 (nuevo)
```
