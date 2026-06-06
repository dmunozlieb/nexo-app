# Chats End-to-End Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the chat system usable end-to-end: fix demo mode, add reactions UI, real last_message/unread, a chat-settings screen, and a customizable chat background.

**Architecture:** The chat backend (migrations 006–008, services, hooks, RLS, RPCs) is mature; the gaps are client/data. We add two small migrations (011 RPC for previews, 012 column+RPC for background), fill in demo-mode equivalents so the room works under `EXPO_PUBLIC_DEMO_MODE=true`, aggregate reactions client-side over the existing `listMessageReactions`, and add UI: reaction pills/popover, a `BackgroundPicker`, and a `ChatSettingsScreen`.

**Tech Stack:** Expo SDK 56, expo-router, React Native 0.85, React 19, TypeScript strict, TanStack Query, Supabase (PostgreSQL + RLS + RPC), Zod, lucide-react-native, expo-linear-gradient, jest + jest-expo.

**Validation gate:** `npm run typecheck` and `npm test`. `npm run lint` is broken in this environment — do not rely on it. App runs in demo at `http://localhost:8081` for manual checks. Tests in this repo are pure-logic unit tests (`tests/*.test.ts`); UI/screens/migrations are gated by typecheck + manual demo, and only pure helpers get jest tests.

**Conventions:**
- No `console.log` in services; `throw` and let TanStack Query handle it.
- Type parity: any new field must land in SQL + `src/types/domain.ts` + `demo-service.ts` in the same task.
- Use tokens from `src/theme/tokens.ts`; mirror `CreateChatScreen.tsx` for form styling.
- Commit after each task. Do not add a `Co-Authored-By` trailer.

---

## File Structure

**New files:**
- `supabase/migrations/011_list_user_conversations.sql` — RPC for conversation previews (last_message + unread + member_count).
- `supabase/migrations/012_chat_background.sql` — `conversations.background_url` column + `set_chat_background` RPC.
- `src/features/chat/constants/reactions.ts` — curated quick-react emoji set.
- `src/features/chat/constants/backgrounds.ts` — cosmic gradient presets + `resolveBackground` + `aggregateReactions` live in their own util (see below).
- `src/features/chat/utils/reactions.ts` — `aggregateReactions` pure helper (unit-tested).
- `src/features/chat/utils/backgrounds.ts` — preset catalog + `resolveBackground` pure helper (unit-tested).
- `src/features/chat/components/ReactionPills.tsx` — aggregated reaction pills row.
- `src/features/chat/components/ReactionPopover.tsx` — quick-react emoji popover.
- `src/features/chat/components/BackgroundPicker.tsx` — modal to choose preset/upload/none.
- `src/features/chat/screens/ChatSettingsScreen.tsx` — config + audit log + delete.
- `app/chat/[id]/index.tsx` — chat room route (moved from `app/chat/[id].tsx`).
- `app/chat/[id]/settings.tsx` — settings route.
- `tests/chat-reactions.test.ts`, `tests/chat-backgrounds.test.ts` — unit tests for the two helpers.

**Modified files:**
- `src/types/domain.ts` — add `background_url` to `Conversation`.
- `src/services/demo-service.ts` — demo equivalents (details/members/pinned/audit/update/delete/reactions/background) + unread.
- `src/features/chat/services/chat-service.ts` — demo branches, `setChatBackground`, `listConversations` via RPC.
- `src/features/chat/hooks/useChat.ts` — `useMessageReactions`, optimistic react/unreact, `useSetChatBackgroundMutation`.
- `src/features/chat/components/MessageBubble.tsx` — render `ReactionPills` + open `ReactionPopover`.
- `src/features/chat/components/ChatHeader.tsx` — background + settings icon buttons.
- `src/features/chat/screens/ChatRoomScreen.tsx` — wire reactions, background layer, header actions.

---

## Phase 0 — Type parity + unblock demo

### Task 1: Add `background_url` to the Conversation type and demo factory

**Files:**
- Modify: `src/types/domain.ts:124-138`
- Modify: `src/services/demo-service.ts:407-421`

- [ ] **Step 1: Add the field to the type**

In `src/types/domain.ts`, inside `export type Conversation`, add `background_url` right after `banner_url`:

```ts
export type Conversation = {
  id: string;
  type: ConversationType;
  community_id: string | null;
  name: string | null;
  description: string | null;
  avatar_url: string | null;
  banner_url: string | null;
  background_url: string | null;
  created_by: string | null;
  visibility: ChatVisibility;
  slow_mode_seconds: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};
```

- [ ] **Step 2: Default it in the demo factory**

In `src/services/demo-service.ts`, in `buildDemoConversation`, add `background_url: null` next to `banner_url: null`:

```ts
  return {
    community_id: null,
    name: null,
    description: null,
    avatar_url: null,
    banner_url: null,
    background_url: null,
    created_by: null,
    visibility: "public",
    slow_mode_seconds: 0,
    is_default: false,
    created_at: now(),
    updated_at: now(),
    ...overrides,
  };
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors). If any real-Supabase `select("*")` mapping breaks, it won't — the column is added in Task 11.

- [ ] **Step 4: Commit**

```bash
git add src/types/domain.ts src/services/demo-service.ts
git commit -m "chat: add background_url to Conversation type + demo factory"
```

---

### Task 2: Make the chat room work in demo mode

Today `getChatDetails`, `listChatMembers`, `listPinnedMessages` call `ensureNotDemo()` and throw, so opening any room in demo shows an ErrorState. Add demo equivalents and route to them.

**Files:**
- Modify: `src/services/demo-service.ts` (add functions near the other demo chat functions, after `demoSubscribeToMessages` ~line 1293)
- Modify: `src/features/chat/services/chat-service.ts:122-148, 282-299, 569-594`

- [ ] **Step 1: Add demo functions**

In `src/services/demo-service.ts`, add (after `demoSubscribeToMessages`):

```ts
export async function demoListChatMembers(
  conversationId: string,
): Promise<ConversationMemberWithProfile[]> {
  return conversationMembers
    .filter((item) => item.conversation_id === conversationId)
    .map((item) => ({
      ...item,
      profile: profiles.find((p) => p.id === item.user_id) ?? null,
    }));
}

export async function demoListPinnedMessages(
  _conversationId: string,
): Promise<MessageWithMeta[]> {
  return [];
}

export async function demoGetChatDetails(
  conversationId: string,
  currentUserId: string,
): Promise<ChatDetails> {
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    throw new Error("Chat no encontrado");
  }
  const members = await demoListChatMembers(conversationId);
  const current = members.find((m) => m.user_id === currentUserId);
  return {
    conversation,
    members,
    pinned_messages: [],
    current_user_role: current?.role ?? null,
  };
}

export async function demoUpdateChat(
  conversationId: string,
  patch: Partial<Conversation>,
): Promise<Conversation> {
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    throw new Error("Chat no encontrado");
  }
  Object.assign(conversation, patch, { updated_at: now() });
  return conversation;
}

