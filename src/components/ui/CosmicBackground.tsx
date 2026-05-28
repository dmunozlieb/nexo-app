import { createElement, memo, useMemo, type CSSProperties } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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

// En web replicamos el fondo de Figma con radial-gradient + blur real (suave).
// En nativo no hay blur barato, asi que usamos circulos de baja opacidad.
function WebNebulas() {
  if (Platform.OS !== "web") {
    return null;
  }

  return createElement(
    "div",
    { style: webCosmic.root },
    createElement("div", { style: webCosmic.base }),
    createElement("div", { style: webCosmic.nebulaViolet }),
    createElement("div", { style: webCosmic.nebulaCyan }),
    createElement("div", { style: webCosmic.nebulaMagenta }),
  );
}

export const CosmicBackground = memo(function CosmicBackground() {
  const theme = useTheme();
  const isDarkMode = theme.mode === "dark";
  const stars = useStars(16, 1);
  const isWeb = Platform.OS === "web";

  if (!isDarkMode) {
    return null;
  }

  return (
    <View style={styles.container} pointerEvents="none">
      {isWeb ? (
        <WebNebulas />
      ) : (
        <>
          <LinearGradient
            colors={["#070622", "#090A1F", "#050611"]}
            locations={[0, 0.55, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.gradient}
          />

          {/* Nebulosa violeta - top-left */}
          <View style={[styles.nebula, styles.nebulaViolet]} />
          {/* Nebulosa cyan - bottom-right */}
          <View style={[styles.nebula, styles.nebulaCyan]} />
          {/* Nebulosa magenta - bottom-center */}
          <View style={[styles.nebula, styles.nebulaMagenta]} />
        </>
      )}

      {/* Estrellas (ambas plataformas) */}
      {stars.map((star, index) => (
        <StarElement key={index} star={star} index={index} />
      ))}
    </View>
  );
});

const webCosmic: Record<string, CSSProperties> = {
  root: {
    position: "absolute",
    inset: 0,
    overflow: "hidden",
    pointerEvents: "none",
  },
  base: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, #070622 0%, #090A1F 55%, #050611 100%)",
  },
  nebulaViolet: {
    position: "absolute",
    top: -220,
    left: -170,
    width: 540,
    height: 540,
    borderRadius: 9999,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(123,92,255,0.5), rgba(123,92,255,0) 70%)",
  },
  nebulaCyan: {
    position: "absolute",
    right: -180,
    bottom: -100,
    width: 560,
    height: 560,
    borderRadius: 9999,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(24,215,255,0.32), rgba(24,215,255,0) 70%)",
  },
  nebulaMagenta: {
    position: "absolute",
    bottom: -180,
    left: "33%",
    width: 480,
    height: 480,
    borderRadius: 9999,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(255,79,216,0.3), rgba(255,79,216,0) 70%)",
  },
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: "hidden",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  nebula: {
    position: "absolute",
    borderRadius: 9999,
  },
  nebulaViolet: {
    width: 540,
    height: 540,
    top: -220,
    left: -170,
    backgroundColor: "rgba(123,92,255,0.12)",
  },
  nebulaCyan: {
    width: 560,
    height: 560,
    right: -180,
    bottom: -100,
    backgroundColor: "rgba(24,215,255,0.07)",
  },
  nebulaMagenta: {
    width: 480,
    height: 480,
    bottom: -180,
    left: "33%",
    backgroundColor: "rgba(255,79,216,0.07)",
  },
  star: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "white",
  },
});
