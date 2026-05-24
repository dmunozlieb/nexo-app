import { useEffect, useRef, useState, type PropsWithChildren } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Orbit, ShieldCheck, Sparkles } from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { NexoMark } from "../../../components/ui/NexoMark";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

type AuthScaffoldProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  eyebrow?: string | undefined;
  storyTitle?: string | undefined;
  storyCopy?: string | undefined;
  panelVariant?: "docked" | "compact" | undefined;
  mobileMascot?: "hero" | "inline" | undefined;
}>;

const particles = [
  { top: "10%", left: "16%", size: 2, opacity: 0.42 },
  { top: "18%", left: "76%", size: 3, opacity: 0.5 },
  { top: "37%", left: "9%", size: 2, opacity: 0.34 },
  { top: "56%", left: "84%", size: 2, opacity: 0.38 },
  { top: "74%", left: "21%", size: 3, opacity: 0.46 },
  { top: "86%", left: "68%", size: 2, opacity: 0.36 },
] as const;

const storyStats = [
  {
    kicker: "Ecos hoy",
    value: "12.4k",
    label: "Reacciones con intencion",
    Icon: Sparkles,
    tone: "accent" as const,
  },
  {
    kicker: "Orbitas",
    value: "+248",
    label: "Comunidades activas",
    Icon: Orbit,
    tone: "secondary" as const,
  },
  {
    kicker: "Moderacion",
    value: "<24h",
    label: "Reportes resueltos",
    Icon: ShieldCheck,
    tone: "success" as const,
  },
] as const;

