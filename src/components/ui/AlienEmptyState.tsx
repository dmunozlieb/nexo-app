import { useEffect, useRef, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import {
  NexoMascot,
  type MascotAccessory,
  type MascotMood,
} from "../brand/NexoMascot";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

type EmptyCta = {
  label: string;
  onPress: () => void;
  icon?: ReactNode;
};

type EmptySecondary = {
  label: string;
  onPress: () => void;
};

type AlienEmptyStateProps = {
  title: string;
  message: string;
  eyebrow?: string | undefined;
  /** Color de acento de la seccion. Por defecto el cian (secondary). */
  accent?: string | undefined;
  mood?: MascotMood | undefined;
  accessory?: MascotAccessory | undefined;
  droop?: boolean | undefined;
  cta?: EmptyCta | undefined;
  secondary?: EmptySecondary | undefined;
  /** Slot libre (retrocompatibilidad). Se usa si no se pasa `cta`. */
  action?: ReactNode;
};

function isLightAccent(hex: string) {
  const h = hex.replace("#", "");
  if (h.length < 6) {
    return false;
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

function lighten(hex: string, amount: number) {
  const h = hex.replace("#", "");
  const r = Math.min(255, parseInt(h.slice(0, 2), 16) + amount);
  const g = Math.min(255, parseInt(h.slice(2, 4), 16) + amount);
  const b = Math.min(255, parseInt(h.slice(4, 6), 16) + amount);
  return `rgb(${r},${g},${b})`;
}

export function AlienEmptyState({
  title,
  message,
  eyebrow,
  accent,
  mood = "calm",
  accessory,
  droop,
  cta,
  secondary,
  action,
}: AlienEmptyStateProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const { width } = useWindowDimensions();
  const accentColor = accent ?? theme.colors.secondary;
  // Mascota y escena mas grandes en pantallas anchas; el bloque se centra en
  // mas alto para repartir mejor el espacio vertical.
  const mascotSize = width >= 1100 ? 168 : width >= 768 ? 152 : 132;
  const stageW = Math.round(mascotSize * 2.5);
  const stageH = Math.round(mascotSize * 1.9);
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) {
      return undefined;
    }

    // Halo externo: rotacion continua. Glow: pulso de luz suave.
    const spinLoop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 24000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    spinLoop.start();
    pulseLoop.start();

    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [spin, pulse, reducedMotion]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const glowOpacity = reducedMotion
    ? 1
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [0.82, 1] });
  const glowScale = reducedMotion
    ? 1
    : pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });

  const starlight = theme.colors.emptyStarlight;

  return (
    <View style={styles.root}>
      <View style={[styles.stage, { width: stageW, height: stageH }]}>
        {/* Glow aurora (radial) — desprende luz con un pulso suave */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { opacity: glowOpacity, transform: [{ scale: glowScale }] },
          ]}
        >
          <Svg width={stageW} height={stageH}>
            <Defs>
              <RadialGradient id="emptyGlow" cx="50%" cy="46%" r="58%">
                <Stop offset="0%" stopColor={accentColor} stopOpacity={0.72} />
                <Stop offset="30%" stopColor={accentColor} stopOpacity={0.34} />
                <Stop offset="58%" stopColor={theme.colors.emptyNebulaEdge} stopOpacity={0.4} />
                <Stop offset="78%" stopColor={theme.colors.emptyNebulaEdge} stopOpacity={0} />
              </RadialGradient>
            </Defs>
            <Rect width={stageW} height={stageH} fill="url(#emptyGlow)" />
          </Svg>
        </Animated.View>

        {/* Estrellas estaticas */}
        <Svg
          width={stageW}
          height={stageH}
          viewBox="0 0 200 152"
          style={StyleSheet.absoluteFill}
        >
          <Circle cx="22" cy="34" r="1.6" fill={starlight} />
          <Circle cx="176" cy="44" r="1.4" fill={starlight} />
          <Circle cx="158" cy="112" r="1.2" fill={starlight} />
          <Circle cx="34" cy="120" r="1.3" fill={starlight} />
          <Circle cx="150" cy="22" r="1" fill={accentColor} />
        </Svg>

        {/* Halo medio: estatico y perpendicular */}
        <Svg
          width={stageW}
          height={stageH}
          viewBox="0 0 200 152"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <G transform="rotate(72 100 74)">
            <Ellipse cx="100" cy="74" rx="60" ry="20" fill="none" stroke={accentColor} strokeOpacity={0.1} strokeWidth="3.5" />
            <Ellipse cx="100" cy="74" rx="60" ry="20" fill="none" stroke={accentColor} strokeOpacity={0.34} strokeWidth="1" />
          </G>
        </Svg>

        {/* Halo externo: en movimiento */}
        <Animated.View
          style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}
          pointerEvents="none"
        >
          <Svg width={stageW} height={stageH} viewBox="0 0 200 152">
            <Ellipse cx="100" cy="74" rx="84" ry="30" fill="none" stroke={accentColor} strokeOpacity={0.1} strokeWidth="3.5" />
            <Ellipse cx="100" cy="74" rx="84" ry="30" fill="none" stroke={accentColor} strokeOpacity={0.44} strokeWidth="1" />
          </Svg>
        </Animated.View>

        {/* Mascota */}
        <View style={styles.mascotWrap}>
          <NexoMascot
            size={mascotSize}
            mood={mood}
            accessory={accessory}
            accent={accentColor}
            droopAntenna={droop}
            animated={!reducedMotion}
          />
        </View>
      </View>

      {eyebrow ? (
        <Text style={[styles.eyebrow, { color: accentColor }]}>{eyebrow}</Text>
      ) : null}
      <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: theme.colors.textMuted }]}>{message}</Text>

      {cta || action || secondary ? (
        <View style={styles.actions}>
          {cta ? (
            <CtaButton accent={accentColor} cta={cta} />
          ) : action ? (
            action
          ) : null}
          {secondary ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={secondary.label}
              onPress={secondary.onPress}
              style={({ pressed }) => [styles.secondary, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[styles.secondaryText, { color: theme.colors.textFaint }]}>
                {secondary.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function CtaButton({ accent, cta }: { accent: string; cta: EmptyCta }) {
  const dark = isLightAccent(accent);
  const textColor = dark ? "#15102E" : "#FFFFFF";
  const icon =
    cta.icon === undefined ? <Plus size={18} color={textColor} /> : cta.icon;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={cta.label}
      onPress={cta.onPress}
      style={({ pressed }) => [styles.cta, { opacity: pressed ? 0.9 : 1 }]}
    >
      <LinearGradient
        colors={[lighten(accent, 26), accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.ctaInner}>
        {icon}
        <Text style={[styles.ctaText, { color: textColor }]}>{cta.label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
    gap: 6,
  },
  stage: {
    alignItems: "center",
    justifyContent: "center",
  },
  mascotWrap: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    marginTop: 6,
    fontSize: typography.tiny,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  title: {
    maxWidth: 400,
    fontSize: typography.h2,
    fontWeight: "900",
    textAlign: "center",
  },
  message: {
    maxWidth: 360,
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
  },
  actions: {
    marginTop: 12,
    alignItems: "center",
    gap: 10,
  },
  cta: {
    minHeight: 44,
    borderRadius: radius.pill,
    paddingHorizontal: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ctaText: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  secondary: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  secondaryText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
