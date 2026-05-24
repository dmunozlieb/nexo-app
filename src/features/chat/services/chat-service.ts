import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoGetOrCreateDirectConversation,
  demoGetOrCreateCommunityConversation,
  demoListConversations,
  demoListMessages,
  demoSendMessage,
  demoSubscribeToMessages,
} from "../../../services/demo-service";
import type { ConversationPreview, Message } from "../../../types/domain";
import type { MessageInput } from "../../../utils/validation";
import { sanitizePlainText } from "../../../utils/sanitize";

export async function listConversations(userId: string): Promise<ConversationPreview[]> {
  if (env.demoMode) {
    return demoListConversations(userId);
  }

  const { data, error } = await supabase
    .from("conversation_members")
    .select("conversation:conversations(*, community:communities(*))")
    .eq("user_id", userId)
    .order("joined_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => {
    const conversation = (row as unknown as { conversation: ConversationPreview }).conversation;
    return {
      ...conversation,
      last_message: null as ConversationPreview["last_message"],
      unread_count: 0,
    };
  });
}

export async function getOrCreateCommunityConversation(communityId: string) {
  if (env.demoMode) {
    return demoGetOrCreateCommunityConversation(communityId);
  }

  const { data, error } = await supabase.rpc(
    "get_or_create_community_conversation",
    {
      input_community_id: communityId,
    },
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

  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    input_other_user_id: otherUserId,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function listMessages(conversationId: string) {
  if (env.demoMode) {
    return demoListMessages(conversationId);
  }

  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:profiles(*)")
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

  return supabase
    .channel(`conversation:${conversationId}`)
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
