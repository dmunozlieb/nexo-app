import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronDown, ChevronUp, Pin } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { MessageWithMeta } from "../../../types/domain";

type PinnedBarProps = {
  pinned: MessageWithMeta[];
  canModerate?: boolean;
  onUnpin?: (messageId: string) => void;
};

export function PinnedBar({ pinned, canModerate, onUnpin }: PinnedBarProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);

  if (pinned.length === 0) {
    return null;
  }

  const visible = expanded ? pinned : pinned.slice(0, 1);

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: theme.colors.border,
          backgroundColor: "rgba(123,92,255,0.08)",
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pin size={13} color={theme.colors.secondary} />
          <Text style={[styles.headerText, { color: theme.colors.text }]}>
            {pinned.length === 1
              ? "1 mensaje fijado"
              : `${pinned.length} mensajes fijados`}
          </Text>
        </View>
        {pinned.length > 1 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={expanded ? "Colapsar fijados" : "Expandir fijados"}
            onPress={() => setExpanded((v) => !v)}
            style={({ pressed }) => [
              styles.toggle,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            {expanded ? (
              <ChevronUp size={14} color={theme.colors.textMuted} />
            ) : (
              <ChevronDown size={14} color={theme.colors.textMuted} />
            )}
          </Pressable>
        ) : null}
      </View>
      <View style={styles.list}>
        {visible.map((message) => {
          const senderName =
            message.sender?.display_name ??
            message.sender?.username ??
            "Usuario";
          return (
            <View
              key={message.id}
              style={[
                styles.item,
                { borderColor: "rgba(255,255,255,0.08)" },
              ]}
            >
              <View style={styles.itemCopy}>
                <Text
                  style={[styles.itemSender, { color: theme.colors.secondary }]}
                  numberOfLines={1}
                >
                  {senderName}
                </Text>
                <Text
                  style={[styles.itemBody, { color: theme.colors.text }]}
                  numberOfLines={2}
                >
                  {message.body}
                </Text>
              </View>
              {canModerate && onUnpin ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Desfijar"
                  onPress={() => onUnpin(message.id)}
                  style={({ pressed }) => [
                    styles.itemAction,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Text
                    style={[styles.itemActionText, { color: theme.colors.textMuted }]}
                  >
                    Desfijar
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderBottomWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  headerText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  toggle: {
    padding: 4,
  },
  list: {
    gap: 6,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 8,
  },
  itemCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  itemSender: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  itemBody: {
    fontSize: typography.small,
    fontWeight: "500",
  },
  itemAction: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itemActionText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
});
