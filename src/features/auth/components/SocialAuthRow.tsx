import { useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { fontFamilies, radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

export type SocialAuthProvider = "google";

const providers: ReadonlyArray<{
  id: SocialAuthProvider;
  label: string;
  letter: string;
  ring: string;
}> = [{ id: "google", label: "Google", letter: "G", ring: "#EA4335" }];

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
  const [hoveredProvider, setHoveredProvider] =
    useState<SocialAuthProvider | null>(null);

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        {providers.map((p) => {
          const hovered = hoveredProvider === p.id;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="button"
              accessibilityLabel={`Continuar con ${p.label}`}
              disabled={Boolean(loadingProvider)}
              onHoverIn={() => setHoveredProvider(p.id)}
              onHoverOut={() =>
                setHoveredProvider((current) =>
                  current === p.id ? null : current,
                )
              }
              onPress={() => onProvider?.(p.id)}
              style={({ pressed }) => [
                styles.button,
                webNoSelect,
                {
                  backgroundColor: hovered
                    ? "rgba(255,255,255,0.075)"
                    : "rgba(255,255,255,0.035)",
                  borderColor: pressed
                    ? "rgba(255,255,255,0.28)"
                    : hovered
                      ? `${theme.colors.secondary}88`
                      : "rgba(255,255,255,0.14)",
                  shadowColor: hovered ? theme.colors.secondary : "#000000",
                  shadowOpacity: hovered ? 0.22 : 0,
                  opacity: loadingProvider ? 0.58 : pressed ? 0.85 : 1,
                  transform: [{ translateY: hovered ? -1 : 0 }],
                },
              ]}
            >
              <View
                style={[
                  styles.letterBadge,
                  webNoSelect,
                  { borderColor: p.ring },
                ]}
              >
                <Text style={[styles.letterText, webNoSelect, { color: p.ring }]}>
                  {p.letter}
                </Text>
              </View>
              <Text
                style={[
                  styles.buttonText,
                  webNoSelect,
                  { color: theme.colors.text },
                ]}
                numberOfLines={1}
              >
                {loadingProvider === p.id
                  ? "Conectando..."
                  : `Continuar con ${p.label}`}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.divider}>
        <View
          style={[
            styles.dividerLine,
            { backgroundColor: "rgba(255,255,255,0.08)" },
          ]}
        />
        <Text style={[styles.dividerText, { color: theme.colors.textFaint }]}>
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

const webNoSelect =
  Platform.OS === "web"
    ? ({
        cursor: "default",
        userSelect: "none",
      } as unknown as ViewStyle & TextStyle)
    : null;

const styles = StyleSheet.create({
  root: {
    gap: 10,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 10,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  letterBadge: {
    width: 24,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 18,
    fontWeight: "600",
  },
  buttonText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 14,
    fontWeight: "600",
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
    fontFamily: fontFamilies.interMedium,
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
