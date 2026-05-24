import type { PropsWithChildren } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type GradientCardProps = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
}>;

export function GradientCard({ children, style, contentStyle }: GradientCardProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        style,
      ]}
    >
      <LinearGradient
        colors={[
          `${theme.colors.primary}24`,
          `${theme.colors.secondary}12`,
          `${theme.colors.accent}1C`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.glow}
      />
      <View style={[styles.content, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  glow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  content: {
    gap: 12,
    padding: 14,
  },
});
