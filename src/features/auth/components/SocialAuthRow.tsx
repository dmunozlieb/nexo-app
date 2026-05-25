import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

export type SocialAuthProvider = "google";

const providers: ReadonlyArray<{
  id: SocialAuthProvider;
  label: string;
  letter: string;
  ring: string;
}> = [
  { id: "google", label: "Google", letter: "G", ring: "#4285F4" },
];

type SocialAuthRowProps = {
  onProvider?: (provider: SocialAuthProvider) => void;
  dividerLabel?: string;
  loadingProvider?: SocialAuthProvider | null | undefined;
};

export function SocialAuthRow({
  onProvider,
  dividerLabel = "o continua con email",
  loadingProvider,
}: SocialAuthRowProps) {
  const theme = useTheme();

  function handlePress(provider: SocialAuthProvider) {
    if (onProvider) {
      onProvider(provider);
    }
  }

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {providers.map((p) => (
          <Pressable
            key={p.id}
            accessibilityRole="button"
            accessibilityLabel={`Continuar con ${p.label}`}
            disabled={Boolean(loadingProvider)}
            onPress={() => handlePress(p.id)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: theme.colors.elevated,
                borderColor: pressed
                  ? `${theme.colors.secondary}66`
                  : "rgba(255,255,255,0.1)",
                opacity: loadingProvider ? 0.58 : pressed ? 0.85 : 1,
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
              {loadingProvider === p.id ? "Conectando..." : p.label}
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