export async function demoDeleteChat(conversationId: string): Promise<void> {
  const index = conversations.findIndex((c) => c.id === conversationId);
  if (index >= 0) conversations.splice(index, 1);
}

export async function demoListChatAuditLog(
  _conversationId: string,
): Promise<ChatAuditEntry[]> {
  return [];
}
```

Add the missing type imports to the existing `import type { ... } from "..."` blocks at the top of `demo-service.ts`: `ChatDetails`, `ConversationMemberWithProfile`, `MessageWithMeta`, `ChatAuditEntry` (from `./../types/domain` — match the existing domain import path/style already used in the file).

- [ ] **Step 2: Route the service functions to demo**

In `src/features/chat/services/chat-service.ts`, update the imports from demo-service to include the new functions, then replace the `ensureNotDemo()` line in each function with a demo branch.

`getChatDetails`:

```ts
export async function getChatDetails(
  conversationId: string,
  currentUserId: string,
): Promise<ChatDetails> {
  if (env.demoMode) {
    return demoGetChatDetails(conversationId, currentUserId);
  }

  const [conversation, members, pinned] = await Promise.all([
    getConversation(conversationId),
    listChatMembers(conversationId),
    listPinnedMessages(conversationId),
  ]);

  if (!conversation) {
    throw new Error("Chat no encontrado");
  }

  const currentMember = members.find(
    (member) => member.user_id === currentUserId,
  );

  return {
    conversation,
    members,
    pinned_messages: pinned,
    current_user_role: currentMember?.role ?? null,
  };
}
```

`listChatMembers` — replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoListChatMembers(conversationId);
  }
```

`listPinnedMessages` — replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoListPinnedMessages(conversationId);
  }
```

Add to the demo-service import block at the top of `chat-service.ts`:

```ts
  demoGetChatDetails,
  demoListChatMembers,
  demoListPinnedMessages,
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual check in demo**

Open `http://localhost:8081`, go to Chats, open the "Lobby" of any Órbita.
Expected: the room loads (header + messages + composer), no ErrorState; the info panel (Info icon) lists members.

- [ ] **Step 5: Commit**

```bash
git add src/services/demo-service.ts src/features/chat/services/chat-service.ts
git commit -m "chat: fix chat room in demo mode (details/members/pinned)"
```

---

## Phase 1 — Reactions end-to-end

### Task 3: Reaction aggregation helper (TDD)

**Files:**
- Create: `src/features/chat/utils/reactions.ts`
- Test: `tests/chat-reactions.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/chat-reactions.test.ts`:

```ts
/// <reference types="jest" />

import { aggregateReactions } from "../src/features/chat/utils/reactions";
import type { MessageReaction } from "../src/types/domain";

const r = (
  message_id: string,
  user_id: string,
  emoji: string,
): MessageReaction => ({
  message_id,
  user_id,
  emoji,
  created_at: "2026-06-06T00:00:00.000Z",
});

describe("aggregateReactions", () => {
  it("agrupa por mensaje y emoji con conteo", () => {
    const map = aggregateReactions(
      [r("m1", "u1", "✨"), r("m1", "u2", "✨"), r("m1", "u1", "🚀")],
      "u3",
    );
    const m1 = map.get("m1")!;
    expect(m1).toEqual([
      { emoji: "✨", count: 2, reacted_by_me: false },
      { emoji: "🚀", count: 1, reacted_by_me: false },
    ]);
  });

  it("marca reacted_by_me cuando el usuario actual reaccionó", () => {
    const map = aggregateReactions([r("m1", "u1", "✨")], "u1");
    expect(map.get("m1")![0]!.reacted_by_me).toBe(true);
  });

  it("devuelve un map vacío sin reacciones", () => {
    expect(aggregateReactions([], "u1").size).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chat-reactions`
Expected: FAIL with "Cannot find module '../src/features/chat/utils/reactions'".

- [ ] **Step 3: Implement the helper**

`src/features/chat/utils/reactions.ts`:

```ts
import type { MessageReaction } from "../../../types/domain";

export type ReactionSummary = {
  emoji: string;
  count: number;
  reacted_by_me: boolean;
};

/**
 * Agrupa reacciones planas en, por mensaje, una lista de { emoji, count,
 * reacted_by_me }. Mantiene el orden de primera aparición de cada emoji.
 */
export function aggregateReactions(
  reactions: MessageReaction[],
  currentUserId: string,
): Map<string, ReactionSummary[]> {
  const byMessage = new Map<string, Map<string, ReactionSummary>>();

  for (const reaction of reactions) {
    let emojiMap = byMessage.get(reaction.message_id);
    if (!emojiMap) {
      emojiMap = new Map();
      byMessage.set(reaction.message_id, emojiMap);
    }
    const existing = emojiMap.get(reaction.emoji);
    if (existing) {
      existing.count += 1;
      if (reaction.user_id === currentUserId) existing.reacted_by_me = true;
    } else {
      emojiMap.set(reaction.emoji, {
        emoji: reaction.emoji,
        count: 1,
        reacted_by_me: reaction.user_id === currentUserId,
      });
    }
  }

  const result = new Map<string, ReactionSummary[]>();
  for (const [messageId, emojiMap] of byMessage) {
    result.set(messageId, Array.from(emojiMap.values()));
  }
  return result;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- chat-reactions`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/utils/reactions.ts tests/chat-reactions.test.ts
git commit -m "chat: aggregateReactions helper + tests"
```

---

### Task 4: Demo reactions store + service demo branches

**Files:**
- Modify: `src/services/demo-service.ts` (add a `messageReactions` store near the other stores ~line 502, and demo functions near the chat demo functions)
- Modify: `src/features/chat/services/chat-service.ts:635-689`

- [ ] **Step 1: Add the demo store + functions**

In `src/services/demo-service.ts`, after `const reports: Report[] = [];` add:

```ts
const messageReactions: MessageReaction[] = [];
```

Add `MessageReaction` to the domain `import type` block if not already present. Then add these functions near the other chat demo functions:

```ts
export async function demoListMessageReactions(
  messageIds: string[],
): Promise<MessageReaction[]> {
  if (messageIds.length === 0) return [];
  return messageReactions.filter((r) => messageIds.includes(r.message_id));
}

