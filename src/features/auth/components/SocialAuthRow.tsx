import { useEffect, useRef, useState } from "react";
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
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (hoverDelayRef.current) {
        clearTimeout(hoverDelayRef.current);
      }
    };
  }, []);

  function handlePress(provider: SocialAuthProvider) {
    if (onProvider) {
      onProvider(provider);
    }
  }

  function handleHoverIn(provider: SocialAuthProvider) {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current);
    }

    hoverDelayRef.current = setTimeout(() => {
      setHoveredProvider(provider);
    }, 70);
  }

  function handleHoverOut(provider: SocialAuthProvider) {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current);
      hoverDelayRef.current = null;
    }

    setHoveredProvider((current) => (current === provider ? null : current));
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
            onHoverIn={() => handleHoverIn(p.id)}
            onHoverOut={() => handleHoverOut(p.id)}
            onPress={() => handlePress(p.id)}
            style={({ pressed }) => [
              styles.button,
              webButton,
              {
                backgroundColor:
                  hoveredProvider === p.id
                    ? "rgba(255,255,255,0.075)"
                    : "rgba(255,255,255,0.035)",
                borderColor: pressed
                  ? "rgba(255,255,255,0.28)"
                  : hoveredProvider === p.id
                    ? `${theme.colors.secondary}88`
                    : "rgba(255,255,255,0.14)",
                shadowColor:
                  hoveredProvider === p.id ? theme.colors.secondary : "#000000",
                shadowOpacity: hoveredProvider === p.id ? 0.22 : 0,
                opacity: loadingProvider ? 0.58 : pressed ? 0.85 : 1,
                transform: [{ translateY: hoveredProvider === p.id ? -1 : 0 }],
              },
            ]}
          >
            <View
              style={[
                styles.letterBadge,
                webNoSelectView,
                { borderColor: p.ring },
              ]}
            >
              <Text style={[styles.letterText, webNoSelect, { color: p.ring }]}>
                {p.letter}
              </Text>
            </View>
            <Text
              style={[styles.buttonText, webNoSelect, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {loadingProvider === p.id
                ? "Conectando..."
                : `Continuar con ${p.label}`}
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
    borderWidth: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  letterText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 18,
    fontWeight: "600",
    letterSpacing: 0,
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

const webButton =
  Platform.OS === "web"
    ? ({
        cursor: "default",
        userSelect: "none",
      } as unknown as ViewStyle)
    : null;

const webNoSelect =
  Platform.OS === "web"
    ? ({
        cursor: "default",
        userSelect: "none",
      } as unknown as TextStyle)
    : null;

const webNoSelectView =
  Platform.OS === "web"
    ? ({
        cursor: "default",
        userSelect: "none",
      } as unknown as ViewStyle)
    : null;
