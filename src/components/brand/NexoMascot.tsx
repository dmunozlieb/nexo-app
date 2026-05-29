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
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

export type MascotMood =
  | "calm"
  | "delighted"
  | "chatty"
  | "focused"
  | "curious"
  | "dizzy"
  | "friendly";

export type MascotAccessory =
  | "pencil"
  | "sparkle"
  | "walkie"
  | "magnifier"
  | "crew"
  | "glitch";

type NexoMascotProps = {
  size?: number;
  animated?: boolean;
  interactive?: boolean;
  mood?: MascotMood | undefined;
  accessory?: MascotAccessory | undefined;
  accent?: string | undefined;
  droopAntenna?: boolean | undefined;
  style?: StyleProp<ViewStyle>;
};

const ANTENNA_MAGENTA = "#FF4FD8";
const ANTENNA_CYAN = "#18D7FF";
const MOUTH = "#2A1062";

const createSvgId = () => `nexo${Math.random().toString(36).slice(2, 10)}`;

// Expresion por mood. Devuelve nodos SVG (ojos + boca). eyeFill es el gradiente.
function MoodFace({ mood, eyeFill }: { mood: MascotMood; eyeFill: string }) {
  switch (mood) {
    case "delighted":
      return (
        <>
          <Path d="M21.5 31 Q25 27.5 28.5 31" stroke={eyeFill} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Path d="M35.5 31 Q39 27.5 42.5 31" stroke={eyeFill} strokeWidth="2.4" strokeLinecap="round" fill="none" />
          <Path d="M27 37.5 Q32 43.5 37 37.5" stroke={MOUTH} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      );
    case "chatty":
      return (
        <>
          <Ellipse cx="25" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Ellipse cx="39" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Circle cx="26.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
          <Circle cx="40.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
          <Ellipse cx="32" cy="39" rx="2.4" ry="2.8" fill={MOUTH} />
        </>
      );
    case "focused":
      return (
        <>
          <Ellipse cx="25" cy="30" rx="4.2" ry="4.8" fill={eyeFill} />
          <Ellipse cx="39" cy="30" rx="4.2" ry="4.8" fill={eyeFill} />
          <Circle cx="26.4" cy="28.2" r="1.1" fill="#FFFFFF" opacity={0.88} />
          <Circle cx="40.4" cy="28.2" r="1.1" fill="#FFFFFF" opacity={0.88} />
          <Path d="M29.5 39 Q32 40.2 34.5 39" stroke={MOUTH} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      );
    case "curious":
      return (
        <>
          <Ellipse cx="25" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Ellipse cx="39" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Circle cx="27" cy="30" r="1.7" fill={MOUTH} />
          <Circle cx="41" cy="30" r="1.7" fill={MOUTH} />
          <Path d="M28.5 38.5 Q32 40.8 35.5 38.5" stroke={MOUTH} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      );
    case "dizzy":
      return (
        <>
          <Line x1="22.5" y1="27.5" x2="27.5" y2="32.5" stroke={eyeFill} strokeWidth="2" strokeLinecap="round" />
          <Line x1="27.5" y1="27.5" x2="22.5" y2="32.5" stroke={eyeFill} strokeWidth="2" strokeLinecap="round" />
          <Line x1="36.5" y1="27.5" x2="41.5" y2="32.5" stroke={eyeFill} strokeWidth="2" strokeLinecap="round" />
          <Line x1="41.5" y1="27.5" x2="36.5" y2="32.5" stroke={eyeFill} strokeWidth="2" strokeLinecap="round" />
          <Path d="M28 39 Q30 37 32 39 Q34 41 36 39" stroke={MOUTH} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      );
    case "friendly":
      return (
        <>
          <Ellipse cx="25" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Ellipse cx="39" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Circle cx="26.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
          <Circle cx="40.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
          <Path d="M27 37 Q32 43 37 37" stroke={MOUTH} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </>
      );
    case "calm":
    default:
      return (
        <>
          <Ellipse cx="25" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Ellipse cx="39" cy="30" rx="4.4" ry="5" fill={eyeFill} />
          <Circle cx="26.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
          <Circle cx="40.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
          <Path d="M28 38 Q32 41 36 38" stroke={MOUTH} strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </>
      );
  }
}

