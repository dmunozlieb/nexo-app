import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.state}>
      {icon}
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      {message ? (
        <Text style={[styles.message, { color: theme.colors.textMuted }]}>
          {message}
        </Text>
      ) : null}
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 24,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "800",
    textAlign: "center",
  },
  message: {
    fontSize: typography.body,
    textAlign: "center",
    lineHeight: 21,
  },
});
