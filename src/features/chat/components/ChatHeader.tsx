import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  ArrowLeft,
  Bell,
  BellOff,
  Image as ImageIcon,
  Info,
  Lock,
  Settings,
  Users,
} from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ChatRole, Conversation } from "../../../types/domain";
import { RoleBadge } from "./RoleBadge";

type ChatHeaderProps = {
  conversation: Conversation;
  memberCount: number;
  currentUserRole: ChatRole | null;
  muted?: boolean;
  showBack?: boolean;
  onToggleInfo: () => void;
  onToggleMute?: () => void;
  canEditBackground?: boolean;
  onOpenBackground?: () => void;
  canOpenSettings?: boolean;
  onOpenSettings?: () => void;
};

export function ChatHeader({
  conversation,
  memberCount,
  currentUserRole,
  muted,
  showBack = false,
  onToggleInfo,
  onToggleMute,
  canEditBackground,
  onOpenBackground,
  canOpenSettings,
  onOpenSettings,
}: ChatHeaderProps) {
  const theme = useTheme();
  const isPrivate = conversation.visibility === "invite_only";
  const title = conversation.name ?? "Conversacion";

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: theme.colors.border,
          backgroundColor: "rgba(7,11,26,0.78)",
        },
      ]}
    >
      <View style={styles.left}>
        {showBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <ArrowLeft size={17} color={theme.colors.text} />
          </Pressable>
        ) : null}
        <Avatar
          uri={conversation.avatar_url}
          label={title}
          size={42}
        />
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            <Text
              style={[styles.title, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {title}
            </Text>
            {isPrivate ? (
              <Lock size={13} color={theme.colors.textFaint} />
            ) : null}
            {currentUserRole ? <RoleBadge role={currentUserRole} /> : null}
          </View>
          <View style={styles.metaRow}>
            <Users size={11} color={theme.colors.textFaint} />
            <Text style={[styles.meta, { color: theme.colors.textFaint }]}>
              {memberCount} {memberCount === 1 ? "miembro" : "miembros"}
            </Text>
            {conversation.is_default ? (
              <Text style={[styles.dot, { color: theme.colors.textFaint }]}>
                ·
              </Text>
            ) : null}
            {conversation.is_default ? (
              <Text style={[styles.meta, { color: theme.colors.secondary }]}>
                Lobby
              </Text>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.actions}>
        {onToggleMute ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={muted ? "Activar notificaciones" : "Silenciar"}
            onPress={onToggleMute}
            style={({ pressed }) => [
              styles.iconButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            {muted ? (
              <BellOff size={16} color={theme.colors.textMuted} />
            ) : (
              <Bell size={16} color={theme.colors.textMuted} />
            )}
          </Pressable>
        ) : null}
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
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Informacion del chat"
          onPress={onToggleInfo}
          style={({ pressed }) => [
            styles.iconButton,
            {
              borderColor: theme.colors.border,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <Info size={16} color={theme.colors.textMuted} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "900",
    flexShrink: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  meta: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  dot: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
