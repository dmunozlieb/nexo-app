import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ReactionSummary } from "../utils/reactions";

type ReactionPillsProps = {
  reactions: ReactionSummary[];
  onToggle: (emoji: string, reactedByMe: boolean) => void;
  align?: "flex-start" | "flex-end";
};

export function ReactionPills({
  reactions,
  onToggle,
  align = "flex-start",
}: ReactionPillsProps) {
  const theme = useTheme();
  if (reactions.length === 0) return null;

  return (
    <View style={[styles.row, { justifyContent: align }]}>
      {reactions.map((reaction) => (
        <Pressable
          key={reaction.emoji}
          accessibilityRole="button"
          accessibilityLabel={`${reaction.emoji} ${reaction.count}`}
          onPress={() => onToggle(reaction.emoji, reaction.reacted_by_me)}
          style={({ pressed }) => [
            styles.pill,
            {
              borderColor: reaction.reacted_by_me
                ? theme.colors.primary
                : theme.colors.border,
              backgroundColor: reaction.reacted_by_me
                ? `${theme.colors.primary}24`
                : "rgba(255,255,255,0.04)",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={styles.emoji}>{reaction.emoji}</Text>
          <Text style={[styles.count, { color: theme.colors.textMuted }]}>
            {reaction.count}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  emoji: { fontSize: 13 },
  count: { fontSize: typography.tiny, fontWeight: "800" },
});
