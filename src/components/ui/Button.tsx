import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type PressableProps,
  type ViewStyle,
} from "react-native";
import { hitSlop, radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  loading,
  disabled,
  style,
  ...props
}: ButtonProps) {
  const theme = useTheme();
  const colors = theme.colors;

  const background =
    variant === "primary"
      ? colors.primary
      : variant === "secondary"
        ? colors.elevated
        : variant === "danger"
          ? colors.error
          : "transparent";
  const color = variant === "secondary" || variant === "ghost" ? colors.text : "#FFFFFF";
  const borderColor =
    variant === "ghost"
      ? "transparent"
      : variant === "secondary"
        ? colors.border
        : background;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      hitSlop={hitSlop}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          backgroundColor: background,
          borderColor,
          opacity: disabled ? 0.48 : pressed ? 0.82 : 1,
        },
        style,
      ]}
      {...props}
    >
      {loading ? <ActivityIndicator color={color} /> : icon}
      <Text style={[styles.text, { color }]} numberOfLines={1}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: 12,
  },
  md: {
    paddingHorizontal: 16,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: 20,
  },
  text: {
    fontSize: typography.body,
    fontWeight: "800",
  },
});