export async function demoReactToMessage(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const exists = messageReactions.some(
    (r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji,
  );
  if (exists) return;
  messageReactions.push({
    message_id: messageId,
    user_id: userId,
    emoji,
    created_at: now(),
  });
}

export async function demoUnreactToMessage(
  messageId: string,
  userId: string,
  emoji: string,
): Promise<void> {
  const index = messageReactions.findIndex(
    (r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji,
  );
  if (index >= 0) messageReactions.splice(index, 1);
}
```

- [ ] **Step 2: Route the service to demo**

In `src/features/chat/services/chat-service.ts`, add to the demo-service import block:

```ts
  demoListMessageReactions,
  demoReactToMessage,
  demoUnreactToMessage,
```

In `listMessageReactions`, replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoListMessageReactions(messageIds);
  }
```

In `reactToMessage`, replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoReactToMessage(messageId, userId, emoji);
  }
```

In `unreactToMessage`, replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoUnreactToMessage(messageId, userId, emoji);
  }
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/services/demo-service.ts src/features/chat/services/chat-service.ts
git commit -m "chat: demo store + service branches for reactions"
```

---

### Task 5: Reactions hook + optimistic mutations

**Files:**
- Modify: `src/features/chat/hooks/useChat.ts` (replace `useReactMutation`/`useUnreactMutation` ~lines 331-353; add `useMessageReactions`)

- [ ] **Step 1: Add the query hook**

Add to `src/features/chat/hooks/useChat.ts` (import `listMessageReactions` is already imported via the service barrel; also import the helper):

```ts
import { aggregateReactions } from "../utils/reactions";
import type { ReactionSummary } from "../utils/reactions";
```

```ts
export function useMessageReactions(
  conversationId: string | undefined,
  messageIds: string[],
  currentUserId: string | undefined,
) {
  return useQuery({
    queryKey: ["message-reactions", conversationId],
    enabled: Boolean(conversationId) && messageIds.length > 0,
    queryFn: async () => {
      const rows = await listMessageReactions(messageIds);
      return aggregateReactions(rows, currentUserId ?? "");
    },
  });
}
```

- [ ] **Step 2: Replace the mutations with optimistic versions**

Replace `useReactMutation` and `useUnreactMutation` with versions keyed to a conversation so they can patch the cache:

```ts
export function useReactMutation(
  conversationId: string,
  userId?: string,
) {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      reactToMessage(messageId, userId ?? "", emoji),
    onMutate: async ({ messageId, emoji }) => {
      const key = ["message-reactions", conversationId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<Map<string, ReactionSummary[]>>(key);
      const next = new Map(previous ?? []);
      const list = [...(next.get(messageId) ?? [])];
      const idx = list.findIndex((r) => r.emoji === emoji);
      if (idx >= 0) {
        if (list[idx]!.reacted_by_me) {
          // no-op: ya reaccionó
        } else {
          list[idx] = {
            ...list[idx]!,
            count: list[idx]!.count + 1,
            reacted_by_me: true,
          };
        }
      } else {
        list.push({ emoji, count: 1, reacted_by_me: true });
      }
      next.set(messageId, list);
      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["message-reactions", conversationId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["message-reactions", conversationId],
      });
    },
  });
}

export function useUnreactMutation(
  conversationId: string,
  userId?: string,
) {
  return useMutation({
    mutationFn: ({ messageId, emoji }: { messageId: string; emoji: string }) =>
      unreactToMessage(messageId, userId ?? "", emoji),
    onMutate: async ({ messageId, emoji }) => {
      const key = ["message-reactions", conversationId];
      await queryClient.cancelQueries({ queryKey: key });
      const previous =
        queryClient.getQueryData<Map<string, ReactionSummary[]>>(key);
      const next = new Map(previous ?? []);
      const list = [...(next.get(messageId) ?? [])];
      const idx = list.findIndex((r) => r.emoji === emoji);
      if (idx >= 0) {
        const count = list[idx]!.count - 1;
        if (count <= 0) {
          list.splice(idx, 1);
        } else {
          list[idx] = { ...list[idx]!, count, reacted_by_me: false };
        }
      }
      next.set(messageId, list);
      queryClient.setQueryData(key, next);
      return { previous };
    },
    onError: (_e, _v, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          ["message-reactions", conversationId],
          context.previous,
        );
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({
        queryKey: ["message-reactions", conversationId],
      });
    },
  });
}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (Callers of the old `useReactMutation(userId)` signature are updated in Task 7.)

- [ ] **Step 4: Commit**

```bash
git add src/features/chat/hooks/useChat.ts
git commit -m "chat: useMessageReactions query + optimistic react/unreact"
```

---

### Task 6: Curated emoji set, ReactionPills, ReactionPopover

**Files:**
- Create: `src/features/chat/constants/reactions.ts`
- Create: `src/features/chat/components/ReactionPills.tsx`
- Create: `src/features/chat/components/ReactionPopover.tsx`

- [ ] **Step 1: Curated set constant**

`src/features/chat/constants/reactions.ts`:

```ts
// Set rápido de reacciones (temática cósmica de Nexo).
export const QUICK_REACTIONS = ["✨", "🔭", "🚀", "🛸", "💫", "👽"] as const;
```

- [ ] **Step 2: ReactionPills component**

`src/features/chat/components/ReactionPills.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ReactionSummary } from "../utils/reactions";

type ReactionPillsProps = {
  reactions: ReactionSummary[];
  onToggle: (emoji: string, reactedByMe: boolean) => void;
  align?: "flex-start" | "flex-end";
};

