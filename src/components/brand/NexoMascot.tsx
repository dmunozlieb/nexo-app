import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

type NexoMascotProps = {
  size?: number;
  animated?: boolean;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

const createSvgId = () => `nexo${Math.random().toString(36).slice(2, 10)}`;

export function NexoMascot({
  size = 156,
  animated = true,
  interactive = false,
  style,
}: NexoMascotProps) {
  const float = useRef(new Animated.Value(0)).current;
  const ids = useRef({ body: createSvgId(), eye: createSvgId() }).current;
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!animated) {
      return undefined;
    }

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();

    return () => floating.stop();
  }, [animated, float]);

  useEffect(() => {
    if (!animated) {
      return undefined;
    }

    let blinkTimeout: ReturnType<typeof setTimeout> | undefined;

    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 130);
    }, 3200);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) clearTimeout(blinkTimeout);
    };
  }, [animated]);

  const translateY = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] })
    : 0;
  const rotate = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] })
    : "0deg";

  return (
    <View
      pointerEvents={interactive ? "auto" : "none"}
      style={[styles.root, webNoSelect, { width: size, height: size }, style]}
    >
      {/* Antenna glow blobs (behind SVG) */}
      <View
        pointerEvents="none"
        style={[
          styles.antennaGlow,
          {
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: size * 0.1,
            top: size * 0.02,
            left: size * 0.2,
            backgroundColor: "#FF4FD8",
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.antennaGlow,
          {
            width: size * 0.2,
            height: size * 0.2,
            borderRadius: size * 0.1,
            top: size * 0.02,
            right: size * 0.2,
            backgroundColor: "#18D7FF",
          },
        ]}
      />

      <Animated.View
        style={[
          styles.mascot,
          { transform: [{ translateY }, { rotate }] },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
          <Defs>
            <RadialGradient id={ids.body} cx="50%" cy="40%" r="60%">
              <Stop offset="0%" stopColor="#B18CFF" />
              <Stop offset="60%" stopColor="#7B5CFF" />
              <Stop offset="100%" stopColor="#3A1F8F" />
            </RadialGradient>
            <RadialGradient id={ids.eye} cx="40%" cy="40%" r="60%">
              <Stop offset="0%" stopColor="#A8F3FF" />
              <Stop offset="100%" stopColor="#18D7FF" />
            </RadialGradient>
          </Defs>

          {/* halo difuso */}
          <Circle cx="32" cy="34" r="22" fill="#7B5CFF" opacity="0.22" />

          {/* antenas */}
          <Line
            x1="22"
            y1="14"
            x2="18"
            y2="4"
            stroke="#B18CFF"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <Line
            x1="42"
            y1="14"
            x2="46"
            y2="4"
            stroke="#B18CFF"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          {/* glow suave de bolas de antena */}
          <Circle cx="18" cy="4" r="4" fill="#FF4FD8" opacity="0.32" />
          <Circle cx="46" cy="4" r="4" fill="#18D7FF" opacity="0.32" />
          {/* bolas de antena */}
          <Circle cx="18" cy="4" r="2.6" fill="#FF4FD8" />
          <Circle cx="46" cy="4" r="2.6" fill="#18D7FF" />

          {/* cabeza */}
          <Ellipse
            cx="32"
            cy="30"
            rx="20"
            ry="18"
            fill={`url(#${ids.body})`}
          />

          {/* ojos */}
          <Ellipse
            cx="25"
            cy="30"
            rx="4.4"
            ry={isBlinking ? 1 : 5}
            fill={`url(#${ids.eye})`}
          />
          <Ellipse
            cx="39"
            cy="30"
            rx="4.4"
            ry={isBlinking ? 1 : 5}
            fill={`url(#${ids.eye})`}
          />
          {/* highlights */}
          <Circle cx="26.5" cy="28" r="1.2" fill="#FFFFFF" opacity="0.88" />
          <Circle cx="40.5" cy="28" r="1.2" fill="#FFFFFF" opacity="0.88" />

          {/* boquita */}
          <Path
            d="M28 38 Q32 41 36 38"
            stroke="#2A1062"
            strokeWidth="1.4"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  mascot: {
    alignItems: "center",
    justifyContent: "center",
  },
  antennaGlow: {
    position: "absolute",
    opacity: 0.42,
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.6,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
});

const webNoSelect =
  Platform.OS === "web"
    ? ({
        userSelect: "none",
        cursor: "default",
      } as unknown as ViewStyle)
    : undefined;
