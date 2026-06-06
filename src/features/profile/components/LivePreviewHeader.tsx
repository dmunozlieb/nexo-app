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

export function LivePreviewHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  accent,
}: {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  accent: AccentPair;
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
        duration: 5200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduced]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.card, { borderColor: theme.colors.border }]}>
      <View style={styles.banner}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <AnimatedGradient style={StyleSheet.absoluteFill} colors={[accent[0], accent[1], "#22D3FF", accent[0]]} />
        )}
      </View>
      <View style={styles.body}>
        <View style={styles.avatarRing}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { transform: reduced ? [] : [{ rotate }] }]}
          >
            <LinearGradient
              colors={accent as unknown as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
            />
          </Animated.View>
          <View style={[styles.avatarInner, { backgroundColor: theme.colors.background }]}>
            <Avatar uri={avatarUrl} label={displayName || username} size={54} />
          </View>
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
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F1330",
  },
  banner: {
    height: 84,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
    padding: 3,
  },
  avatarInner: {
    borderRadius: radius.pill,
    padding: 2,
  },
  name: {
    fontSize: typography.h3,
    fontWeight: "900",
    marginTop: 10,
  },
  handle: {
    fontSize: typography.small,
    fontWeight: "700",
    marginTop: 2,
  },
});
