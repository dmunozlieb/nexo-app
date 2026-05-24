import { useEffect, useRef, useState, type ReactNode } from "react";
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
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

type NexoMascotProps = {
  size?: number;
  animated?: boolean;
  accessory?: ReactNode;
  interactive?: boolean;
  style?: StyleProp<ViewStyle>;
};

const createSvgId = () => `nexoAlien${Math.random().toString(36).slice(2, 10)}`;

export function NexoMascot({
  size = 156,
  animated = true,
  accessory,
  interactive = false,
  style,
}: NexoMascotProps) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const ids = useRef({
    aura: `${createSvgId()}Aura`,
    head: `${createSvgId()}Head`,
    orbit: `${createSvgId()}Orbit`,
  }).current;
  const [isBlinking, setIsBlinking] = useState(false);

  useEffect(() => {
    if (!animated) {
      return undefined;
    }

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1250,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );

    floating.start();
    pulsing.start();
    return () => {
      floating.stop();
      pulsing.stop();
    };
  }, [animated, float, pulse]);

  useEffect(() => {
    if (!animated) {
      return undefined;
    }

    let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setIsBlinking(true);
      blinkTimeout = setTimeout(() => setIsBlinking(false), 135);
    }, 3200);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) {
        clearTimeout(blinkTimeout);
      }
    };
  }, [animated]);

  const translateY = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: [0, -7] })
    : 0;
  const rotate = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: ["-1.2deg", "1.2deg"] })
    : "0deg";
  const breathe = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] })
    : 1;
  const pulseOpacity = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.76] })
    : 0.46;
  const pulseScale = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.28] })
    : 1;

  return (
    <View
      pointerEvents={interactive ? "auto" : "none"}
      style={[styles.root, webNoSelect, { width: size, height: size }, style]}
    >
      <Animated.View
        style={[
          styles.mascot,
          {
            transform: [{ translateY }, { rotate }, { scale: breathe }],
          },
        ]}
      >
        <Animated.View
          style={[
            styles.antennaPulse,
            {
              width: size * 0.15,
              height: size * 0.15,
              borderRadius: size * 0.075,
              top: size * 0.105,
              left: size * 0.425,
              opacity: pulseOpacity,
              transform: [{ scale: pulseScale }],
            },
          ]}
        />
        <Svg width={size} height={size} viewBox="0 0 180 180" fill="none">
          <Circle cx="90" cy="94" r="68" fill={`url(#${ids.aura})`} opacity="0.88" />
          <Ellipse
            cx="90"
            cy="99"
            rx="72"
            ry="36"
            transform="rotate(-16 90 99)"
            stroke={`url(#${ids.orbit})`}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="142 50"
            opacity="0.8"
          />
          <Ellipse cx="90" cy="147" rx="38" ry="9" fill="#050711" opacity="0.42" />

          <Path
            d="M90 48C58 48 38 70 38 99C38 132 61 153 90 153C119 153 142 132 142 99C142 70 122 48 90 48Z"
            fill={`url(#${ids.head})`}
          />
          <Path
            d="M90 48C58 48 38 70 38 99C38 132 61 153 90 153C119 153 142 132 142 99C142 70 122 48 90 48Z"
            stroke="#DAD3FF"
            strokeWidth="4"
            opacity="0.35"
          />

          <Path
            d="M90 50V30"
            stroke="#8B74FF"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <Circle cx="90" cy="27" r="9" fill="#00D4FF" />
          <Circle cx="90" cy="27" r="4" fill="#F4F7FB" opacity="0.92" />

          <Ellipse
            cx="67"
            cy="95"
            rx="10"
            ry={isBlinking ? "1.4" : "14"}
            fill="#090A12"
          />
          <Ellipse
            cx="113"
            cy="95"
            rx="10"
            ry={isBlinking ? "1.4" : "14"}
            fill="#090A12"
          />
          <Circle cx="70" cy="89" r="3" fill="#FFFFFF" opacity="0.88" />
          <Circle cx="116" cy="89" r="3" fill="#FFFFFF" opacity="0.88" />

          <Path
            d="M82 119C86 123 94 123 98 119"
            stroke="#090A12"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <Circle cx="55" cy="115" r="6" fill="#FF4FD8" opacity="0.24" />
          <Circle cx="125" cy="115" r="6" fill="#00D4FF" opacity="0.24" />

          <Path
            d="M58 135C48 131 42 123 38 114"
            stroke="#7C5CFF"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.92"
          />
          <Path
            d="M122 135C132 131 138 123 142 114"
            stroke="#00D4FF"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.92"
          />
          <Circle cx="30" cy="101" r="5" fill="#7C5CFF" />
          <Circle cx="151" cy="82" r="5" fill="#FF4FD8" />

          <Defs>
            <LinearGradient id={ids.aura} x1="26" y1="30" x2="150" y2="160">
              <Stop stopColor="#11142B" />
              <Stop offset="0.55" stopColor="#1B1E35" />
              <Stop offset="1" stopColor="#090A12" />
            </LinearGradient>
            <LinearGradient id={ids.head} x1="47" y1="48" x2="136" y2="150">
              <Stop stopColor="#CABDFF" />
              <Stop offset="0.4" stopColor="#8F74FF" />
              <Stop offset="0.76" stopColor="#7C5CFF" />
              <Stop offset="1" stopColor="#00D4FF" />
            </LinearGradient>
            <LinearGradient id={ids.orbit} x1="18" y1="62" x2="164" y2="136">
              <Stop stopColor="#7C5CFF" />
              <Stop offset="0.52" stopColor="#00D4FF" />
              <Stop offset="1" stopColor="#FF4FD8" />
            </LinearGradient>
          </Defs>
        </Svg>
      </Animated.View>
      {accessory ? <View style={styles.accessory}>{accessory}</View> : null}
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
  antennaPulse: {
    position: "absolute",
    backgroundColor: "#00D4FF",
    shadowColor: "#00D4FF",
    shadowOpacity: 0.72,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  accessory: {
    position: "absolute",
    right: 4,
    bottom: 8,
  },
});

const webNoSelect =
  Platform.OS === "web"
    ? ({
        userSelect: "none",
        cursor: "default",
      } as unknown as ViewStyle)
    : undefined;
