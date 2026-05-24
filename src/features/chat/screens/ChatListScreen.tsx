import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { MessageSquare } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { useAuth } from "../../auth/hooks/useAuth";
import { useConversations } from "../hooks/useChat";

export function ChatListScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const conversations = useConversations(auth.session?.user.id);

  if (conversations.isLoading) {
    return <LoadingState label="Abriendo canales..." />;
  }

  if (conversations.isError) {
    return <ErrorState onRetry={() => void conversations.refetch()} />;
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Chat</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Salas de comunidad y conversaciones preparadas para Realtime.
        </Text>
      </View>
      <FlatList
        data={conversations.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<MessageSquare size={36} color={theme.colors.secondary} />}
            title="Sin conversaciones"
            message="Entra a una Orbita y abre su sala para empezar."
          />
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir chat ${item.community?.name ?? item.id}`}
            onPress={() => router.push({ pathname: "/chat/[id]", params: { id: item.id } })}
            style={({ pressed }) => [
              styles.row,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Avatar uri={item.community?.avatar_url} label={item.community?.name} size={48} />
            <View style={styles.copy}>
              <Text style={[styles.name, { color: theme.colors.text }]}>
                {item.community?.name ?? "Conversacion"}
              </Text>
              <Text style={[styles.message, { color: theme.colors.textMuted }]} numberOfLines={1}>
                {item.last_message?.body ?? "Sala lista para nuevos mensajes."}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 14,
    gap: 6,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  list: {
    gap: 10,
    paddingBottom: 28,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  copy: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  message: {
    fontSize: typography.small,
  },
});
