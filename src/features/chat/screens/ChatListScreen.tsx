import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  BellOff,
  Hash,
  Lock,
  MessageSquare,
  Search,
  Users,
} from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ConversationPreview } from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import { useConversations } from "../hooks/useChat";
import { RoleBadge } from "../components/RoleBadge";

type ChatGroup = {
  key: string;
  title: string;
  chats: ConversationPreview[];
};

export function ChatListScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const conversations = useConversations(auth.session?.user.id);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const all = conversations.data ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter((chat) => {
      const name = (chat.name ?? chat.community?.name ?? "").toLowerCase();
      const description = (chat.description ?? "").toLowerCase();
      return name.includes(q) || description.includes(q);
    });
  }, [conversations.data, query]);

  const groups = useMemo<ChatGroup[]>(() => {
    const buckets = new Map<string, ChatGroup>();
    const directs: ConversationPreview[] = [];

    for (const chat of filtered) {
      if (chat.type === "direct") {
        directs.push(chat);
        continue;
      }
      const key = chat.community?.id ?? "sin-orbita";
      const title = chat.community?.name ?? "Sin Orbita";
      if (!buckets.has(key)) {
        buckets.set(key, { key, title, chats: [] });
      }
      buckets.get(key)!.chats.push(chat);
    }

    const list = Array.from(buckets.values()).sort((a, b) =>
      a.title.localeCompare(b.title),
    );

    if (directs.length > 0) {
      list.unshift({ key: "directs", title: "Mensajes directos", chats: directs });
    }

    return list;
  }, [filtered]);

  if (conversations.isLoading) {
    return <LoadingState label="Abriendo canales..." />;
  }

  if (conversations.isError) {
    return <ErrorState onRetry={() => void conversations.refetch()} />;
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <MessageSquare size={20} color={theme.colors.secondary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Chats</Text>
        </View>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Tus salas en las Orbitas y conversaciones directas.
        </Text>
      </View>

      <View
        style={[
          styles.searchRow,
          {
            borderColor: theme.colors.border,
            backgroundColor: theme.colors.surface,
          },
        ]}
      >
        <Search size={15} color={theme.colors.textFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Buscar chats..."
          placeholderTextColor={theme.colors.textFaint}
          style={[styles.searchInput, { color: theme.colors.text }]}
        />
      </View>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.key}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <AlienEmptyState
            title={query ? "Sin resultados" : "Esta zona del espacio esta tranquila"}
            message={
              query
                ? "Prueba con otro nombre."
                : "Entra a una Orbita y abre su sala para empezar."
            }
            action={
              query ? undefined : (
                <Button
                  title="Explorar Orbitas"
                  onPress={() => router.push("/discover")}
                />
              )
            }
          />
        }
        renderItem={({ item }) => (
          <GroupSection group={item} themeColors={theme.colors} />
        )}
      />
    </ScreenContainer>
  );
}

function GroupSection({
  group,
  themeColors,
}: {
  group: ChatGroup;
  themeColors: ReturnType<typeof useTheme>["colors"];
}) {
  const community = group.chats.find((c) => c.community)?.community ?? null;
  const isDirect = group.key === "directs";

  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <Text style={[styles.groupTitle, { color: themeColors.textMuted }]}>
          {group.title}
        </Text>
        {!isDirect && community ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Abrir Orbita ${group.title}`}
            onPress={() =>
              router.push({
                pathname: "/community/[id]",
                params: { id: community.id, tab: "chats" },
              })
            }
            style={({ pressed }) => [
              styles.groupActionButton,
              {
                borderColor: themeColors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Text
              style={[styles.groupActionText, { color: themeColors.textMuted }]}
            >
              Ver Orbita
            </Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.rows}>
        {group.chats.map((chat) => (
          <ChatRow key={chat.id} chat={chat} themeColors={themeColors} />
        ))}
      </View>
    </View>
  );
}

function ChatRow({
  chat,
  themeColors,
}: {
  chat: ConversationPreview;
  themeColors: ReturnType<typeof useTheme>["colors"];
}) {
  const title =
    chat.name ??
    (chat.type === "direct"
      ? "Mensaje directo"
      : (chat.community?.name ?? "Conversacion"));
  const hasUnread = chat.unread_count > 0;
  const isPrivate = chat.visibility === "invite_only";

  const preview =
    chat.last_message?.body ??
    (chat.is_default
      ? "Sala principal de la Orbita."
      : "Sin mensajes aun.");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir chat ${title}`}
      onPress={() =>
        router.push({ pathname: "/chat/[id]", params: { id: chat.id } })
      }
      style={({ pressed, hovered }) => [
        styles.row,
        {
          backgroundColor: hovered
            ? "rgba(255,255,255,0.04)"
            : "transparent",
          borderColor: themeColors.border,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={styles.rowAvatarWrap}>
        <Avatar
          uri={chat.avatar_url ?? chat.community?.avatar_url}
          label={title}
          size={42}
        />
        {chat.is_default ? (
          <View
            style={[
              styles.defaultDot,
              {
                backgroundColor: themeColors.secondary,
                borderColor: themeColors.background,
              },
            ]}
          />
        ) : null}
      </View>

      <View style={styles.rowCopy}>
        <View style={styles.rowTitleLine}>
          {chat.is_default ? (
            <Hash size={12} color={themeColors.textFaint} />
          ) : null}
          <Text
            style={[styles.rowTitle, { color: themeColors.text }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          {isPrivate ? (
            <Lock size={11} color={themeColors.textFaint} />
          ) : null}
          {chat.role && chat.role !== "member" ? (
            <RoleBadge role={chat.role} />
          ) : null}
        </View>
        <Text
          style={[styles.rowPreview, { color: themeColors.textFaint }]}
          numberOfLines={1}
        >
          {preview}
        </Text>
      </View>

      <View style={styles.rowMeta}>
        {chat.last_message ? (
          <Text
            style={[styles.rowTime, { color: themeColors.textFaint }]}
          >
            {formatRelativeDate(chat.last_message.created_at)}
          </Text>
        ) : null}
        <View style={styles.rowMetaBottom}>
          {chat.member_count > 0 ? (
            <View style={styles.rowMembers}>
              <Users size={10} color={themeColors.textFaint} />
              <Text
                style={[styles.rowMembersText, { color: themeColors.textFaint }]}
              >
                {chat.member_count}
              </Text>
            </View>
          ) : null}
          {hasUnread ? (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: themeColors.primary },
              ]}
            >
              <Text style={styles.unreadText}>
                {chat.unread_count > 99 ? "99+" : chat.unread_count}
              </Text>
            </View>
          ) : null}
          {chat.role === "banned" ? (
            <BellOff size={12} color={themeColors.error} />
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 12,
    gap: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "500",
  },
  list: {
    gap: 14,
    paddingBottom: 30,
  },
  group: {
    gap: 6,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  groupTitle: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  groupActionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  groupActionText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  rows: {
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
  },
  rowAvatarWrap: {
    position: "relative",
  },
  defaultDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowTitle: {
    fontSize: typography.small,
    fontWeight: "800",
    flexShrink: 1,
  },
  rowPreview: {
    fontSize: typography.tiny,
    fontWeight: "500",
  },
  rowMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  rowTime: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  rowMetaBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rowMembers: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  rowMembersText: {
    fontSize: 10,
    fontWeight: "700",
  },
  unreadBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "900",
  },
});