// Accesorio geometrico por seccion (coords del viewBox 64).
function Accessory({
  accessory,
  accent,
}: {
  accessory: MascotAccessory;
  accent: string;
}) {
  switch (accessory) {
    case "pencil":
      return (
        <G transform="rotate(38 50 40)">
          <Rect x="46.5" y="36.5" width="3.2" height="13" rx="1" fill="#FFD15C" />
          <Rect x="46.5" y="36.5" width="3.2" height="3.4" fill={ANTENNA_MAGENTA} />
          <Path d="M46.5 49.5 L49.7 49.5 L48.1 53 Z" fill={MOUTH} />
        </G>
      );
    case "sparkle":
      return (
        <G fill={accent}>
          <Path d="M48 16 l1.1 2.6 2.6 1.1 -2.6 1.1 -1.1 2.6 -1.1 -2.6 -2.6 -1.1 2.6 -1.1 Z" />
          <Path d="M15 24 l0.8 1.9 1.9 0.8 -1.9 0.8 -0.8 1.9 -0.8 -1.9 -1.9 -0.8 1.9 -0.8 Z" opacity={0.85} />
          <Circle cx="51" cy="33" r="1.1" />
        </G>
      );
    case "walkie":
      return (
        <G transform="rotate(-14 17 40)">
          <Rect x="12.5" y="37" width="8" height="12" rx="2" fill="#222A52" stroke={ANTENNA_CYAN} strokeWidth="0.9" />
          <Rect x="14.5" y="39.5" width="4" height="3" rx="0.8" fill={ANTENNA_CYAN} opacity={0.85} />
          <Circle cx="16.5" cy="46" r="1.1" fill={ANTENNA_CYAN} />
          <Line x1="14.5" y1="37" x2="13" y2="31" stroke={ANTENNA_CYAN} strokeWidth="1.1" strokeLinecap="round" />
          <Circle cx="13" cy="31" r="1.2" fill={ANTENNA_MAGENTA} />
        </G>
      );
    case "magnifier":
      return (
        <G transform="rotate(8 49 44)">
          <Circle cx="48" cy="42" r="5" fill="none" stroke={accent} strokeWidth="1.8" />
          <Circle cx="48" cy="42" r="5" fill={accent} opacity={0.14} />
          <Line x1="51.8" y1="45.8" x2="55.5" y2="49.5" stroke={accent} strokeWidth="2" strokeLinecap="round" />
        </G>
      );
    case "crew":
      return (
        <G>
          <G opacity={0.7}>
            <Circle cx="13" cy="42" r="3.4" fill={accent} opacity={0.6} />
            <Line x1="11.4" y1="39.2" x2="10.6" y2="37" stroke={accent} strokeWidth="0.8" strokeLinecap="round" />
            <Line x1="14.6" y1="39.2" x2="15.4" y2="37" stroke={accent} strokeWidth="0.8" strokeLinecap="round" />
          </G>
          <G opacity={0.45}>
            <Circle cx="52" cy="46" r="2.6" fill={accent} opacity={0.5} />
            <Line x1="50.8" y1="43.8" x2="50.2" y2="42" stroke={accent} strokeWidth="0.7" strokeLinecap="round" />
            <Line x1="53.2" y1="43.8" x2="53.8" y2="42" stroke={accent} strokeWidth="0.7" strokeLinecap="round" />
          </G>
        </G>
      );
    case "glitch":
      return (
        <G stroke={accent} strokeWidth="1.6" strokeLinecap="round" opacity={0.9}>
          <Path d="M50 24 l3 1 -2 2 3 1" fill="none" />
          <Line x1="13" y1="30" x2="17" y2="30" />
          <Line x1="12" y1="34" x2="15" y2="34" opacity={0.6} />
        </G>
      );
    default:
      return null;
  }
}

export function NexoMascot({
  size = 156,
  animated = true,
  interactive = false,
  mood,
  accessory,
  accent = ANTENNA_CYAN,
  droopAntenna = false,
  style,
}: NexoMascotProps) {
  const float = useRef(new Animated.Value(0)).current;
  const ids = useRef({ body: createSvgId(), eye: createSvgId() }).current;
  const [isBlinking, setIsBlinking] = useState(false);
  // Solo parpadea en el rostro "calm" por defecto (sin mood explicito).
  const blinks = animated && !mood;

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
    if (!blinks) {
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
  }, [blinks]);

  const translateY = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: [0, -6] })
    : 0;
  const rotate = animated
    ? float.interpolate({ inputRange: [0, 1], outputRange: ["-1deg", "1deg"] })
    : "0deg";

  const leftAntennaX = droopAntenna ? 16 : 18;
  const leftAntennaY = droopAntenna ? 8 : 4;
  const rightAntennaX = droopAntenna ? 48 : 46;
  const rightAntennaY = droopAntenna ? 9 : 4;

  const eyeFill = `url(#${ids.eye})`;
  let face: ReactNode;
  if (mood) {
    face = <MoodFace mood={mood} eyeFill={eyeFill} />;
  } else {
    face = (
      <>
        <Ellipse cx="25" cy="30" rx="4.4" ry={isBlinking ? 1 : 5} fill={eyeFill} />
        <Ellipse cx="39" cy="30" rx="4.4" ry={isBlinking ? 1 : 5} fill={eyeFill} />
        <Circle cx="26.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
        <Circle cx="40.5" cy="28" r="1.2" fill="#FFFFFF" opacity={0.88} />
        <Path d="M28 38 Q32 41 36 38" stroke={MOUTH} strokeWidth="1.4" strokeLinecap="round" fill="none" />
      </>
    );
  }

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
            backgroundColor: ANTENNA_MAGENTA,
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
            backgroundColor: ANTENNA_CYAN,
          },
        ]}
      />

      <Animated.View
        style={[styles.mascot, { transform: [{ translateY }, { rotate }] }]}
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
          <Circle cx="32" cy="34" r="22" fill="#7B5CFF" opacity={0.22} />

          {/* antenas */}
          <Line x1="22" y1="14" x2={leftAntennaX} y2={leftAntennaY} stroke="#B18CFF" strokeWidth="1.4" strokeLinecap="round" />
          <Line x1="42" y1="14" x2={rightAntennaX} y2={rightAntennaY} stroke="#B18CFF" strokeWidth="1.4" strokeLinecap="round" />
          <Circle cx={leftAntennaX} cy={leftAntennaY} r="4" fill={ANTENNA_MAGENTA} opacity={0.32} />
          <Circle cx={rightAntennaX} cy={rightAntennaY} r="4" fill={ANTENNA_CYAN} opacity={0.32} />
          <Circle cx={leftAntennaX} cy={leftAntennaY} r="2.6" fill={ANTENNA_MAGENTA} />
          <Circle cx={rightAntennaX} cy={rightAntennaY} r="2.6" fill={ANTENNA_CYAN} />

          {/* cabeza */}
          <Ellipse cx="32" cy="30" rx="20" ry="18" fill={`url(#${ids.body})`} />

          {/* cara */}
          {face}

          {/* accesorio */}
          {accessory ? <Accessory accessory={accessory} accent={accent} /> : null}
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