export function ReactionPills({
  reactions,
  onToggle,
  align = "flex-start",
}: ReactionPillsProps) {
  const theme = useTheme();
  if (reactions.length === 0) return null;

  return (
    <View style={[styles.row, { justifyContent: align }]}>
      {reactions.map((reaction) => (
        <Pressable
          key={reaction.emoji}
          accessibilityRole="button"
          accessibilityLabel={`${reaction.emoji} ${reaction.count}`}
          onPress={() => onToggle(reaction.emoji, reaction.reacted_by_me)}
          style={({ pressed }) => [
            styles.pill,
            {
              borderColor: reaction.reacted_by_me
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: reaction.reacted_by_me
                ? `${theme.colors.primary}24`
                : "rgba(255,255,255,0.04)",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          <Text style={[styles.count, { color: theme.colors.textMuted }]}>
            {reaction.count}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  emoji: { fontSize: 13 },
  count: { fontSize: typography.tiny, fontWeight: "800" },
});
```

- [ ] **Step 3: ReactionPopover component**

`src/features/chat/components/ReactionPopover.tsx`:

```tsx
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { QUICK_REACTIONS } from "../constants/reactions";

type ReactionPopoverProps = {
  onPick: (emoji: string) => void;
  align?: "flex-start" | "flex-end";
};

export function ReactionPopover({ onPick, align = "flex-start" }: ReactionPopoverProps) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.popover,
        {
          alignSelf: align,
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {QUICK_REACTIONS.map((emoji) => (
        <Pressable
          key={emoji}
          accessibilityRole="button"
          accessibilityLabel={`Reaccionar ${emoji}`}
          onPress={() => onPick(emoji)}
          style={({ pressed, hovered }) => [
            styles.item,
            {
              backgroundColor: hovered ? "rgba(255,255,255,0.08)" : "transparent",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={styles.emoji}>{emoji}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  popover: {
    flexDirection: "row",
    gap: 2,
    padding: 5,
    marginTop: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  item: { paddingHorizontal: 5, paddingVertical: 3, borderRadius: 8 },
  emoji: { fontSize: 20 },
});
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/constants/reactions.ts src/features/chat/components/ReactionPills.tsx src/features/chat/components/ReactionPopover.tsx
git commit -m "chat: reaction pills + quick-react popover components"
```

---

### Task 7: Wire reactions into MessageBubble + ChatRoomScreen

**Files:**
- Modify: `src/features/chat/components/MessageBubble.tsx`
- Modify: `src/features/chat/screens/ChatRoomScreen.tsx`

- [ ] **Step 1: Extend MessageBubble props and render**

In `src/features/chat/components/MessageBubble.tsx`:
1. Add imports:

```tsx
import { ReactionPills } from "./ReactionPills";
import { ReactionPopover } from "./ReactionPopover";
import type { ReactionSummary } from "../utils/reactions";
```

2. Add to `MessageBubbleProps`:

```tsx
  reactions?: ReactionSummary[] | undefined;
  onToggleReaction?: ((emoji: string, reactedByMe: boolean) => void) | undefined;
```

3. Add local state for the popover next to `const [hovered, setHovered] = useState(false);`:

```tsx
  const [pickerOpen, setPickerOpen] = useState(false);
```

4. Change the `onReact` action button (inside the `hovered` actions block) to toggle the popover instead of calling a missing handler:

```tsx
              {onToggleReaction ? (
                <ActionButton
                  onPress={() => setPickerOpen((v) => !v)}
                  accessibilityLabel="Reaccionar"
                >
                  <Smile size={14} color={theme.colors.textMuted} />
                </ActionButton>
              ) : null}
```

5. After the `bubbleWrap` closing tag (right before the `isPinned` pinned-row block), render the popover and pills:

```tsx
        {pickerOpen && onToggleReaction ? (
          <ReactionPopover
            align={own ? "flex-end" : "flex-start"}
            onPick={(emoji) => {
              setPickerOpen(false);
              const existing = (reactions ?? []).find((r) => r.emoji === emoji);
              onToggleReaction(emoji, existing?.reacted_by_me ?? false);
            }}
          />
        ) : null}

        {reactions && reactions.length > 0 && onToggleReaction ? (
          <ReactionPills
            reactions={reactions}
            align={own ? "flex-end" : "flex-start"}
            onToggle={onToggleReaction}
          />
        ) : null}
```

(Keep the existing `onReact` prop in the type for backwards compat, but it is no longer used; remove it from the props list and destructuring since `noUnusedLocals` is off but cleaner to drop. If removing causes a typecheck error from a caller, leave it.)

- [ ] **Step 2: Wire ChatRoomScreen**

In `src/features/chat/screens/ChatRoomScreen.tsx`:
1. Update the hook imports to include `useMessageReactions`, `useReactMutation`, `useUnreactMutation`:

```tsx
import {
  useChatDetails,
  useMarkReadMutation,
  useMessageReactions,
  useMessageSubscription,
  useMessages,
  usePinMessageMutation,
  useReactMutation,
  useSendMessageMutation,
  useSetMutedMutation,
  useUnpinMessageMutation,
  useUnreactMutation,
} from "../hooks/useChat";
```

2. After `const rows: MessageWithSender[] = (messages.data ?? []) as MessageWithSender[];` is computed, derive the ids and reactions. Move the `rows` computation above the early returns is not needed — instead compute message ids from `messages.data`. Add near the other hooks (after `const report = ...`):

```tsx
  const messageIds = useMemo(
    () => (messages.data ?? []).map((m) => m.id),
    [messages.data],
  );
  const reactions = useMessageReactions(conversationId, messageIds, userId);
  const react = useReactMutation(conversationId, userId);
  const unreact = useUnreactMutation(conversationId, userId);

  function handleToggleReaction(
    messageId: string,
    emoji: string,
    reactedByMe: boolean,
  ) {
    if (reactedByMe) {
      unreact.mutate({ messageId, emoji });
    } else {
      react.mutate({ messageId, emoji });
    }
  }
```

3. In the `renderItem` for the messages FlatList, pass the reaction props:

```tsx
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              own={item.sender_id === userId}
              senderRole={memberRoleById.get(item.sender_id) ?? null}
              isPinned={pinnedIds.has(item.id)}
              canModerate={canModerate}
              reactions={reactions.data?.get(item.id) ?? []}
              onToggleReaction={(emoji, reactedByMe) =>
                handleToggleReaction(item.id, emoji, reactedByMe)
              }
              onReport={
                item.sender_id !== userId
                  ? () => setReportMessageId(item.id)
                  : undefined
              }
              onPin={() => handlePin(item.id)}
              onUnpin={() => handleUnpin(item.id)}
            />
          )}
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual check in demo**

In a room, hover/long-press a message → tap the 🙂 → pick ✨. A pill `✨ 1` appears under the bubble and is highlighted. Tap the pill → it disappears.

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/components/MessageBubble.tsx src/features/chat/screens/ChatRoomScreen.tsx
git commit -m "chat: wire reactions UI into message bubble and room"
```

---

## Phase 2 — Real last_message + unread

### Task 8: Migration 011 — `list_user_conversations` RPC

**Files:**
- Create: `supabase/migrations/011_list_user_conversations.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/011_list_user_conversations.sql`:

```sql
-- 011: previews de conversaciones del usuario (last_message + unread + member_count).
create or replace function public.list_user_conversations(input_user_id uuid)
returns table (
  conv jsonb,
  community jsonb,
  last_message jsonb,
  unread_count integer,
  member_count integer,
  role text
)
language sql
security definer
set search_path = public
as $$
  select
    to_jsonb(c) as conv,
    to_jsonb(co) as community,
    (
      select to_jsonb(m)
      from public.messages m
      where m.conversation_id = c.id and m.status = 'sent'
      order by m.created_at desc
      limit 1
    ) as last_message,
    (
      select count(*)::int
      from public.messages m2
      where m2.conversation_id = c.id
        and m2.status = 'sent'
        and m2.sender_id <> input_user_id
        and m2.created_at > coalesce(cm.last_read_at, '-infinity'::timestamptz)
    ) as unread_count,
    (
      select count(*)::int
      from public.conversation_members cm2
      where cm2.conversation_id = c.id and cm2.role <> 'banned'
    ) as member_count,
    cm.role as role
  from public.conversation_members cm
  join public.conversations c on c.id = cm.conversation_id
  left join public.communities co on co.id = c.community_id
  where cm.user_id = input_user_id
    and input_user_id = auth.uid()
    and cm.role <> 'banned'
  order by (
    select max(m3.created_at)
    from public.messages m3
    where m3.conversation_id = c.id and m3.status = 'sent'
  ) desc nulls last, c.created_at desc;
$$;
```

- [ ] **Step 2: Document apply order**

Append to `docs/CHATS_ARCHITECTURE.md` §10 a line noting `011_list_user_conversations.sql` applies after 010. (One-line edit; no code.)

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/011_list_user_conversations.sql docs/CHATS_ARCHITECTURE.md
git commit -m "chat: migration 011 list_user_conversations RPC"
```

---

### Task 9: Use the RPC in `listConversations` + demo unread

**Files:**
- Modify: `src/features/chat/services/chat-service.ts:40-75`
- Modify: `src/services/demo-service.ts:1103-1137` (`demoListConversations`)

- [ ] **Step 1: Real branch calls the RPC**

Replace the body of `listConversations` (keeping the demo branch) with:

```ts
export async function listConversations(
  userId: string,
): Promise<ConversationPreview[]> {
  if (env.demoMode) {
    return demoListConversations(userId);
  }

  const { data, error } = await supabase.rpc("list_user_conversations", {
    input_user_id: userId,
  });

  if (error) {
    throw error;
  }

  const rows = (data ?? []) as Array<{
    conv: Conversation;
    community: ConversationPreview["community"];
    last_message: Message | null;
    unread_count: number;
    member_count: number;
    role: ConversationPreview["role"];
  }>;

  return rows.map((row) => ({
    ...row.conv,
    community: row.community,
    last_message: row.last_message,
    unread_count: row.unread_count,
    member_count: row.member_count,
    role: row.role,
  }));
}
```

Ensure `Message` is imported in the `import type` block of `chat-service.ts` (it is, via the domain import).

- [ ] **Step 2: Demo computes unread_count**

In `src/services/demo-service.ts`, in `demoListConversations`, replace `unread_count: 0,` with a real count using the member's `last_read_at`:

```ts
      const lastRead = item.last_read_at;
      const unreadCount = messages.filter(
        (entry) =>
          entry.conversation_id === conversation.id &&
          entry.status === "sent" &&
          entry.sender_id !== userId &&
          (!lastRead || entry.created_at > lastRead),
      ).length;
```

and set `unread_count: unreadCount,` in the returned object.

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Manual check in demo**

The chat list shows the real last message text under each chat (not "Sin mensajes aun" for seeded Lobbies). Send a message from a second identity is not possible in demo, so unread stays 0 — acceptable; verify no crash and previews render.

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/services/chat-service.ts src/services/demo-service.ts
git commit -m "chat: real last_message/unread via RPC + demo unread"
```

---

## Phase 3 — Chat background (wallpaper)

### Task 10: Migration 012 — background column + `set_chat_background` RPC

**Files:**
- Create: `supabase/migrations/012_chat_background.sql`

- [ ] **Step 1: Write the migration**

`supabase/migrations/012_chat_background.sql`:

```sql
-- 012: fondo (wallpaper) del chat. Compartido a nivel de conversación.
alter table public.conversations
  add column if not exists background_url text;

-- Cambia el fondo. community -> mods del chat; direct -> cualquier miembro.
create or replace function public.set_chat_background(
  input_conversation_id uuid,
  input_background_url text
) returns public.conversations
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_id uuid := auth.uid();
  conv public.conversations;
  allowed boolean;
begin
  if caller_id is null then
    raise exception 'Authentication required';
  end if;

  select * into conv from public.conversations where id = input_conversation_id;
  if not found then
    raise exception 'Chat no encontrado';
  end if;

  if conv.type = 'community' then
    allowed := public.is_chat_moderator(input_conversation_id, caller_id);
  else
    allowed := public.is_conversation_member(input_conversation_id, caller_id);
  end if;

  if not allowed then
    raise exception 'No tienes permiso para cambiar el fondo';
  end if;

  update public.conversations
  set background_url = nullif(trim(coalesce(input_background_url, '')), '')
  where id = input_conversation_id
  returning * into conv;

  if conv.type = 'community' then
    insert into public.chat_audit_log (conversation_id, actor_id, action)
    values (input_conversation_id, caller_id, 'chat_updated');
  end if;

  return conv;
end;
$$;
```

- [ ] **Step 2: Document apply order**

Append to `docs/CHATS_ARCHITECTURE.md` §10 a line for `012_chat_background.sql` (after 011). One-line edit.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/012_chat_background.sql docs/CHATS_ARCHITECTURE.md
git commit -m "chat: migration 012 background_url + set_chat_background RPC"
```

---

### Task 11: Background presets + `resolveBackground` helper (TDD)

**Files:**
- Create: `src/features/chat/utils/backgrounds.ts`
- Test: `tests/chat-backgrounds.test.ts`

- [ ] **Step 1: Write the failing test**

`tests/chat-backgrounds.test.ts`:

```ts
/// <reference types="jest" />

import {
  CHAT_BACKGROUNDS,
  resolveBackground,
} from "../src/features/chat/utils/backgrounds";

describe("resolveBackground", () => {
  it("devuelve none con valor vacío o nulo", () => {
    expect(resolveBackground(null)).toEqual({ kind: "none" });
    expect(resolveBackground("")).toEqual({ kind: "none" });
  });

  it("resuelve un preset conocido a su gradiente", () => {
    const preset = CHAT_BACKGROUNDS[0]!;
    const result = resolveBackground(`preset:${preset.id}`);
    expect(result).toEqual({ kind: "preset", gradient: preset.gradient });
  });

  it("trata un preset desconocido como none", () => {
    expect(resolveBackground("preset:no-existe")).toEqual({ kind: "none" });
  });

  it("trata cualquier otra cosa como imagen", () => {
    expect(resolveBackground("https://x/y.jpg")).toEqual({
      kind: "image",
      uri: "https://x/y.jpg",
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- chat-backgrounds`
Expected: FAIL with "Cannot find module".

- [ ] **Step 3: Implement**

`src/features/chat/utils/backgrounds.ts`:

```ts
export type ChatBackgroundPreset = {
  id: string;
  label: string;
  gradient: readonly [string, string];
};

// Presets cósmicos (gradientes, sin assets externos).
export const CHAT_BACKGROUNDS: ChatBackgroundPreset[] = [
  { id: "nebula-violet", label: "Nebulosa violeta", gradient: ["#241355", "#08243a"] },
  { id: "magenta-void", label: "Vacío magenta", gradient: ["#3a0f3a", "#0c1430"] },
  { id: "deep-cyan", label: "Cian profundo", gradient: ["#06263a", "#04121f"] },
  { id: "pulsar", label: "Púlsar", gradient: ["#5b3fe0", "#0a0f22"] },
  { id: "emerald-drift", label: "Deriva esmeralda", gradient: ["#1a3a1a", "#06121a"] },
];

export type ResolvedBackground =
  | { kind: "none" }
  | { kind: "preset"; gradient: readonly [string, string] }
  | { kind: "image"; uri: string };

export function presetValue(id: string): string {
  return `preset:${id}`;
}

export function resolveBackground(value: string | null): ResolvedBackground {
  if (!value || value.trim() === "") return { kind: "none" };
  if (value.startsWith("preset:")) {
    const id = value.slice("preset:".length);
    const preset = CHAT_BACKGROUNDS.find((p) => p.id === id);
    return preset ? { kind: "preset", gradient: preset.gradient } : { kind: "none" };
  }
  return { kind: "image", uri: value };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- chat-backgrounds`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/utils/backgrounds.ts tests/chat-backgrounds.test.ts
git commit -m "chat: background presets + resolveBackground helper + tests"
```

---

### Task 12: Background service + demo + hook

**Files:**
- Modify: `src/features/chat/services/chat-service.ts` (add `setChatBackground` near `updateChat`)
- Modify: `src/services/demo-service.ts` (add `demoSetChatBackground`)
- Modify: `src/features/chat/hooks/useChat.ts` (add `useSetChatBackgroundMutation`)

- [ ] **Step 1: Demo function**

In `src/services/demo-service.ts`, add:

```ts
export async function demoSetChatBackground(
  conversationId: string,
  backgroundUrl: string | null,
): Promise<Conversation> {
  const conversation = conversations.find((c) => c.id === conversationId);
  if (!conversation) {
    throw new Error("Chat no encontrado");
  }
  conversation.background_url =
    backgroundUrl && backgroundUrl.trim() !== "" ? backgroundUrl : null;
  conversation.updated_at = now();
  return conversation;
}
```

- [ ] **Step 2: Service function**

In `src/features/chat/services/chat-service.ts`, add `demoSetChatBackground` to the demo import block and add:

```ts
export async function setChatBackground(
  conversationId: string,
  backgroundUrl: string | null,
): Promise<Conversation> {
  if (env.demoMode) {
    return demoSetChatBackground(conversationId, backgroundUrl);
  }

  const { data, error } = await supabase.rpc("set_chat_background", {
    input_conversation_id: conversationId,
    input_background_url: backgroundUrl,
  });

  if (error) {
    throw error;
  }

  return data as Conversation;
}
```

- [ ] **Step 3: Hook**

In `src/features/chat/hooks/useChat.ts`, add `setChatBackground` to the service import block and add:

```ts
export function useSetChatBackgroundMutation(conversationId: string) {
  return useMutation({
    mutationFn: (backgroundUrl: string | null) =>
      setChatBackground(conversationId, backgroundUrl),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat-details", conversationId],
      });
    },
  });
}
```

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/services/chat-service.ts src/services/demo-service.ts src/features/chat/hooks/useChat.ts
git commit -m "chat: setChatBackground service/demo/hook"
```

---

### Task 13: BackgroundPicker modal

**Files:**
- Create: `src/features/chat/components/BackgroundPicker.tsx`

- [ ] **Step 1: Implement the component**

`src/features/chat/components/BackgroundPicker.tsx`:

```tsx
import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ImagePlus, X } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { pickImage, uploadBase64Image } from "../../../services/storage-service";
import { getErrorMessage } from "../../../utils/errors";
import {
  CHAT_BACKGROUNDS,
  presetValue,
  resolveBackground,
} from "../utils/backgrounds";

type BackgroundPickerProps = {
  visible: boolean;
  current: string | null;
  conversationId: string;
  userId: string;
  onClose: () => void;
  onSelect: (value: string | null) => void;
  saving?: boolean;
};

export function BackgroundPicker({
  visible,
  current,
  conversationId,
  userId,
  onClose,
  onSelect,
  saving,
}: BackgroundPickerProps) {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const resolved = resolveBackground(current);

  async function handleUpload() {
    try {
      setUploading(true);
      const asset = await pickImage();
      if (!asset?.base64) return;
      const url = await uploadBase64Image({
        bucket: "avatars",
        path: `${userId}/chats/${conversationId}/background-${Date.now()}.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      onSelect(url);
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Fondo del chat</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
              <X size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {CHAT_BACKGROUNDS.map((preset) => {
              const active =
                resolved.kind === "preset" &&
                resolved.gradient[0] === preset.gradient[0] &&
                resolved.gradient[1] === preset.gradient[1];
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(presetValue(preset.id))}
                  style={[styles.swatch, active ? { borderColor: theme.colors.primary, borderWidth: 2 } : null]}
                >
                  <LinearGradient
                    colors={[preset.gradient[0], preset.gradient[1]]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sin fondo"
              accessibilityState={{ selected: resolved.kind === "none" }}
              onPress={() => onSelect(null)}
              style={[
                styles.swatch,
                styles.none,
                { borderColor: resolved.kind === "none" ? theme.colors.primary : theme.colors.border },
              ]}
            >
              <Text style={[styles.noneText, { color: theme.colors.textMuted }]}>Ninguno</Text>
            </Pressable>
          </View>

          {resolved.kind === "image" ? (
            <View style={styles.preview}>
              <Image source={{ uri: resolved.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Text style={styles.previewLabel}>Imagen subida</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Subir imagen"
            onPress={handleUpload}
            disabled={uploading || saving}
            style={({ pressed }) => [
              styles.upload,
              { borderColor: theme.colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ImagePlus size={16} color={theme.colors.textMuted} />
            <Text style={[styles.uploadText, { color: theme.colors.textMuted }]}>
              {uploading ? "Subiendo..." : "Subir imagen"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: { width: "100%", maxWidth: 380, borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: typography.h3, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { width: 88, height: 60, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: "transparent" },
  none: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  noneText: { fontSize: typography.tiny, fontWeight: "800" },
  preview: { height: 80, borderRadius: radius.md, overflow: "hidden", justifyContent: "flex-end" },
  previewLabel: { color: "#fff", fontSize: typography.tiny, fontWeight: "800", padding: 8 },
  upload: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderStyle: "dashed", borderRadius: radius.md, paddingVertical: 12,
  },
  uploadText: { fontSize: typography.small, fontWeight: "800" },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/features/chat/components/BackgroundPicker.tsx
git commit -m "chat: BackgroundPicker modal (presets + upload + none)"
```

---

### Task 14: Apply the background in the room + header entry

**Files:**
- Modify: `src/features/chat/components/ChatHeader.tsx`
- Modify: `src/features/chat/screens/ChatRoomScreen.tsx`

- [ ] **Step 1: Add header action props + buttons**

In `src/features/chat/components/ChatHeader.tsx`:
1. Import icons (extend the lucide import): add `Image as ImageIcon, Settings`.
2. Add to `ChatHeaderProps`:

```tsx
  canEditBackground?: boolean;
  onOpenBackground?: () => void;
  canOpenSettings?: boolean;
  onOpenSettings?: () => void;
```

3. In the `actions` View, before the Info button, add:

```tsx
        {canEditBackground && onOpenBackground ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Fondo del chat"
            onPress={onOpenBackground}
            style={({ pressed }) => [
              styles.iconButton,
              { borderColor: theme.colors.border, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <ImageIcon size={16} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
        {canOpenSettings && onOpenSettings ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ajustes del chat"
            onPress={onOpenSettings}
            style={({ pressed }) => [
              styles.iconButton,
              { borderColor: theme.colors.border, opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <Settings size={16} color={theme.colors.textMuted} />
          </Pressable>
        ) : null}
```

- [ ] **Step 2: Render the wallpaper + wire header in ChatRoomScreen**

In `src/features/chat/screens/ChatRoomScreen.tsx`:
1. Add imports:

```tsx
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { BackgroundPicker } from "../components/BackgroundPicker";
import { useSetChatBackgroundMutation } from "../hooks/useChat";
import { resolveBackground } from "../utils/backgrounds";
```

(`useLocalSearchParams` is already imported from `expo-router`; add `router` to that import instead of a duplicate.)

2. Add state + mutation near the other hooks:

```tsx
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const setBackground = useSetChatBackgroundMutation(conversationId);
  const canEditBackground =
    conversation?.type === "direct" ? true : canModerate;
  const background = resolveBackground(conversation?.background_url ?? null);
```

3. Inside the `main` View, as its FIRST child (before `ChatHeader`), add the absolute wallpaper layer:

```tsx
        {background.kind !== "none" ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            {background.kind === "preset" ? (
              <LinearGradient
                colors={[background.gradient[0], background.gradient[1]]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <Image
                source={{ uri: background.uri }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            )}
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: "rgba(7,11,26,0.82)" },
              ]}
            />
          </View>
        ) : null}
```

4. Pass header actions to `ChatHeader`:

```tsx
        <ChatHeader
          conversation={conversation}
          memberCount={members.length}
          currentUserRole={currentUserRole}
          muted={muted}
          showBack={!isDesktop}
          onToggleInfo={() => setInfoOpen((v) => !v)}
          onToggleMute={() =>
            toggleMute.mutate({ conversationId, muted: !muted })
          }
          canEditBackground={canEditBackground}
          onOpenBackground={() => setBackgroundOpen(true)}
          canOpenSettings={conversation.type === "community" && canModerate}
          onOpenSettings={() =>
            router.push({ pathname: "/chat/[id]/settings", params: { id: conversationId } })
          }
        />
```

5. Before the closing `</View>` of `root` (next to the ReportModal), render the picker:

```tsx
      <BackgroundPicker
        visible={backgroundOpen}
        current={conversation.background_url}
        conversationId={conversationId}
        userId={userId ?? ""}
        saving={setBackground.isPending}
        onClose={() => setBackgroundOpen(false)}
        onSelect={(value) => {
          setBackgroundOpen(false);
          setBackground.mutate(value);
        }}
      />
```

- [ ] **Step 3: Typecheck**

Run: `npm run typecheck`
Expected: PASS. (The `/chat/[id]/settings` route exists after Task 15; if executing strictly in order, this `router.push` target may not resolve until then — that is fine, it is a string path and typechecks against expo-router's generated types only if typed routes are on. If a typed-route error appears, complete Task 15 first.)

- [ ] **Step 4: Manual check in demo**

In a community Lobby as admin, tap the 🖼️ icon → pick a preset → the room background changes and text stays legible. In a direct chat, the 🖼️ icon is available to either member.

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/components/ChatHeader.tsx src/features/chat/screens/ChatRoomScreen.tsx
git commit -m "chat: apply chat background + header background/settings actions"
```

---

## Phase 4 — Chat settings screen

### Task 15: Route restructure for `/chat/[id]/settings`

**Files:**
- Delete: `app/chat/[id].tsx`
- Create: `app/chat/[id]/index.tsx`
- Create: `app/chat/[id]/settings.tsx`

- [ ] **Step 1: Move the room route into a folder**

Remove `app/chat/[id].tsx` and create `app/chat/[id]/index.tsx` with the same content:

```tsx
import { ChatRoomScreen } from "../../../src/features/chat/screens/ChatRoomScreen";

export default ChatRoomScreen;
```

(Note the extra `../` — it is now one level deeper.)

- [ ] **Step 2: Create the settings route**

`app/chat/[id]/settings.tsx`:

```tsx
import { ChatSettingsScreen } from "../../../src/features/chat/screens/ChatSettingsScreen";

export default ChatSettingsScreen;
```

(`ChatSettingsScreen` is created in Task 17 — this import resolves then.)

- [ ] **Step 3: Verify routing**

`app/chat/_layout.tsx` is `ProtectedStack` and covers nested routes automatically — no change needed. Confirm `git mv` semantics: use plain delete + create.

```bash
git rm app/chat/[id].tsx
```

- [ ] **Step 4: Commit (after Task 17 compiles)**

Because `settings.tsx` imports a screen created in Task 17, defer the typecheck/commit until Task 17. If you must commit now, temporarily point `settings.tsx` at `ChatRoomScreen` and fix in Task 17. Preferred: do Task 16 + 17, then commit all three together.

---

### Task 16: Demo + service branches for settings actions

**Files:**
- Modify: `src/features/chat/services/chat-service.ts` (`updateChat`, `deleteChat`, `listChatAuditLog`)

- [ ] **Step 1: Route updateChat to demo**

In `updateChat`, replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    const patchRow: Partial<Conversation> = {};
    if (patch.name !== undefined) patchRow.name = patch.name;
    if (patch.description !== undefined) patchRow.description = patch.description;
    if (patch.avatarUrl !== undefined) patchRow.avatar_url = patch.avatarUrl;
    if (patch.bannerUrl !== undefined) patchRow.banner_url = patch.bannerUrl;
    if (patch.visibility !== undefined) patchRow.visibility = patch.visibility;
    if (patch.slowModeSeconds !== undefined)
      patchRow.slow_mode_seconds = patch.slowModeSeconds;
    return demoUpdateChat(conversationId, patchRow);
  }
```

- [ ] **Step 2: Route deleteChat + listChatAuditLog to demo**

In `deleteChat`, replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoDeleteChat(conversationId);
  }
```

In `listChatAuditLog`, replace `ensureNotDemo();` with:

```ts
  if (env.demoMode) {
    return demoListChatAuditLog(conversationId);
  }
```

- [ ] **Step 3: Imports**

Add `demoUpdateChat, demoDeleteChat, demoListChatAuditLog` to the demo-service import block of `chat-service.ts`.

- [ ] **Step 4: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/chat/services/chat-service.ts
git commit -m "chat: demo branches for update/delete/audit-log"
```

---

### Task 17: ChatSettingsScreen

**Files:**
- Create: `src/features/chat/screens/ChatSettingsScreen.tsx`

- [ ] **Step 1: Implement the screen**

`src/features/chat/screens/ChatSettingsScreen.tsx`:

```tsx
import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Globe, History, Lock, Timer, Trash2 } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { TextInput } from "../../../components/ui/TextInput";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ChatVisibility } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { formatRelativeDate } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  useChatAuditLog,
  useChatDetails,
  useDeleteChatMutation,
  useUpdateChatMutation,
} from "../hooks/useChat";

const SLOW_MODE_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1min", value: 60 },
];

const AUDIT_LABELS: Record<string, string> = {
  chat_created: "Chat creado",
  chat_updated: "Ajustes actualizados",
  chat_deleted: "Chat eliminado",
  role_granted: "Rol concedido",
  role_revoked: "Rol retirado",
  admin_transferred: "Admin transferido",
  member_kicked: "Miembro expulsado",
  member_banned: "Miembro baneado",
  member_unbanned: "Miembro desbaneado",
  message_pinned: "Mensaje fijado",
  message_unpinned: "Mensaje desfijado",
  slow_mode_changed: "Modo lento cambiado",
};

export function ChatSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "";
  const theme = useTheme();
  const auth = useAuth();
  const userId = auth.session?.user.id;

  const details = useChatDetails(conversationId, userId);
  const audit = useChatAuditLog(conversationId);
  const update = useUpdateChatMutation(conversationId);
  const conversation = details.data?.conversation ?? null;
  const community = conversation?.community_id ?? undefined;
  const remove = useDeleteChatMutation(community);

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<ChatVisibility | null>(null);
  const [slowMode, setSlowMode] = useState<number | null>(null);

  if (details.isLoading) {
    return <LoadingState label="Cargando ajustes..." />;
  }
  if (details.isError || !conversation) {
    return (
      <ErrorState
        message={getErrorMessage(details.error)}
        onRetry={() => void details.refetch()}
      />
    );
  }

  const role = details.data?.current_user_role ?? null;
  const isAdmin = role === "admin";
  const nameValue = name ?? conversation.name ?? "";
  const descValue = description ?? conversation.description ?? "";
  const visibilityValue = visibility ?? conversation.visibility;
  const slowValue = slowMode ?? conversation.slow_mode_seconds;

  async function handleSave() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      Alert.alert("Nombre invalido", "Entre 2 y 50 caracteres.");
      return;
    }
    try {
      await update.mutateAsync({
        name: trimmed,
        description: descValue.trim() || null,
        visibility: visibilityValue,
        slowModeSeconds: slowValue,
      });
      Alert.alert("Guardado", "Ajustes actualizados.");
    } catch (error) {
      Alert.alert("No se pudo guardar", getErrorMessage(error));
    }
  }

  function handleDelete() {
    Alert.alert("Eliminar chat", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await remove.mutateAsync(conversationId);
            router.replace("/(tabs)/chat");
          } catch (error) {
            Alert.alert("No se pudo eliminar", getErrorMessage(error));
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer scroll contentStyle={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <ArrowLeft size={17} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Ajustes del chat
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Nombre"
          value={nameValue}
          onChangeText={setName}
          maxLength={50}
        />
        <TextInput
          label="Descripcion"
          value={descValue}
          onChangeText={setDescription}
          multiline
          maxLength={400}
          style={styles.bioInput}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
            Visibilidad
          </Text>
          <View style={styles.row}>
            <Chip
              active={visibilityValue === "public"}
              icon={<Globe size={14} color={theme.colors.text} />}
              label="Publica"
              onPress={() => setVisibility("public")}
            />
            <Chip
              active={visibilityValue === "invite_only"}
              icon={<Lock size={14} color={theme.colors.text} />}
              label="Invitacion"
              onPress={() => setVisibility("invite_only")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Timer size={14} color={theme.colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
              Modo lento
            </Text>
          </View>
          <View style={styles.row}>
            {SLOW_MODE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                active={slowValue === option.value}
                label={option.label}
                onPress={() => setSlowMode(option.value)}
              />
            ))}
          </View>
        </View>

        <Button title="Guardar cambios" loading={update.isPending} onPress={handleSave} />

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <History size={14} color={theme.colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
              Historial de moderacion
            </Text>
          </View>
          <View
            style={[
              styles.audit,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            {(audit.data ?? []).length === 0 ? (
              <Text style={[styles.auditEmpty, { color: theme.colors.textFaint }]}>
                Sin acciones registradas.
              </Text>
            ) : (
              (audit.data ?? []).map((entry) => (
                <View key={entry.id} style={styles.auditRow}>
                  <View style={[styles.auditDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.auditText, { color: theme.colors.text }]}>
                    {AUDIT_LABELS[entry.action] ?? entry.action}
                  </Text>
                  <Text style={[styles.auditWhen, { color: theme.colors.textFaint }]}>
                    {formatRelativeDate(entry.created_at)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {isAdmin && !conversation.is_default ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar chat"
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.danger,
              { borderColor: `${theme.colors.error}66`, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Trash2 size={16} color={theme.colors.error} />
            <Text style={[styles.dangerText, { color: theme.colors.error }]}>
              Eliminar chat
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function Chip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? theme.colors.secondary : theme.colors.border,
          backgroundColor: active ? `${theme.colors.primary}24` : "transparent",
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: active ? "#FFFFFF" : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18, paddingTop: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 42, height: 42, borderRadius: radius.md, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: typography.h2, fontWeight: "900" },
  form: { gap: 14 },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  section: { gap: 8 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: typography.small, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, minHeight: 38,
    borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 12,
    justifyContent: "center",
  },
  chipText: { fontSize: typography.small, fontWeight: "800" },
  audit: { borderWidth: 1, borderRadius: radius.md, padding: 12, gap: 10 },
  auditEmpty: { fontSize: typography.small, fontWeight: "600" },
  auditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  auditDot: { width: 6, height: 6, borderRadius: 3 },
  auditText: { flex: 1, fontSize: typography.small, fontWeight: "700" },
  auditWhen: { fontSize: typography.tiny, fontWeight: "700" },
  danger: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderRadius: radius.md, paddingVertical: 12,
    backgroundColor: "rgba(255,107,107,0.06)",
  },
  dangerText: { fontSize: typography.small, fontWeight: "800" },
});
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS. Confirm `useDeleteChatMutation`, `useUpdateChatMutation`, `useChatAuditLog`, `useChatDetails` exist (they do) and `formatRelativeDate` is exported from `src/utils/format`.

- [ ] **Step 3: Run tests**

Run: `npm test`
Expected: PASS (all unit tests including the two new helper suites).

- [ ] **Step 4: Manual check in demo**

From a community Lobby as admin, tap the ⚙️ icon → settings screen loads; edit the name → Guardar → Alert "Guardado". The Lobby shows no "Eliminar chat". Open a non-default chat → "Eliminar chat" is present.

- [ ] **Step 5: Commit the screen + routes together**

```bash
git add src/features/chat/screens/ChatSettingsScreen.tsx app/chat/[id]/index.tsx app/chat/[id]/settings.tsx
git rm app/chat/[id].tsx
git commit -m "chat: ChatSettingsScreen + nested chat routes"
```

---

## Self-Review (completed during planning)

**Spec coverage:**
- §1 demo fix → Task 2 (+ Task 16 for settings actions, Task 4 for reactions).
- §2 reactions → Tasks 3–7.
- §3 last_message/unread (migration 011) → Tasks 8–9.
- §4 ChatSettingsScreen → Tasks 15–17.
- §5 chat background (migration 012) → Tasks 10–14.
- §7 type parity → Task 1 + each field touched in SQL/TS/demo together.
- §10 parked DM items → intentionally NOT implemented (confirmed absent from tasks).

**Placeholder scan:** No "TBD/TODO"; every code step has full code.

**Type consistency:** `aggregateReactions`/`ReactionSummary` consistent across Tasks 3/5/6/7. `resolveBackground`/`CHAT_BACKGROUNDS`/`presetValue` consistent across Tasks 11/13/14. `setChatBackground`/`useSetChatBackgroundMutation` consistent across Tasks 12/14. Reaction mutation signature changed to `(conversationId, userId)` in Task 5 and its only callers are added in Task 7 — no stale callers elsewhere (the previous `useReactMutation`/`useUnreactMutation` had no other consumers).

**Ordering note:** Task 14 references the `/chat/[id]/settings` route created in Task 15; if typed-routes flag errors, do Task 15 before Task 14's typecheck. Tasks 15–17 commit together (Task 15 Step 4 says so).
```
