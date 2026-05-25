import { useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import type { Message } from "../../../types/domain";
import type { MessageInput } from "../../../utils/validation";
import {
  banMember,
  createChat,
  demoteFromCoAdmin,
  deleteChat,
  getChatDetails,
  getConversation,
  getOrCreateCommunityConversation,
  getOrCreateDirectConversation,
  joinChat,
  kickMember,
  leaveChat,
  listChatAuditLog,
  listChatMembers,
  listCommunityChats,
  listConversations,
  listMessages,
  listPinnedMessages,
  markRead,
  pinMessage,
  promoteToCoAdmin,
  reactToMessage,
  sendMessage,
  setMuted,
  subscribeToMessages,
  transferChatAdmin,
  unbanMember,
  unpinMessage,
  unreactToMessage,
  updateChat,
  type CreateChatInput,
  type UpdateChatPatch,
} from "../services/chat-service";

// =========================
// Read hooks
// =========================

export function useConversations(userId?: string) {
  return useQuery({
    queryKey: ["conversations", userId],
    queryFn: () => listConversations(userId ?? ""),
    enabled: Boolean(userId),
  });
}

export function useCommunityChats(communityId?: string) {
  return useQuery({
    queryKey: ["community-chats", communityId],
    queryFn: () => listCommunityChats(communityId ?? ""),
    enabled: Boolean(communityId),
  });
}

export function useConversation(conversationId?: string) {
  return useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: () => getConversation(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });
}

export function useChatDetails(
  conversationId?: string,
  currentUserId?: string,
) {
  return useQuery({
    queryKey: ["chat-details", conversationId, currentUserId],
    queryFn: () =>
      getChatDetails(conversationId ?? "", currentUserId ?? ""),
    enabled: Boolean(conversationId && currentUserId),
  });
}

export function useChatMembers(conversationId?: string) {
  return useQuery({
    queryKey: ["chat-members", conversationId],
    queryFn: () => listChatMembers(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });
}

export function usePinnedMessages(conversationId?: string) {
  return useQuery({
    queryKey: ["chat-pinned", conversationId],
    queryFn: () => listPinnedMessages(conversationId ?? ""),
    enabled: Boolean(conversationId),
  });
}

export function useChatAuditLog(conversationId?: string) {
  return useQuery({
    queryKey: ["chat-audit", conversationId],
    queryFn: () => listChatAuditLog(conversationId ?? ""),
    enabled: Boolean(conversationId),
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

// =========================
// Mutations: chat lifecycle
// =========================

export function useCreateChatMutation(creatorId?: string) {
  return useMutation({
    mutationFn: (input: CreateChatInput) =>
      createChat(input, creatorId ?? ""),
    onSuccess: async (chat) => {
      await queryClient.invalidateQueries({
        queryKey: ["community-chats", chat.community_id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["conversations"],
      });
    },
  });
}

export function useUpdateChatMutation(conversationId: string) {
  return useMutation({
    mutationFn: (patch: UpdateChatPatch) => updateChat(conversationId, patch),
    onSuccess: async (chat) => {
      await queryClient.invalidateQueries({
        queryKey: ["conversation", conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat-details", conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["community-chats", chat.community_id],
      });
    },
  });
}

export function useDeleteChatMutation(communityId?: string) {
  return useMutation({
    mutationFn: deleteChat,
    onSuccess: async () => {
      if (communityId) {
        await queryClient.invalidateQueries({
          queryKey: ["community-chats", communityId],
        });
      }
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

// =========================
// Mutations: membership
// =========================

export function useJoinChatMutation(userId?: string) {
  return useMutation({
    mutationFn: (conversationId: string) =>
      joinChat(conversationId, userId ?? ""),
    onSuccess: async (_data, conversationId) => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat-details", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useLeaveChatMutation(userId?: string) {
  return useMutation({
    mutationFn: (conversationId: string) =>
      leaveChat(conversationId, userId ?? ""),
    onSuccess: async (_data, conversationId) => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useKickMemberMutation(conversationId: string) {
  return useMutation({
    mutationFn: (userId: string) => kickMember(conversationId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
    },
  });
}

export function useBanMemberMutation(conversationId: string) {
  return useMutation({
    mutationFn: (userId: string) => banMember(conversationId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
    },
  });
}

export function useUnbanMemberMutation(conversationId: string) {
  return useMutation({
    mutationFn: (userId: string) => unbanMember(conversationId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
    },
  });
}

// =========================
// Mutations: roles
// =========================

export function useTransferAdminMutation(conversationId: string) {
  return useMutation({
    mutationFn: (newAdminId: string) =>
      transferChatAdmin(conversationId, newAdminId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["chat-details", conversationId],
      });
    },
  });
}

export function usePromoteToCoAdminMutation(conversationId: string) {
  return useMutation({
    mutationFn: (userId: string) =>
      promoteToCoAdmin(conversationId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
    },
  });
}

export function useDemoteFromCoAdminMutation(conversationId: string) {
  return useMutation({
    mutationFn: (userId: string) =>
      demoteFromCoAdmin(conversationId, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", conversationId],
      });
    },
  });
}

// =========================
// Mutations: pinned
// =========================

export function usePinMessageMutation(
  conversationId: string,
  userId?: string,
) {
  return useMutation({
    mutationFn: (messageId: string) =>
      pinMessage(conversationId, messageId, userId ?? ""),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-pinned", conversationId],
      });
    },
  });
}

export function useUnpinMessageMutation(conversationId: string) {
  return useMutation({
    mutationFn: (messageId: string) =>
      unpinMessage(conversationId, messageId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["chat-pinned", conversationId],
      });
    },
  });
}

// =========================
// Mutations: reactions
// =========================

export function useReactMutation(userId?: string) {
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => reactToMessage(messageId, userId ?? "", emoji),
  });
}

export function useUnreactMutation(userId?: string) {
  return useMutation({
    mutationFn: ({
      messageId,
      emoji,
    }: {
      messageId: string;
      emoji: string;
    }) => unreactToMessage(messageId, userId ?? "", emoji),
  });
}

// =========================
// Mutations: preferences
// =========================

export function useSetMutedMutation(userId?: string) {
  return useMutation({
    mutationFn: ({
      conversationId,
      muted,
    }: {
      conversationId: string;
      muted: boolean;
    }) => setMuted(conversationId, userId ?? "", muted),
    onSuccess: async (_data, vars) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      await queryClient.invalidateQueries({
        queryKey: ["chat-members", vars.conversationId],
      });
    },
  });
}

export function useMarkReadMutation(userId?: string) {
  return useMutation({
    mutationFn: (conversationId: string) =>
      markRead(conversationId, userId ?? ""),
  });
}

// =========================
// Messages
// =========================

export function useSendMessageMutation(
  conversationId: string,
  senderId?: string,
) {
  return useMutation({
    mutationFn: (input: MessageInput) =>
      sendMessage({
        conversationId,
        senderId: senderId ?? "",
        input,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["messages", conversationId],
      });
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
      getOrCreateDirectConversation({
        userId: userId ?? "",
        otherUserId,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["conversations", userId],
      });
    },
  });
}
