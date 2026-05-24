import { Pressable, StyleSheet, Text } from "react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type TagPillProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export function TagPill({ label, selected = false, onPress }: TagPillProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pill,
        {
          backgroundColor: selected ? theme.colors.primary : theme.colors.surface,
          borderColor: selected ? theme.colors.secondary : theme.colors.border,
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? "#FFFFFF" : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    minHeight: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
