import { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ReportModal } from "../../../components/content/ReportModal";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { useTheme } from "../../../theme/useTheme";
import type {
  ChatRole,
  ConversationMemberWithProfile,
  Message,
  Profile,
} from "../../../types/domain";
import { messageSchema } from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateReportMutation } from "../../moderation/hooks/useModeration";
import {
  useChatDetails,
  useMarkReadMutation,
  useMessageReactions,
  useMessageSubscription,
  useMessages,
  usePinMessageMutation,
  useReactMutation,
  useSendMessageMutation,
  useSetChatBackgroundMutation,
  useSetMutedMutation,
  useUnpinMessageMutation,
  useUnreactMutation,
} from "../hooks/useChat";
import { ChatHeader } from "../components/ChatHeader";
import { ChatInfoPanel } from "../components/ChatInfoPanel";
import { MessageBubble } from "../components/MessageBubble";
import { MessageComposer } from "../components/MessageComposer";
import { PinnedBar } from "../components/PinnedBar";
import { BackgroundPicker } from "../components/BackgroundPicker";
import { resolveBackground } from "../utils/backgrounds";

const DESKTOP_WIDTH = 1100;

type MessageWithSender = Message & { sender?: Profile | null };

export function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "";
  const theme = useTheme();
  const auth = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width >= DESKTOP_WIDTH;
  const userId = auth.session?.user.id;

  const details = useChatDetails(conversationId, userId);
  const messages = useMessages(conversationId);
  const send = useSendMessageMutation(conversationId, userId);
  const pinMessage = usePinMessageMutation(conversationId, userId);
  const unpinMessage = useUnpinMessageMutation(conversationId);
  const markRead = useMarkReadMutation(userId);
  const toggleMute = useSetMutedMutation(userId);
  const report = useCreateReportMutation(userId);

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

  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const [infoOpen, setInfoOpen] = useState(false);
  const [backgroundOpen, setBackgroundOpen] = useState(false);
  const listRef = useRef<FlatList<MessageWithSender>>(null);
  const setBackground = useSetChatBackgroundMutation(conversationId);

  useMessageSubscription(conversationId);

  useEffect(() => {
    if (!conversationId || !userId) return;
    void markRead.mutateAsync(conversationId).catch(() => undefined);
  }, [conversationId, userId, messages.data?.length]);

  const conversation = details.data?.conversation ?? null;
  const members = details.data?.members ?? [];
  const pinned = details.data?.pinned_messages ?? [];
  const currentUserRole: ChatRole | null =
    details.data?.current_user_role ?? null;
  const currentMember = members.find((m) => m.user_id === userId);
  const muted = currentMember?.muted ?? false;
  const canModerate =
    currentUserRole === "admin" || currentUserRole === "co_admin";
  const slowMode = conversation?.slow_mode_seconds ?? 0;

  const memberRoleById = useMemo(() => {
    const map = new Map<string, ChatRole>();
    members.forEach((m: ConversationMemberWithProfile) =>
      map.set(m.user_id, m.role),
    );
    return map;
  }, [members]);

  const directPeer =
    conversation?.type === "direct"
      ? (members.find((m) => m.user_id !== userId)?.profile ?? null)
      : null;

  const pinnedIds = useMemo(
    () => new Set(pinned.map((p) => p.id)),
    [pinned],
  );

  async function handleSend(body: string) {
    try {
      await send.mutateAsync(messageSchema.parse({ body }));
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    } catch (error) {
      Alert.alert("No se pudo enviar", getErrorMessage(error));
      throw error;
    }
  }

  async function handlePin(messageId: string) {
    try {
      await pinMessage.mutateAsync(messageId);
    } catch (error) {
      Alert.alert("No se pudo fijar", getErrorMessage(error));
    }
  }

  async function handleUnpin(messageId: string) {
    try {
      await unpinMessage.mutateAsync(messageId);
    } catch (error) {
      Alert.alert("No se pudo desfijar", getErrorMessage(error));
    }
  }

  if (details.isLoading || messages.isLoading) {
    return <LoadingState label="Conectando al chat..." />;
  }

  if (details.isError) {
    return (
      <ErrorState
        message={getErrorMessage(details.error)}
        onRetry={() => void details.refetch()}
      />
    );
  }

  if (messages.isError) {
    return (
      <ErrorState
        message={getErrorMessage(messages.error)}
        onRetry={() => void messages.refetch()}
      />
    );
  }

  if (!conversation) {
    return (
      <ErrorState
        title="Chat no encontrado"
        message="Puede haber sido borrado o no tienes acceso."
      />
    );
  }

  const rows: MessageWithSender[] =
    (messages.data ?? []) as MessageWithSender[];

  const background = resolveBackground(conversation.background_url);
  const canEditBackground =
    conversation.type === "direct" ? true : canModerate;

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.background },
      ]}
    >
      <View style={styles.main}>
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
        <ChatHeader
          conversation={conversation}
          memberCount={members.length}
          currentUserRole={currentUserRole}
          directPeer={directPeer}
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

        <PinnedBar
          pinned={pinned}
          canModerate={canModerate}
          onUnpin={handleUnpin}
        />

        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd({ animated: false });
          }}
          ListEmptyComponent={
            <AlienEmptyState
              title="Aun no hay mensajes"
              message="Rompe el silencio con un saludo o una pregunta."
            />
          }
          renderItem={({ item }) => (
            <MessageBubble
              message={item}
              own={item.sender_id === userId}
              senderRole={memberRoleById.get(item.sender_id) ?? null}
              isPinned={pinnedIds.has(item.id)}
              canModerate={canModerate}
              onReport={
                item.sender_id !== userId
                  ? () => setReportMessageId(item.id)
                  : undefined
              }
              onPin={() => handlePin(item.id)}
              onUnpin={() => handleUnpin(item.id)}
              reactions={reactions.data?.get(item.id) ?? []}
              onToggleReaction={(emoji, reactedByMe) =>
                handleToggleReaction(item.id, emoji, reactedByMe)
              }
            />
          )}
        />

        <View style={styles.composerWrap}>
          <MessageComposer
            onSend={handleSend}
            sending={send.isPending}
            slowModeSeconds={slowMode}
            disabled={currentUserRole === "banned"}
            placeholder={
              currentUserRole === "banned"
                ? "Has sido baneado en este chat"
                : slowMode > 0
                  ? `Mensaje (modo lento ${slowMode}s)`
                  : "Escribe un mensaje..."
            }
          />
        </View>
      </View>

      {isDesktop && infoOpen ? (
        <ChatInfoPanel
          conversation={conversation}
          members={members}
          currentUserId={userId ?? ""}
          currentUserRole={currentUserRole}
          onClose={() => setInfoOpen(false)}
        />
      ) : null}

      {!isDesktop && infoOpen ? (
        <View style={styles.mobileOverlay}>
          <ChatInfoPanel
            conversation={conversation}
            members={members}
            currentUserId={userId ?? ""}
            currentUserRole={currentUserRole}
            onClose={() => setInfoOpen(false)}
          />
        </View>
      ) : null}

      <ReportModal
        visible={Boolean(reportMessageId)}
        onClose={() => setReportMessageId(null)}
        onSubmitReport={(reason, details_) =>
          report.mutateAsync({
            targetType: "message",
            targetId: reportMessageId ?? "",
            reason,
            details: details_,
          })
        }
      />

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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  main: {
    flex: 1,
    minHeight: 0,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
    flexGrow: 1,
  },
  composerWrap: {
    paddingHorizontal: 12,
    paddingBottom: 14,
    paddingTop: 8,
  },
  mobileOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    maxWidth: 360,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
});
