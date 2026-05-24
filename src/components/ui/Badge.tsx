import { StyleSheet, Text, View } from "react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type BadgeProps = {
  label: string;
  tone?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
};

export function Badge({ label, tone = "neutral" }: BadgeProps) {
  const theme = useTheme();
  const color =
    tone === "primary"
      ? theme.colors.primary
      : tone === "secondary"
        ? theme.colors.secondary
        : tone === "success"
          ? theme.colors.success
          : tone === "warning"
            ? theme.colors.warning
            : tone === "danger"
              ? theme.colors.error
              : theme.colors.textMuted;

  return (
    <View
      style={[
        styles.badge,
        {
          borderColor: color,
          backgroundColor: `${color}22`,
        },
      ]}
    >
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    borderWidth: 0,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
});
