import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type LoadingStateProps = {
  label?: string;
};

export function LoadingState({ label = "Cargando..." }: LoadingStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.state}>
      <ActivityIndicator color={theme.colors.secondary} />
      <Text style={[styles.text, { color: theme.colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  state: {
    flex: 1,
    minHeight: 160,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  text: {
    fontSize: typography.body,
  },
});
