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
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

type AuthOrbitMascotProps = {
  size?: number;
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

const createSvgId = () => `authOrbit${Math.random().toString(36).slice(2, 10)}`;

export function AuthOrbitMascot({
  size = 240,
  animated = true,
  style,
}: AuthOrbitMascotProps) {
  const float = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const orbitSpin = useRef(new Animated.Value(0)).current;
  const reverseOrbitSpin = useRef(new Animated.Value(0)).current;
  const [blink, setBlink] = useState(false);
  const ids = useRef({
    body: `${createSvgId()}Body`,
    glow: `${createSvgId()}Glow`,
    ring: `${createSvgId()}Ring`,
  }).current;

  useEffect(() => {
    if (!animated) {
      return undefined;
    }

    const useNativeDriver = Platform.OS !== "web";
    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 4200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver,
        }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver,
        }),
      ]),
    );
    const orbitLoop = Animated.loop(
      Animated.timing(orbitSpin, {
        toValue: 1,
        duration: 10000,
        easing: Easing.linear,
        useNativeDriver,
      }),
    );
    const reverseOrbitLoop = Animated.loop(
      Animated.timing(reverseOrbitSpin, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver,
      }),
    );

    floatLoop.start();
    pulseLoop.start();
    orbitLoop.start();
    reverseOrbitLoop.start();

    return () => {
      floatLoop.stop();
      pulseLoop.stop();
      orbitLoop.stop();
      reverseOrbitLoop.stop();
    };
  }, [animated, float, orbitSpin, pulse, reverseOrbitSpin]);

  useEffect(() => {
    if (!animated) {
      return undefined;
    }

    let blinkTimeout: ReturnType<typeof setTimeout> | undefined;
    const interval = setInterval(() => {
      setBlink(true);
      blinkTimeout = setTimeout(() => setBlink(false), 130);
    }, 3600);

    return () => {
      clearInterval(interval);
      if (blinkTimeout) {
        clearTimeout(blinkTimeout);
      }
    };
  }, [animated]);

  const translateY = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: [0, -9] })
    : 0;
  const rotate = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] })
    : "0deg";
  const haloScale = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.08] })
    : 1;
  const haloOpacity = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.32, 0.58] })
    : 0.42;
  const pulseRingScale = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] })
    : 1;
  const pulseRingOpacity = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.38, 0.14] })
    : 0.28;
  const orbitScale = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.992, 1.026] })
    : 1;
  const orbitOpacity = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.76, 0.58] })
    : 0.66;
  const reverseOrbitScale = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [1.018, 0.992] })
    : 1;
  const reverseOrbitOpacity = animated
    ? pulse.interpolate({ inputRange: [0, 1], outputRange: [0.42, 0.28] })
    : 0.36;
  const orbitRotate = animated
    ? orbitSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "360deg"],
      })
    : "0deg";
  const reverseOrbitRotate = animated
    ? reverseOrbitSpin.interpolate({
        inputRange: [0, 1],
        outputRange: ["0deg", "-360deg"],
      })
    : "0deg";

  return (
    <View
      style={[styles.root, webNoSelect, { width: size, height: size }, style]}
    >
      <Animated.View
        style={[
          styles.halo,
          {
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: size * 0.41,
            opacity: haloOpacity,
            transform: [{ scale: haloScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.pulseRing,
          {
            width: size * 0.66,
            height: size * 0.66,
            borderRadius: size * 0.33,
            opacity: pulseRingOpacity,
            transform: [{ scale: pulseRingScale }],
          },
        ]}
      />
      <Animated.View
        style={[
          styles.stage,
          {
            width: size,
            height: size,
            transform: [{ translateY }, { rotate }],
          },
        ]}
      >
        <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
          <Defs>
            <RadialGradient id={ids.glow} cx="50%" cy="48%" r="52%">
              <Stop offset="0%" stopColor="#F0ABFC" stopOpacity="0.78" />
              <Stop offset="42%" stopColor="#D946EF" stopOpacity="0.4" />
              <Stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id={ids.body} cx="45%" cy="35%" r="70%">
              <Stop offset="0%" stopColor="#F0ABFC" />
              <Stop offset="42%" stopColor="#A855F7" />
              <Stop offset="72%" stopColor="#7B5CFF" />
              <Stop offset="100%" stopColor="#11142B" />
            </RadialGradient>
          </Defs>

          <Circle cx="120" cy="120" r="96" fill={`url(#${ids.glow})`} />
          <Circle cx="120" cy="120" r="68" fill={`url(#${ids.body})`} />
          <Circle
            cx="120"
            cy="120"
            r="70"
            stroke="#F0ABFC"
            strokeWidth="2"
            opacity="0.18"
          />

          <Circle cx="76" cy="75" r="4" fill="#D946EF" opacity="0.7" />
          <Circle cx="158" cy="72" r="3" fill="#8B5CF6" opacity="0.8" />
          <Circle cx="160" cy="160" r="2.5" fill="#22D3EE" opacity="0.72" />

          <G>
            <Circle cx="98" cy="112" r="11" fill="#22D3EE" />
            <Circle cx="142" cy="112" r="11" fill="#22D3EE" />
            <Ellipse
              cx="98"
              cy="112"
              rx="10"
              ry={blink ? "1.2" : "10"}
              fill="#22D3EE"
            />
            <Ellipse
              cx="142"
              cy="112"
              rx="10"
              ry={blink ? "1.2" : "10"}
              fill="#22D3EE"
            />
            <Circle cx="94" cy="108" r="3.5" fill="#FFFFFF" opacity="0.9" />
            <Circle cx="138" cy="108" r="3.5" fill="#FFFFFF" opacity="0.9" />
          </G>

          <Path
            d="M96 140C108 150 132 150 144 140"
            stroke="#090A12"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.68"
          />
        </Svg>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbitLayer,
            {
              opacity: orbitOpacity,
              transform: [{ rotate: orbitRotate }, { scale: orbitScale }],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
            <Defs>
              <LinearGradient id={ids.ring} x1="24" y1="72" x2="214" y2="158">
                <Stop stopColor="#7B5CFF" />
                <Stop offset="0.48" stopColor="#22D3EE" />
                <Stop offset="1" stopColor="#FF4FD8" />
              </LinearGradient>
            </Defs>
            <Ellipse
              cx="120"
              cy="120"
              rx="94"
              ry="34"
              stroke={`url(#${ids.ring})`}
              strokeWidth="3"
              transform="rotate(-18 120 120)"
            />
            <Circle cx="196" cy="116" r="7" fill="#22D3EE" opacity="0.98" />
            <Circle
              cx="196"
              cy="116"
              r="11"
              stroke="#22D3EE"
              strokeWidth="1.4"
              opacity="0.42"
            />
          </Svg>
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            styles.orbitLayer,
            {
              opacity: reverseOrbitOpacity,
              transform: [
                { rotate: reverseOrbitRotate },
                { scale: reverseOrbitScale },
              ],
            },
          ]}
        >
          <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
            <Ellipse
              cx="120"
              cy="120"
              rx="74"
              ry="26"
              stroke="#D946EF"
              strokeWidth="1.8"
              transform="rotate(74 120 120)"
            />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    backgroundColor: "rgba(139,92,246,0.24)",
    shadowColor: "#D946EF",
    shadowOpacity: 0.45,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 0 },
  },
  pulseRing: {
    position: "absolute",
    borderWidth: 2,
    borderColor: "rgba(217,70,239,0.42)",
    shadowColor: "#D946EF",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  orbitLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});

const webNoSelect =
  Platform.OS === "web"
    ? ({
        userSelect: "none",
        cursor: "default",
      } as unknown as ViewStyle)
    : undefined;
