import type { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type PressableProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { hitSlop, radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { hoverTransition } from "../../utils/web-style";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = Omit<PressableProps, "style"> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  iconRight?: ReactNode;
  loading?: boolean;
  gradient?: readonly [string, string] | undefined;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
};

export function Button({
  title,
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  gradient,
  disabled,
  style,
  textStyle,
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
  const color =
    variant === "secondary" || variant === "ghost" ? colors.text : "#FFFFFF";
  const borderColor =
    variant === "ghost"
      ? "transparent"
      : variant === "secondary"
        ? colors.border
        : background;

  const hasGradient = Boolean(gradient);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={props.accessibilityLabel ?? title}
      hitSlop={hitSlop}
      disabled={disabled || loading}
      style={({ pressed, hovered }) => [
        styles.base,
        styles[size],
        hoverTransition,
        hasGradient ? styles.clipped : null,
        {
          backgroundColor: hasGradient ? "transparent" : background,
          borderColor,
          opacity: disabled ? 0.48 : pressed ? 0.82 : 1,
          transform: [{ translateY: pressed ? 1 : hovered && !disabled ? -1 : 0 }],
        },
        style,
      ]}
      {...props}
    >
      {hasGradient && gradient ? (
        <LinearGradient
          colors={gradient as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={color} />
      ) : icon ? (
        // Envuelto en View: en react-native-web el degradado (position:absolute)
        // tapa los SVG estaticos; un View (position:relative) los deja por encima.
        <View>{icon}</View>
      ) : null}
      <Text style={[styles.text, { color }, textStyle]} numberOfLines={1}>
        {title}
      </Text>
      {iconRight && !loading ? <View>{iconRight}</View> : null}
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
  clipped: {
    overflow: "hidden",
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
