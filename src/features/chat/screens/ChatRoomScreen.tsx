import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Flag, Send } from "lucide-react-native";
import { ReportModal } from "../../../components/content/ReportModal";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TextInput } from "../../../components/ui/TextInput";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { Message, Profile } from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";
import { messageSchema, type MessageInput } from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateReportMutation } from "../../moderation/hooks/useModeration";
import {
  useMessageSubscription,
  useMessages,
  useSendMessageMutation,
} from "../hooks/useChat";

type MessageWithSender = Message & {
  sender?: Profile;
};

export function ChatRoomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const messages = useMessages(id);
  const send = useSendMessageMutation(id, auth.session?.user.id);
  const report = useCreateReportMutation(auth.session?.user.id);
  const [reportMessageId, setReportMessageId] = useState<string | null>(null);
  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      body: "",
    },
  });

  useMessageSubscription(id);

  async function handleSend(input: MessageInput) {
    try {
      await send.mutateAsync(input);
      form.reset({ body: "" });
    } catch (error) {
      Alert.alert("No se pudo enviar", getErrorMessage(error));
    }
  }

  if (messages.isLoading) {
    return <LoadingState label="Conectando a Realtime..." />;
  }

  if (messages.isError) {
    return <ErrorState onRetry={() => void messages.refetch()} />;
  }

  return (
    <ScreenContainer
      footer={
        <View
          style={[
            styles.composer,
            { backgroundColor: theme.colors.background, borderColor: theme.colors.border },
          ]}
        >
          <Controller
            control={form.control}
            name="body"
            render={({ field, fieldState }) => (
              <TextInput
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Mensaje..."
                multiline
                style={styles.messageInput}
              />
            )}
          />
          <Button
            title="Enviar"
            loading={send.isPending}
            icon={<Send size={17} color="#FFFFFF" />}
            onPress={form.handleSubmit(handleSend)}
          />
        </View>
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Sala en vivo</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Mensajes visibles solo para miembros de la conversacion.
        </Text>
      </View>
      <FlatList
        data={(messages.data ?? []) as MessageWithSender[]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            title="Aun no hay mensajes"
            message="Abre la conversacion con una pregunta amable."
          />
        }
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            own={item.sender_id === auth.session?.user.id}
            onReport={() => setReportMessageId(item.id)}
          />
        )}
      />
      <ReportModal
        visible={Boolean(reportMessageId)}
        onClose={() => setReportMessageId(null)}
        onSubmitReport={(reason, details) =>
          report.mutateAsync({
            targetType: "message",
            targetId: reportMessageId ?? "",
            reason,
            details,
          })
        }
      />
    </ScreenContainer>
  );
}

function MessageBubble({
  message,
  own,
  onReport,
}: {
  message: MessageWithSender;
  own: boolean;
  onReport: () => void;
}) {
  const theme = useTheme();
  const name = message.sender?.display_name ?? message.sender?.username ?? "Usuario";

  return (
    <View style={[styles.messageRow, own && styles.messageRowOwn]}>
      {!own ? <Avatar uri={message.sender?.avatar_url} label={name} size={30} /> : null}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: own ? theme.colors.primary : theme.colors.surface,
            borderColor: own ? theme.colors.primary : theme.colors.border,
          },
        ]}
      >
        {!own ? (
          <Text style={[styles.sender, { color: theme.colors.secondary }]}>{name}</Text>
        ) : null}
        <Text style={[styles.body, { color: own ? "#FFFFFF" : theme.colors.text }]}>
          {message.body}
        </Text>
        <View style={styles.bubbleMeta}>
          <Text style={[styles.time, { color: own ? "#E6E2FF" : theme.colors.textFaint }]}>
            {formatRelativeDate(message.created_at)}
          </Text>
          {!own ? (
            <Button
              title="Reportar"
              variant="ghost"
              size="sm"
              icon={<Flag size={14} color={theme.colors.textMuted} />}
              onPress={onReport}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.small,
  },
  list: {
    gap: 10,
    paddingBottom: 150,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  bubble: {
    maxWidth: "82%",
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 10,
    gap: 4,
  },
  sender: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  body: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  bubbleMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  time: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  composer: {
    borderTopWidth: 1,
    padding: 12,
    gap: 10,
  },
  messageInput: {
    maxHeight: 96,
    textAlignVertical: "top",
  },
});
