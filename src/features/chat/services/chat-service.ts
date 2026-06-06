import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoGetOrCreateDirectConversation,
  demoGetOrCreateCommunityConversation,
  demoGetChatDetails,
  demoListConversations,
  demoListChatMembers,
  demoListMessageReactions,
  demoListMessages,
  demoListPinnedMessages,
  demoReactToMessage,
  demoSendMessage,
  demoSubscribeToMessages,
  demoUnreactToMessage,
} from "../../../services/demo-service";
import type {
  ChatAuditEntry,
  ChatDetails,
  ChatPinnedMessage,
  ChatVisibility,
  Conversation,
  ConversationMemberWithProfile,
  ConversationPreview,
  Message,
  MessageReaction,
  MessageWithMeta,
  Profile,
} from "../../../types/domain";
import type { MessageInput } from "../../../utils/validation";
import { sanitizePlainText } from "../../../utils/sanitize";

const DEMO_FEATURE_DISABLED =
  "Esta accion no esta disponible en modo demo.";

function ensureNotDemo() {
  if (env.demoMode) {
    throw new Error(DEMO_FEATURE_DISABLED);
  }
}

// =========================
// Conversations (read)
// =========================

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

export async function listCommunityChats(
  communityId: string,
): Promise<Conversation[]> {
  if (env.demoMode) {
    const conversations = await demoListConversations("");
    return conversations
      .filter((entry) => entry.community_id === communityId)
      .map(({ community: _community, ...rest }) => rest);
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("type", "community")
    .eq("community_id", communityId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Conversation[];
}

export async function getConversation(
  conversationId: string,
): Promise<Conversation | null> {
  if (env.demoMode) {
    throw new Error(DEMO_FEATURE_DISABLED);
  }

  const { data, error } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data ?? null) as Conversation | null;
}

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

// =========================
// Conversations (write)
// =========================

export async function getOrCreateCommunityConversation(communityId: string) {
  if (env.demoMode) {
    return demoGetOrCreateCommunityConversation(communityId);
  }

  const { data, error } = await supabase.rpc(
    "get_or_create_community_conversation",
    { input_community_id: communityId },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function getOrCreateDirectConversation({
  userId,
  otherUserId,
}: {
  userId: string;
  otherUserId: string;
}) {
  if (env.demoMode) {
    return demoGetOrCreateDirectConversation(userId, otherUserId);
  }

  const { data, error } = await supabase.rpc(
    "get_or_create_direct_conversation",
    { input_other_user_id: otherUserId },
  );

  if (error) {
    throw error;
  }

  return data;
}

export type CreateChatInput = {
  communityId: string;
  name: string;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  visibility?: ChatVisibility;
  slowModeSeconds?: number;
};

export async function createChat(
  input: CreateChatInput,
  creatorId: string,
): Promise<Conversation> {
  ensureNotDemo();

  const { data, error } = await supabase.rpc("create_community_chat", {
    input_community_id: input.communityId,
    input_name: input.name,
    input_description: input.description ?? null,
    input_avatar_url: input.avatarUrl ?? null,
    input_banner_url: input.bannerUrl ?? null,
    input_visibility: input.visibility ?? "public",
    input_slow_mode_seconds: input.slowModeSeconds ?? 0,
  });

  if (error) {
    throw error;
  }

  return data as Conversation;
}

export type UpdateChatPatch = {
  name?: string | null;
  description?: string | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  visibility?: ChatVisibility;
  slowModeSeconds?: number;
};

export async function updateChat(
  conversationId: string,
  patch: UpdateChatPatch,
): Promise<Conversation> {
  ensureNotDemo();

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.description !== undefined) row.description = patch.description;
  if (patch.avatarUrl !== undefined) row.avatar_url = patch.avatarUrl;
  if (patch.bannerUrl !== undefined) row.banner_url = patch.bannerUrl;
  if (patch.visibility !== undefined) row.visibility = patch.visibility;
  if (patch.slowModeSeconds !== undefined)
    row.slow_mode_seconds = patch.slowModeSeconds;

  const { data, error } = await supabase
    .from("conversations")
    .update(row)
    .eq("id", conversationId)
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Conversation;
}

export async function deleteChat(conversationId: string) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversations")
    .delete()
    .eq("id", conversationId);

  if (error) {
    throw error;
  }
}

// =========================
// Membership + roles
// =========================

export async function listChatMembers(
  conversationId: string,
): Promise<ConversationMemberWithProfile[]> {
  if (env.demoMode) {
    return demoListChatMembers(conversationId);
  }

  const { data, error } = await supabase
    .from("conversation_members")
    .select("*, profile:profiles(*)")
    .eq("conversation_id", conversationId)
    .order("role", { ascending: true })
    .order("joined_at", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as ConversationMemberWithProfile[];
}

export async function joinChat(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .insert({
      conversation_id: conversationId,
      user_id: userId,
      role: "member",
    });

  if (error) {
    throw error;
  }
}

export async function leaveChat(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function kickMember(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function banMember(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .upsert(
      {
        conversation_id: conversationId,
        user_id: userId,
        role: "banned",
      },
      { onConflict: "conversation_id,user_id" },
    );

  if (error) {
    throw error;
  }
}

export async function unbanMember(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("user_id", userId)
    .eq("role", "banned");

  if (error) {
    throw error;
  }
}

export async function transferChatAdmin(
  conversationId: string,
  newAdminId: string,
) {
  ensureNotDemo();

  const { error } = await supabase.rpc("transfer_chat_admin", {
    input_conversation_id: conversationId,
    input_new_admin_id: newAdminId,
  });

  if (error) {
    throw error;
  }
}

export async function promoteToCoAdmin(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase.rpc("promote_to_co_admin", {
    input_conversation_id: conversationId,
    input_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

export async function demoteFromCoAdmin(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase.rpc("demote_from_co_admin", {
    input_conversation_id: conversationId,
    input_user_id: userId,
  });

  if (error) {
    throw error;
  }
}

// =========================
// Member preferences (mute, read)
// =========================

export async function setMuted(
  conversationId: string,
  userId: string,
  muted: boolean,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .update({ muted })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

export async function markRead(
  conversationId: string,
  userId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("conversation_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }
}

// =========================
// Messages
// =========================

export async function listMessages(conversationId: string) {
  if (env.demoMode) {
    return demoListMessages(conversationId);
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles!messages_sender_id_fkey(*)")
    .eq("conversation_id", conversationId)
    .eq("status", "sent")
    .order("created_at", { ascending: true })
    .limit(80);

  if (error) {
    throw error;
  }

  return (data ?? []) as unknown as Array<Message & { sender?: unknown }>;
}

export async function sendMessage({
  conversationId,
  senderId,
  input,
}: {
  conversationId: string;
  senderId: string;
  input: MessageInput;
}) {
  if (env.demoMode) {
    return demoSendMessage({ conversationId, senderId, input });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      body: sanitizePlainText(input.body),
      media_urls: [],
      status: "sent",
      created_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data as Message;
}

export function subscribeToMessages(
  conversationId: string,
  onMessage: (message: Message) => void,
) {
  if (env.demoMode) {
    return demoSubscribeToMessages(conversationId, onMessage);
  }

  const channelName = `conversation:${conversationId}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2)}`;

  return supabase
    .channel(channelName)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onMessage(payload.new as Message),
    )
    .subscribe();
}

// =========================
// Pinned messages
// =========================

export async function listPinnedMessages(
  conversationId: string,
): Promise<MessageWithMeta[]> {
  if (env.demoMode) {
    return demoListPinnedMessages(conversationId);
  }

  const { data, error } = await supabase
    .from("chat_pinned_messages")
    .select("*, message:messages(*, sender:profiles!messages_sender_id_fkey(*))")
    .eq("conversation_id", conversationId)
    .order("pinned_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const message = (row as unknown as { message: Message & { sender?: Profile | null } })
      .message;
    return {
      ...message,
      sender: message.sender ?? null,
      reactions: [],
      is_pinned: true,
    } satisfies MessageWithMeta;
  });
}

export async function pinMessage(
  conversationId: string,
  messageId: string,
  pinnedBy: string,
) {
  ensureNotDemo();

  const { error } = await supabase.from("chat_pinned_messages").insert({
    conversation_id: conversationId,
    message_id: messageId,
    pinned_by: pinnedBy,
  });

  if (error) {
    throw error;
  }
}

export async function unpinMessage(
  conversationId: string,
  messageId: string,
) {
  ensureNotDemo();

  const { error } = await supabase
    .from("chat_pinned_messages")
    .delete()
    .eq("conversation_id", conversationId)
    .eq("message_id", messageId);

  if (error) {
    throw error;
  }
}

// =========================
// Reactions
// =========================

export async function listMessageReactions(
  messageIds: string[],
): Promise<MessageReaction[]> {
  if (env.demoMode) { return demoListMessageReactions(messageIds); }

  if (messageIds.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("message_reactions")
    .select("*")
    .in("message_id", messageIds);

  if (error) {
    throw error;
  }

  return (data ?? []) as MessageReaction[];
}

export async function reactToMessage(
  messageId: string,
  userId: string,
  emoji: string,
) {
  if (env.demoMode) { return demoReactToMessage(messageId, userId, emoji); }

  const { error } = await supabase
    .from("message_reactions")
    .insert({ message_id: messageId, user_id: userId, emoji });

  if (error && !`${error.message}`.includes("duplicate")) {
    throw error;
  }
}

export async function unreactToMessage(
  messageId: string,
  userId: string,
  emoji: string,
) {
  if (env.demoMode) { return demoUnreactToMessage(messageId, userId, emoji); }

  const { error } = await supabase
    .from("message_reactions")
    .delete()
    .eq("message_id", messageId)
    .eq("user_id", userId)
    .eq("emoji", emoji);

  if (error) {
    throw error;
  }
}

// =========================
// Audit log
// =========================

export async function listChatAuditLog(
  conversationId: string,
): Promise<ChatAuditEntry[]> {
  ensureNotDemo();

  const { data, error } = await supabase
    .from("chat_audit_log")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    throw error;
  }

  return (data ?? []) as ChatAuditEntry[];
}

// Re-export for callers that prefer named import
export type { ChatPinnedMessage };
