import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { REACTION_TYPES } from "../../constants/post";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { ReactionType } from "../../types/domain";
import { formatCompactNumber } from "../../utils/format";

type ReactionBarProps = {
  counts: Record<ReactionType, number>;
  active: ReactionType[];
  onToggle: (reaction: ReactionType) => void;
};

export function ReactionBar({ counts, active, onToggle }: ReactionBarProps) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {REACTION_TYPES.map((reaction) => {
        const selected = active.includes(reaction.value);
        return (
          <Pressable
            key={reaction.value}
            accessibilityRole="button"
            accessibilityLabel={reaction.label}
            accessibilityState={{ selected }}
            onPress={() => onToggle(reaction.value)}
            style={({ pressed }) => [
              styles.item,
              {
                backgroundColor: selected ? `${reaction.color}24` : theme.colors.surface,
                borderColor: selected ? reaction.color : theme.colors.border,
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                {
                  backgroundColor: reaction.color,
                  opacity: selected ? 1 : 0.45,
                },
              ]}
            />
            <Text
              style={[
                styles.label,
                { color: selected ? reaction.color : theme.colors.textMuted },
              ]}
            >
              {reaction.shortLabel}
            </Text>
            <Text style={[styles.count, { color: theme.colors.textFaint }]}>
              {formatCompactNumber(counts[reaction.value] ?? 0)}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 8,
  },
  item: {
    minHeight: 38,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  count: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
