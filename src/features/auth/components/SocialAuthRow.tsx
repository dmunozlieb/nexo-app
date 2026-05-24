import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

type Provider = "google" | "apple";

const providers: ReadonlyArray<{
  id: Provider;
  label: string;
  letter: string;
  ring: string;
}> = [
  { id: "google", label: "Google", letter: "G", ring: "#4285F4" },
  { id: "apple", label: "Apple", letter: "A", ring: "#FFFFFF" },
];

type SocialAuthRowProps = {
  onProvider?: (provider: Provider) => void;
  dividerLabel?: string;
};

export function SocialAuthRow({
  onProvider,
  dividerLabel = "o continua con email",
}: SocialAuthRowProps) {
  const theme = useTheme();

  function handlePress(provider: Provider) {
    if (onProvider) {
      onProvider(provider);
      return;
    }
    if (Platform.OS === "web") {
      // eslint-disable-next-line no-console
      console.warn(`Social auth (${provider}) - proximamente`);
      return;
    }
    Alert.alert("Proximamente", `Acceso con ${provider} aun no disponible.`);
  }

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {providers.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Continuar con ${p.label}`}
            onPress={() => handlePress(p.id)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: pressed
                  ? `${theme.colors.secondary}66`
                  : "rgba(255,255,255,0.1)",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.letterBadge, { borderColor: p.ring }]}>
              <Text style={[styles.letterText, { color: p.ring }]}>
                {p.letter}
              </Text>
            </View>
            <Text
              style={[styles.buttonText, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.divider}>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: "rgba(255,255,255,0.08)" },
          ]}
        />
        <Text
          style={[styles.dividerText, { color: theme.colors.textFaint }]}
        >
          {dividerLabel}
        </Text>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: "rgba(255,255,255,0.08)" },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
  },
  letterBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontSize: 12,
    fontWeight: "900",
  },
  buttonText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
});
