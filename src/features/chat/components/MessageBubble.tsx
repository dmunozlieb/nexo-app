import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Flag, Pin, PinOff, Smile } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "../../../components/ui/Avatar";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ChatRole, Message, Profile } from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";
import { RoleBadge } from "./RoleBadge";

export type MessageBubbleProps = {
  message: Message & { sender?: Profile | null };
  own: boolean;
  senderRole?: ChatRole | null | undefined;
  isPinned?: boolean | undefined;
  canModerate?: boolean | undefined;
  onReport?: (() => void) | undefined;
  onPin?: (() => void) | undefined;
  onUnpin?: (() => void) | undefined;
  onReact?: (() => void) | undefined;
};

export function MessageBubble({
  message,
  own,
  senderRole,
  isPinned,
  canModerate,
  onReport,
  onPin,
  onUnpin,
  onReact,
}: MessageBubbleProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const name =
    message.sender?.display_name ?? message.sender?.username ?? "Usuario";

  const accentColor =
    senderRole === "admin"
      ? "#FFC450"
      : senderRole === "co_admin"
        ? theme.colors.secondary
        : own
          ? theme.colors.primary
          : "transparent";

  const showRoleBadge =
    !own && (senderRole === "admin" || senderRole === "co_admin");

  return (
    <View
      style={[
        styles.row,
        own ? styles.rowOwn : null,
        isPinned ? styles.rowPinned : null,
      ]}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {!own ? (
        <View style={styles.avatarWrap}>
          <Avatar
            uri={message.sender?.avatar_url}
            label={name}
            size={32}
          />
          {senderRole === "admin" || senderRole === "co_admin" ? (
            <View
              style={[
                styles.avatarRoleDot,
                { backgroundColor: accentColor },
              ]}
            />
          ) : null}
        </View>
      ) : null}

      <View style={[styles.column, own ? styles.columnOwn : null]}>
        {!own ? (
          <View style={styles.senderRow}>
            <Text
              style={[styles.senderName, { color: accentColor === "transparent" ? theme.colors.textMuted : accentColor }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {showRoleBadge ? <RoleBadge role={senderRole!} /> : null}
            <Text style={[styles.timestamp, { color: theme.colors.textFaint }]}>
              {formatRelativeDate(message.created_at)}
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.bubbleWrap,
            own ? styles.bubbleWrapOwn : null,
          ]}
        >
          {own ? (
            <LinearGradient
              colors={[theme.colors.primary, `${theme.colors.primary}DD`]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.bubble, styles.bubbleOwn]}
            >
              <Text style={[styles.body, styles.bodyOwn]}>{message.body}</Text>
              <Text style={[styles.timestampInline, styles.timestampOwn]}>
                {formatRelativeDate(message.created_at)}
              </Text>
            </LinearGradient>
          ) : (
            <View
              style={[
                styles.bubble,
                {
                  backgroundColor: "rgba(24,32,68,0.75)",
                  borderColor:
                    accentColor === "transparent"
                      ? "rgba(255,255,255,0.08)"
                      : `${accentColor}66`,
                  borderLeftWidth: showRoleBadge ? 3 : 1,
                  borderLeftColor: showRoleBadge
                    ? accentColor
                    : "rgba(255,255,255,0.08)",
                },
              ]}
            >
              <Text style={[styles.body, { color: theme.colors.text }]}>
                {message.body}
              </Text>
            </View>
          )}

          {hovered ? (
            <View
              style={[
                styles.actions,
                own ? styles.actionsOwn : styles.actionsOther,
                { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
              ]}
            >
              {onReact ? (
                <ActionButton onPress={onReact} accessibilityLabel="Reaccionar">
                  <Smile size={14} color={theme.colors.textMuted} />
                </ActionButton>
              ) : null}
              {canModerate && !isPinned && onPin ? (
                <ActionButton onPress={onPin} accessibilityLabel="Fijar mensaje">
                  <Pin size={14} color={theme.colors.textMuted} />
                </ActionButton>
              ) : null}
              {canModerate && isPinned && onUnpin ? (
                <ActionButton onPress={onUnpin} accessibilityLabel="Desfijar mensaje">
                  <PinOff size={14} color={theme.colors.textMuted} />
                </ActionButton>
              ) : null}
              {!own && onReport ? (
                <ActionButton onPress={onReport} accessibilityLabel="Reportar mensaje">
                  <Flag size={14} color={theme.colors.textMuted} />
                </ActionButton>
              ) : null}
            </View>
          ) : null}
        </View>

        {isPinned ? (
          <View style={styles.pinnedRow}>
            <Pin size={11} color={theme.colors.textFaint} />
            <Text style={[styles.pinnedText, { color: theme.colors.textFaint }]}>
              Fijado en el chat
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function ActionButton({
  onPress,
  accessibilityLabel,
  children,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  children: React.ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.actionButton,
        {
          backgroundColor: hovered ? "rgba(255,255,255,0.06)" : "transparent",
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  rowOwn: {
    justifyContent: "flex-end",
  },
  rowPinned: {
    backgroundColor: "rgba(123,92,255,0.06)",
    borderRadius: radius.md,
  },
  avatarWrap: {
    position: "relative",
    paddingTop: 22,
  },
  avatarRoleDot: {
    position: "absolute",
    right: -2,
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#070B1A",
  },
  column: {
    flex: 1,
    minWidth: 0,
    maxWidth: "84%",
    gap: 4,
  },
  columnOwn: {
    alignItems: "flex-end",
  },
  senderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  senderName: {
    fontSize: typography.small,
    fontWeight: "800",
    maxWidth: 140,
  },
  timestamp: {
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  bubbleWrap: {
    position: "relative",
    alignSelf: "flex-start",
    maxWidth: "100%",
  },
  bubbleWrapOwn: {
    alignSelf: "flex-end",
  },
  bubble: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: 13,
    paddingVertical: 10,
    overflow: "hidden",
  },
  bubbleOwn: {
    borderColor: "transparent",
  },
  body: {
    fontSize: typography.body,
    lineHeight: 21,
    fontWeight: "500",
  },
  bodyOwn: {
    color: "#FFFFFF",
  },
  timestampInline: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 4,
  },
  timestampOwn: {
    color: "rgba(255,255,255,0.7)",
    alignSelf: "flex-end",
  },
  actions: {
    position: "absolute",
    top: -16,
    flexDirection: "row",
    gap: 2,
    padding: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  actionsOwn: {
    right: 8,
  },
  actionsOther: {
    left: 8,
  },
  actionButton: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  pinnedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
  },
  pinnedText: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
