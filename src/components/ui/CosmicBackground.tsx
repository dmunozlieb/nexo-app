import { memo, useMemo } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useTheme } from "../../theme/useTheme";

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

function StarElement({ star, index }: { star: Star; index: number }) {
  const pulse = useMemo(() => new Animated.Value(0), []);

  useMemo(() => {
    Animated.loop(
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
    ).start();
  }, [pulse, star.delay, star.duration]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 1.0],
  });

  return (
    <AnimatedView
      key={index}
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

export const CosmicBackground = memo(function CosmicBackground() {
  const theme = useTheme();
  const stars = useStars(16, 1);

  if (theme.mode !== "dark") {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require("../../../assets/orbit-bg-galaxy.png")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />
      <View style={[StyleSheet.absoluteFill, styles.dim]} />
      {stars.map((star, index) => (
        <StarElement key={index} star={star} index={index} />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  dim: {
    backgroundColor: "rgba(5,6,18,0.50)",
  },
  star: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "white",
  },
});
