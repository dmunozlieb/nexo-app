import { useRef } from "react";
import {
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  Heart,
  Sparkles,
  Telescope,
  ThumbsUp,
  type LucideIcon,
} from "lucide-react-native";
import { REACTION_TYPES } from "../../constants/post";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { ReactionType } from "../../types/domain";
import { formatCompactNumber } from "../../utils/format";

type ReactionBarProps = {
  counts: Record<ReactionType, number>;
  active: ReactionType[];
  onToggle: (reaction: ReactionType) => void;
};

const REACTION_ICONS: Record<ReactionType, LucideIcon> = {
  inspire: Sparkles,
  relate: Heart,
  curious: Telescope,
  support: ThumbsUp,
};

export function ReactionBar({ counts, active, onToggle }: ReactionBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {REACTION_TYPES.map((reaction) => (
        <ReactionPill
          key={reaction.value}
          value={reaction.value}
          label={reaction.label}
          color={reaction.color}
          count={counts[reaction.value] ?? 0}
          selected={active.includes(reaction.value)}
          onToggle={onToggle}
        />
      ))}
    </ScrollView>
  );
}

type ReactionPillProps = {
  value: ReactionType;
  label: string;
  color: string;
  count: number;
  selected: boolean;
  onToggle: (reaction: ReactionType) => void;
};

function ReactionPill({
  value,
  label,
  color,
  count,
  selected,
  onToggle,
}: ReactionPillProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const Icon = REACTION_ICONS[value];

  function handlePress() {
    onToggle(value);

    if (reducedMotion) {
      return;
    }

    scale.stopAnimation();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 1.35,
        duration: 110,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 4,
        tension: 140,
        useNativeDriver: true,
      }),
    ]).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: selected ? `${color}24` : theme.colors.surface,
          borderColor: selected ? color : theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Icon
          size={16}
          color={selected ? color : theme.colors.textMuted}
          fill={selected ? color : "transparent"}
        />
      </Animated.View>
      {count > 0 ? (
        <Text
          style={[
            styles.count,
            { color: selected ? color : theme.colors.textFaint },
          ]}
        >
          {formatCompactNumber(count)}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 8,
  },
  item: {
    minHeight: 38,
    minWidth: 44,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  count: {
    fontSize: typography.small,
    fontWeight: "800",
  },
});
