import { memo, useEffect, useMemo, useRef, type ComponentProps } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../theme/useTheme";
import { NebulaBackdrop } from "./NebulaBackdrop";

type CosmicBackgroundProps = {
  /** Imagen de fondo. Por defecto la galaxia de marca. */
  source?: NonNullable<ComponentProps<typeof Image>["source"]>;
  /** Color del velo oscuro superpuesto para mantener legible el contenido. */
  dim?: string;
};

const DEFAULT_SOURCE = require("../../../assets/orbit-bg-galaxy.png");

type Star = {
  top: number;
  left: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
};

function useStars(count: number, seed = 1): Star[] {
  return useMemo(() => {
    let s = seed * 9301 + 49297;
    const rnd = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    return Array.from({ length: count }, () => ({
      top: rnd() * 100,
      left: rnd() * 100,
      size: rnd() > 0.6 ? 2 : 1,
      opacity: 0.35 + rnd() * 0.37,
      delay: rnd() * 2000,
      duration: 1600 + rnd() * 600,
    }));
  }, [count, seed]);
}

const AnimatedView = Animated.createAnimatedComponent(View);

function StarElement({ star, reducedMotion }: { star: Star; reducedMotion: boolean }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(pulse, {
          toValue: 1,
          duration: star.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: star.duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulse, star.delay, star.duration, reducedMotion]);

  const opacity = reducedMotion
    ? star.opacity
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.18, 1.0] });

  return (
    <AnimatedView
      style={[
        styles.star,
        {
          top: `${star.top}%`,
          left: `${star.left}%`,
          width: star.size,
          height: star.size,
          opacity,
        },
      ]}
    />
  );
}

export const CosmicBackground = memo(function CosmicBackground({
  source = DEFAULT_SOURCE,
  dim = "rgba(5,6,18,0.50)",
}: CosmicBackgroundProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const stars = useStars(16, 1);

  if (theme.mode !== "dark") {
    return null;
  }

  return (
    <NebulaBackdrop source={source} dim={dim}>
      {stars.map((star, index) => (
        <StarElement key={index} star={star} reducedMotion={reducedMotion} />
      ))}
    </NebulaBackdrop>
  );
});

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "white",
  },
});
