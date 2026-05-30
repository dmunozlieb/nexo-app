import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { hoverTransition } from "../../../utils/web-style";
import { categoryIcon } from "../categoryMeta";

type CategoryChipsProps = {
  categories: string[];
  selected?: string | undefined;
  onSelect: (category?: string) => void;
};

export function CategoryChips({ categories, selected, onSelect }: CategoryChipsProps) {
  const { width } = useWindowDimensions();
  const compact = width < 720;
  const content = (
    <>
      <Chip label="Todas" selected={!selected} onPress={() => onSelect(undefined)} />
      {categories.map((category) => (
        <Chip
          key={category}
          label={category}
          selected={selected === category}
          onPress={() => onSelect(category)}
        />
      ))}
    </>
  );

  if (compact) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {content}
      </ScrollView>
    );
  }

  return <View style={styles.wrap}>{content}</View>;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const Icon = categoryIcon(label);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed, hovered }) => [
        styles.chip,
        hoverTransition,
        {
          borderColor: selected
            ? theme.colors.secondary
            : hovered
              ? theme.colors.secondary
              : theme.colors.border,
          backgroundColor: selected ? "transparent" : theme.colors.surface,
          opacity: pressed ? 0.78 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {selected ? (
        <LinearGradient
          colors={[theme.colors.primary, `${theme.colors.secondary}99`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Icon size={14} color="#FFFFFF" />
      <Text style={[styles.text, { color: "#FFFFFF" }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingRight: 14,
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    minHeight: 38,
    borderRadius: radius.pill,
    borderWidth: 1,
    overflow: "hidden",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  text: {
    fontSize: typography.small,
    fontWeight: "900",
  },
});
