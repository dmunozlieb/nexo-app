import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import type { Message } from "../../../types/domain";
import type { MessageInput } from "../../../utils/validation";
import {
  getOrCreateDirectConversation,
  getOrCreateCommunityConversation,
  listConversations,
  listMessages,
  sendMessage,
  subscribeToMessages,
} from "../services/chat-service";

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => listConversations(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => listMessages(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });
}

export function useMessageSubscription(conversationId?: string) {
  useEffect(() => {
    if (!conversationId) {
      return;
    }

    const channel = subscribeToMessages(conversationId, (message: Message) => {
      queryClient.setQueryData<Array<Message>>(
        ["messages", conversationId],
        (current = []) => {
          if (current.some((item) => item.id === message.id)) {
            return current;
          }

          return [...current, message];
        },
      );
    });

    return () => {
      void channel.unsubscribe();
    };
  }, [conversationId]);
}

export function useSendMessageMutation(conversationId: string, senderId?: string) {
  return useMutation({
    mutationFn: (input: MessageInput) =>
      sendMessage({
        conversationId,
        senderId: senderId ?? "",
        input,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    },
  });
}

export function useCommunityConversationMutation() {
  return useMutation({
    mutationFn: getOrCreateCommunityConversation,
  });
}

export function useDirectConversationMutation(userId?: string) {
  return useMutation({
    mutationFn: (otherUserId: string) =>
      getOrCreateDirectConversation({ userId: userId ?? "", otherUserId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["conversations", userId] });
    },
  });
}
