import { AlertCircle } from "lucide-react-native";
import { StyleSheet, Text, View } from "react-native";
import { typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { Button } from "./Button";

type ErrorStateProps = {
  title?: string;
  message?: string;
  retryLabel?: string;
  onRetry?: () => void;
};

export function ErrorState({
  title = "Algo no salio bien",
  message = "Revisa tu conexion e intentalo de nuevo.",
  retryLabel = "Reintentar",
  onRetry,
}: ErrorStateProps) {
  const theme = useTheme();

  return (
    <View style={styles.state}>
      <AlertCircle color={theme.colors.error} size={32} />
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>
        {message}
      </Text>
      {onRetry ? <Button title={retryLabel} onPress={onRetry} /> : null}
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