export function AuthScaffold({
  title,
  subtitle,
  eyebrow,
  storyTitle = "Vuelve a tu orbita",
  storyCopy = "Entra a tus Orbitas, retoma conversaciones y descubre senales nuevas sin perder el hilo.",
  panelVariant = "docked",
  mobileMascot = "hero",
  children,
}: AuthScaffoldProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const mascotFloat = useRef(new Animated.Value(0)).current;
  const particlePulse = useRef(new Animated.Value(0)).current;
  const m = getAuthMetrics(width, height, panelVariant);
  const {
    isDesktop,
    isDockedDesktop,
    isShortDesktop,
    isShort,
    isVeryShort,
    isNarrow,
    compactDesktopPanel,
    dockedDesktopPanel,
    desktopInsetX,
    desktopInsetY,
    mobileMascotSize,
    desktopMascotSize,
    headerGap,
    formGap,
    cardMaxWidth,
    cardPadding,
    cardGap,
  } = m;
  const mascotTranslateY = mascotFloat.interpolate({
    inputRange: [0, 1],
    outputRange: [0, isDesktop ? -8 : -5],
  });
  const particleOpacity = particlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.68],
  });

  useEffect(() => {
    if (reduceMotion) {
      mascotFloat.setValue(0);
      particlePulse.setValue(0);
      return;
    }

    const floating = Animated.loop(
      Animated.sequence([
        Animated.timing(mascotFloat, {
          toValue: 1,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(mascotFloat, {
          toValue: 0,
          duration: 5200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    const pulsing = Animated.loop(
      Animated.sequence([
        Animated.timing(particlePulse, {
          toValue: 1,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(particlePulse, {
          toValue: 0,
          duration: 3400,
          easing: Easing.inOut(Easing.sin),
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
  }, [mascotFloat, particlePulse, reduceMotion]);

  return (
    <ScreenContainer
      scroll={!isDockedDesktop}
      contentStyle={[
        styles.screen,
        isDockedDesktop ? styles.screenDocked : null,
        {
          maxWidth: "100%",
          justifyContent: isShort && !isDesktop ? "flex-start" : "center",
          paddingVertical: isDockedDesktop
            ? desktopInsetY
            : isDesktop
              ? 18
              : isShort
                ? 14
                : 22,
          paddingHorizontal: isDockedDesktop
            ? desktopInsetX
            : isNarrow
              ? 14
              : 18,
          paddingBottom: isDockedDesktop ? desktopInsetY : undefined,
        },
      ]}
    >
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View
          style={[
            styles.glowLarge,
            {
              backgroundColor: `${theme.colors.primary}24`,
              width: isDesktop ? 420 : 260,
              height: isDesktop ? 420 : 260,
              borderRadius: isDesktop ? 210 : 130,
            },
          ]}
        />
        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: `${theme.colors.accent}20`,
              width: isDesktop ? 260 : 170,
              height: isDesktop ? 260 : 170,
              borderRadius: isDesktop ? 130 : 85,
            },
          ]}
        />
        <View
          style={[
            styles.glowCyan,
            {
              backgroundColor: `${theme.colors.secondary}14`,
              width: isDesktop ? 360 : 220,
              height: isDesktop ? 360 : 220,
              borderRadius: isDesktop ? 180 : 110,
            },
          ]}
        />
        <View
          style={[
            styles.glowPanel,
            {
              backgroundColor: `${theme.colors.primary}12`,
              width: isDesktop ? 430 : 260,
              height: isDesktop ? 430 : 260,
              borderRadius: isDesktop ? 215 : 130,
            },
          ]}
        />
        <View style={styles.grainVeil} />
        <View
          style={[
            styles.orbitStroke,
            { borderColor: `${theme.colors.secondary}3D` },
            isDesktop ? styles.orbitStrokeDesktop : null,
          ]}
        />
        <View
          style={[
            styles.orbitStrokeAlt,
            { borderColor: `${theme.colors.accent}35` },
            isDesktop ? styles.orbitStrokeAltDesktop : null,
          ]}
        />
        {particles.map((particle) => (
          <Animated.View
            key={`${particle.top}-${particle.left}`}
            style={[
              styles.particle,
              {
                top: particle.top,
                left: particle.left,
                width: particle.size,
                height: particle.size,
                borderRadius: particle.size / 2,
                opacity: reduceMotion ? particle.opacity : particleOpacity,
              },
            ]}
          />
        ))}
      </View>

      <View
        style={[
          styles.layout,
          isDesktop ? styles.layoutDesktop : styles.layoutMobile,
        ]}
      >
        {isDesktop ? (
          <View pointerEvents="none" style={[styles.storyPanel, webNoSelect]}>
            <View style={styles.storyBrand}>
              <View style={styles.storyLogo}>
                <NexoMark size={58} />
              </View>
              <View style={styles.storyBrandCopy}>
                <Text
                  style={[
                    styles.storyKicker,
                    { color: theme.colors.secondary },
                  ]}
                >
                  Nexo
                </Text>
                <Text
                  style={[
                    styles.storyTitle,
                    isShortDesktop ? styles.storyTitleCompact : null,
                    { color: theme.colors.text },
                  ]}
                >
                  {storyTitle}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.desktopMascotStage,
                isShortDesktop ? styles.desktopMascotStageCompact : null,
              ]}
            >
              <View
                style={[
                  styles.desktopMascotHalo,
                  { backgroundColor: `${theme.colors.primary}18` },
                ]}
              />
              <Animated.View
                style={{ transform: [{ translateY: mascotTranslateY }] }}
              >
                <NexoMascot size={desktopMascotSize} animated={!reduceMotion} />
              </Animated.View>
            </View>

            <Text style={[styles.storyCopy, { color: theme.colors.textMuted }]}>
              {storyCopy}
            </Text>

            <View style={styles.storySignals}>
              {storyStats.map((stat) => {
                const accent =
                  stat.tone === "secondary"
                    ? theme.colors.secondary
                    : stat.tone === "accent"
                      ? theme.colors.accent
                      : theme.colors.success;
                return (
                  <View
                    key={stat.label}
                    style={[
                      styles.statCard,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: `${accent}33`,
                      },
                    ]}
                  >
                    <View style={styles.statHead}>
                      <stat.Icon size={14} color={accent} />
                      <Text
                        style={[styles.statTone, { color: accent }]}
                        numberOfLines={1}
                      >
                        {stat.kicker}
                      </Text>
                    </View>
                    <Text
                      style={[styles.statValue, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {stat.value}
                    </Text>
                    <Text
                      style={[
                        styles.statLabel,
                        { color: theme.colors.textMuted },
                      ]}
                      numberOfLines={1}
                    >
                      {stat.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            {
              backgroundColor: "rgba(12,14,28,0.74)",
              borderColor: "rgba(255,255,255,0.14)",
              shadowColor: theme.colors.secondary,
            },
            {
              maxWidth: cardMaxWidth,
              padding: cardPadding,
              gap: cardGap,
            },
            dockedDesktopPanel ? styles.cardDocked : null,
            compactDesktopPanel ? styles.cardCompactDocked : null,
          ]}
        >
          <BlurView
            intensity={46}
            tint="dark"
            blurMethod="dimezisBlurViewSdk31Plus"
            style={styles.cardBlur}
          />
          <LinearGradient
            colors={[
              `${theme.colors.primary}26`,
              `${theme.colors.secondary}12`,
              `${theme.colors.accent}1C`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGlow}
          />

          {!isDesktop ? (
            <View
              pointerEvents="none"
              style={[
                mobileMascot === "inline" ? styles.brandInline : styles.brand,
                webNoSelect,
              ]}
            >
              <View style={styles.brandIcon}>
                {mobileMascot === "inline" ? (
                  <NexoMascot size={44} animated={!reduceMotion} />
                ) : (
                  <NexoMark size={44} />
                )}
              </View>
              <Text style={[styles.brandText, { color: theme.colors.text }]}>
                Nexo
              </Text>
            </View>
          ) : null}

          {!isDesktop && mobileMascot === "hero" ? (
            <View
              pointerEvents="none"
              style={[styles.mascotStage, { minHeight: mobileMascotSize }]}
            >
              <View
                style={[
                  styles.mascotHalo,
                  { backgroundColor: `${theme.colors.primary}16` },
                  {
                    width: mobileMascotSize * 0.84,
                    height: mobileMascotSize * 0.84,
                    borderRadius: mobileMascotSize * 0.42,
                  },
                ]}
              />
              <Animated.View
                style={{ transform: [{ translateY: mascotTranslateY }] }}
              >
                <NexoMascot size={mobileMascotSize} animated={!reduceMotion} />
              </Animated.View>
            </View>
          ) : null}

          <View
            style={[
              styles.header,
              {
                gap: headerGap,
              },
            ]}
          >
            {eyebrow ? (
              <Text
                style={[
                  styles.cardEyebrow,
                  { color: theme.colors.secondary },
                ]}
              >
                {`· ${eyebrow}`}
              </Text>
            ) : null}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            {isVeryShort && !isDesktop ? null : (
              <Text
                style={[styles.subtitle, { color: theme.colors.textMuted }]}
              >
                {subtitle}
              </Text>
            )}
          </View>

          <View style={[styles.form, { gap: formGap }]}>{children}</View>
        </View>
      </View>
    </ScreenContainer>
  );
}

function getAuthMetrics(
  width: number,
  height: number,
  panelVariant: "docked" | "compact",
) {
  const isDesktop = width >= 980;
  const isDockedDesktop = isDesktop && height >= 720;
  const isShortDesktop = isDesktop && height < 900;
  const isVeryShortDesktop = isDesktop && height < 780;
  const isNarrow = width < 390;
  const isShort = height < 720;
  const isVeryShort = height < 640;
  const compactDesktopPanel = isDockedDesktop && panelVariant === "compact";
  const dockedDesktopPanel = isDockedDesktop && !compactDesktopPanel;

  const desktopInsetX = isVeryShortDesktop ? 16 : isShortDesktop ? 20 : 28;
  const desktopInsetY = isVeryShortDesktop ? 12 : isShortDesktop ? 18 : 24;

  const mobileMascotSize = isVeryShort
    ? 76
    : isShort
      ? 92
      : isNarrow
        ? 104
        : 118;
  const desktopMascotSize = isVeryShortDesktop
    ? 210
    : isShortDesktop
      ? Math.min(270, Math.max(220, width * 0.15))
      : Math.min(330, Math.max(230, width * 0.18));

  const headerGap = compactDesktopPanel
    ? 7
    : isDockedDesktop && isShortDesktop
      ? 3
      : isShort && !isDesktop
        ? 4
        : 6;
  const formGap = isDockedDesktop
    ? compactDesktopPanel
      ? 14
      : isVeryShortDesktop
        ? 7
        : isShortDesktop
          ? 9
          : 11
    : isShort && !isDesktop
      ? 10
      : 13;

  const cardMaxWidth = isDockedDesktop
    ? 470
    : isDesktop
      ? 440
      : isNarrow
        ? 348
        : 394;
  const cardPadding = isDockedDesktop
    ? compactDesktopPanel
      ? isShortDesktop
        ? 22
        : 28
      : isVeryShortDesktop
        ? 16
        : isShortDesktop
          ? 18
          : 24
    : isDesktop
      ? 24
      : isShort
        ? 16
        : 18;
  const cardGap = isDockedDesktop
    ? compactDesktopPanel
      ? isShortDesktop
        ? 13
        : 16
      : isVeryShortDesktop
        ? 9
        : isShortDesktop
          ? 11
          : 14
    : isDesktop
      ? 18
      : isShort
        ? 12
        : 15;

  return {
    isDesktop,
    isDockedDesktop,
    isShortDesktop,
    isVeryShortDesktop,
    isNarrow,
    isShort,
    isVeryShort,
    compactDesktopPanel,
    dockedDesktopPanel,
    desktopInsetX,
    desktopInsetY,
    mobileMascotSize,
    desktopMascotSize,
    headerGap,
    formGap,
    cardMaxWidth,
    cardPadding,
    cardGap,
  };
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}

const webNoSelect =
  Platform.OS === "web"
    ? ({
        userSelect: "none",
        cursor: "default",
      } as unknown as ViewStyle)
    : undefined;

const styles = StyleSheet.create({
  screen: {
    alignItems: "center",
    paddingHorizontal: 18,
  },
  screenDocked: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  particle: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.86)",
  },
  glowLarge: {
    position: "absolute",
    top: 16,
    right: -84,
  },
  glowSmall: {
    position: "absolute",
    bottom: 34,
    left: -70,
  },
  glowCyan: {
    position: "absolute",
    top: "34%",
    left: "18%",
    opacity: 0.82,
  },
  glowPanel: {
    position: "absolute",
    right: -80,
    bottom: "18%",
    opacity: 0.72,
  },
  grainVeil: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.28,
    backgroundColor: "rgba(255,255,255,0.012)",
  },
  orbitStroke: {
    position: "absolute",
    width: 188,
    height: 92,
    borderWidth: 9,
    borderRadius: 999,
    top: 96,
    left: -44,
    transform: [{ rotate: "24deg" }],
  },
  orbitStrokeDesktop: {
    width: 270,
    height: 118,
    top: 74,
    left: 28,
    borderWidth: 10,
  },
  orbitStrokeAlt: {
    position: "absolute",
    width: 168,
    height: 76,
    borderWidth: 8,
    borderRadius: 999,
    right: -38,
    bottom: 110,
    transform: [{ rotate: "-42deg" }],
  },
  orbitStrokeAltDesktop: {
    width: 230,
    height: 96,
    right: 92,
    bottom: 72,
    borderWidth: 10,
  },
  layout: {
    width: "100%",
    alignItems: "center",
  },
  layoutMobile: {
    justifyContent: "center",
  },
  layoutDesktop: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 0,
  },
  storyPanel: {
    flex: 1,
    minWidth: 0,
    maxWidth: 820,
    minHeight: 0,
    justifyContent: "center",
    gap: 22,
    paddingHorizontal: 56,
    paddingVertical: 28,
  },
  storyBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  storyBrandCopy: {
    flex: 1,
  },
  storyLogo: {
    width: 58,
    height: 58,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  storyKicker: {
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  storyTitle: {
    maxWidth: 460,
    fontSize: 46,
    lineHeight: 50,
    fontWeight: "900",
  },
  storyTitleCompact: {
    fontSize: 40,
    lineHeight: 44,
  },
  desktopMascotStage: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopMascotStageCompact: {
    minHeight: 260,
  },
  desktopMascotHalo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  storyCopy: {
    maxWidth: 500,
    fontSize: typography.body,
    lineHeight: 23,
    fontWeight: "700",
  },
  storySignals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  signalItem: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signalText: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 120,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 4,
  },
  statHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statTone: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: 16,
    overflow: "hidden",
    shadowOpacity: 0.22,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  cardDocked: {
    width: 470,
    height: "100%",
    minHeight: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    borderRadius: 24,
    shadowOpacity: 0.26,
  },
  cardCompactDocked: {
    width: 470,
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 24,
    shadowOpacity: 0.26,
  },
  cardBlur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  cardGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  brand: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brandInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  brandIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  brandText: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  mascotStage: {
    minHeight: 118,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotHalo: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
  },
  header: {
    gap: 6,
  },
  cardEyebrow: {
    alignSelf: "center",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2.4,
    textAlign: "center",
    textTransform: "uppercase",
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.small,
    lineHeight: 19,
    textAlign: "center",
  },
  form: {
    gap: 13,
  },
});
