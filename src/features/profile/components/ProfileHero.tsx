import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "../../../components/ui/Avatar";
import { AnimatedGradient } from "../../../components/ui/AnimatedGradient";
import { radius, typography } from "../../../theme/tokens";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useTheme } from "../../../theme/useTheme";
import type { AccentPair } from "../utils/profile-accent";

const BANNER_HEIGHT = 240;
const AVATAR_SIZE = 96;
const CARD_BG = "#0F1330";

// Cabecera "hero" del perfil: banner grande a sangre con el avatar (aro girando)
// + nombre + handle CENTRADOS dentro del propio banner. Un velo inferior mantiene
// el texto legible y funde el banner hacia el color de la card. Sin banner, se usa
// el gradiente de acento. Reutilizada por ProfileScreen y la preview del editor.
export function ProfileHero({
  avatarUrl,
  displayName,
  username,
  bannerUrl,
  accent,
  online = false,
}: {
  avatarUrl: string | null;
  displayName: string;
  username: string;
  bannerUrl: string | null;
  accent: AccentPair;
  online?: boolean;
}) {
  const theme = useTheme();
  const reduced = useReducedMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduced) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduced]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={styles.banner}>
      {bannerUrl ? (
        <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <AnimatedGradient
          style={StyleSheet.absoluteFill}
          colors={[accent[0], accent[1], "#22D3FF", accent[0]]}
        />
      )}

      {/* Velo: arriba transparente (banner vivo), oscurece tras el texto y funde a la card. */}
      <LinearGradient
        colors={["transparent", "rgba(6,7,18,0.18)", "rgba(6,7,18,0.55)", CARD_BG]}
        locations={[0, 0.32, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View style={styles.overlay}>
        <View style={styles.avatarWrap}>
          <View style={styles.ring}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                { borderRadius: radius.pill, overflow: "hidden", transform: reduced ? [] : [{ rotate }] },
              ]}
            >
              <LinearGradient
                colors={accent as unknown as readonly [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
            <View style={[styles.ringInner, { backgroundColor: theme.colors.background }]}>
              <Avatar uri={avatarUrl} label={displayName || username} size={AVATAR_SIZE} />
            </View>
          </View>
          {online ? (
            <View
              style={[
                styles.onlineDot,
                { backgroundColor: theme.colors.success, borderColor: theme.colors.background },
              ]}
            />
          ) : null}
        </View>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {displayName || "Tu nombre"}
        </Text>
        <Text style={[styles.handle, { color: accent[0] }]} numberOfLines={1}>
          @{username || "username"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: BANNER_HEIGHT,
    width: "100%",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  avatarWrap: {
    position: "relative",
  },
  ring: {
    width: AVATAR_SIZE + 6,
    height: AVATAR_SIZE + 6,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  ringInner: {
    borderRadius: radius.pill,
    padding: 2,
  },
  onlineDot: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  name: {
    fontSize: typography.h1,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 12,
    textAlign: "center",
    // Sombra para que resalte sobre cualquier banner (claro u oscuro).
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 12,
  },
  handle: {
    fontSize: typography.body,
    fontWeight: "800",
    marginTop: 2,
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
});
