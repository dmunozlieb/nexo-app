import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { NexoMascot } from "../brand/NexoMascot";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type AlienEmptyStateProps = {
  title: string;
  message: string;
  action?: ReactNode;
};

export function AlienEmptyState({ title, message, action }: AlienEmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <LinearGradient
        colors={[`${theme.colors.primary}22`, `${theme.colors.secondary}12`, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.stars} pointerEvents="none">
        <View style={[styles.star, styles.starOne]} />
        <View style={[styles.star, styles.starTwo]} />
        <View style={[styles.star, styles.starThree]} />
      </View>
      <NexoMascot size={104} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    minHeight: 270,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  stars: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  star: {
    position: "absolute",
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.58)",
  },
  starOne: {
    top: "18%",
    left: "18%",
  },
  starTwo: {
    top: "26%",
    right: "22%",
  },
  starThree: {
    bottom: "20%",
    left: "28%",
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    maxWidth: 360,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
});
