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
  mobileMascot?: "hero" | "inline" | "none" | undefined;
}>;

const particles = [
  { top: "12%", left: "8%", size: 1.5, opacity: 0.3 },
  { top: "24%", left: "88%", size: 2, opacity: 0.25 },
  { top: "45%", left: "5%", size: 1.5, opacity: 0.2 },
  { top: "68%", left: "92%", size: 2, opacity: 0.28 },
  { top: "82%", left: "15%", size: 1.5, opacity: 0.22 },
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
    outputRange: [0, isDesktop ? -6 : -4],
  });
  const particleOpacity = particlePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.4],
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
      {/* Background - Simplified decorations */}
      <View pointerEvents="none" style={styles.backgroundArt}>
        {/* Reduced opacity glows - moved to edges */}
        <View
          style={[
            styles.glowLarge,
            {
              backgroundColor: `${theme.colors.primary}12`,
              width: isDesktop ? 380 : 200,
              height: isDesktop ? 380 : 200,
              borderRadius: isDesktop ? 190 : 100,
            },
          ]}
        />
        <View
          style={[
            styles.glowSmall,
            {
              backgroundColor: `${theme.colors.accent}0C`,
              width: isDesktop ? 220 : 140,
              height: isDesktop ? 220 : 140,
              borderRadius: isDesktop ? 110 : 70,
            },
          ]}
        />
        {/* Subtle grain overlay */}
        <View style={styles.grainVeil} />
        {/* Simplified orbit strokes - lower opacity */}
        <View
          style={[
            styles.orbitStroke,
            { borderColor: `${theme.colors.secondary}20` },
            isDesktop ? styles.orbitStrokeDesktop : null,
          ]}
        />
        <View
          style={[
            styles.orbitStrokeAlt,
            { borderColor: `${theme.colors.accent}18` },
            isDesktop ? styles.orbitStrokeAltDesktop : null,
          ]}
        />
        {/* Smaller, subtler particles */}
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
                opacity: reduceMotion ? particle.opacity * 0.5 : particleOpacity,
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
        {/* Desktop Story Panel - Simplified */}
        {isDesktop ? (
          <View pointerEvents="none" style={[styles.storyPanel, webNoSelect]}>
            <View style={styles.storyBrand}>
              <View style={styles.storyLogo}>
                <NexoMark size={52} />
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
                  { backgroundColor: `${theme.colors.primary}10` },
                ]}
              />
              <Animated.View
                style={{ transform: [{ translateY: mascotTranslateY }] }}
              >
                <NexoMascot size={desktopMascotSize} animated={!reduceMotion} />
              </Animated.View>
            </View>

            <Text
              style={[
                styles.storyCopy,
                { color: theme.colors.textSecondary ?? theme.colors.textMuted },
              ]}
            >
              {storyCopy}
            </Text>

            {/* Stats - Improved contrast */}
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
                        backgroundColor: `${theme.colors.surface}E6`,
                        borderColor: `${accent}40`,
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
                        {
                          color:
                            theme.colors.textSecondary ?? theme.colors.textMuted,
                        },
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

        {/* Form Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: "rgba(12,14,28,0.82)",
              borderColor: "rgba(255,255,255,0.1)",
              shadowColor: theme.colors.primary,
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
            intensity={40}
            tint="dark"
            blurMethod="dimezisBlurViewSdk31Plus"
            style={styles.cardBlur}
          />
          <LinearGradient
            colors={[
              `${theme.colors.primary}18`,
              `${theme.colors.secondary}08`,
              `${theme.colors.accent}10`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGlow}
          />

          {/* Mobile brand header */}
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
                  <NexoMascot size={40} animated={!reduceMotion} />
                ) : (
                  <NexoMark size={40} />
                )}
              </View>
              <Text style={[styles.brandText, { color: theme.colors.text }]}>
                Nexo
              </Text>
            </View>
          ) : null}

          {/* Mobile mascot hero */}
          {!isDesktop && mobileMascot === "hero" ? (
            <View
              pointerEvents="none"
              style={[styles.mascotStage, { minHeight: mobileMascotSize }]}
            >
              <View
                style={[
                  styles.mascotHalo,
                  { backgroundColor: `${theme.colors.primary}0C` },
                  {
                    width: mobileMascotSize * 0.8,
                    height: mobileMascotSize * 0.8,
                    borderRadius: mobileMascotSize * 0.4,
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

          {/* Header */}
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
                {`- ${eyebrow.toUpperCase()} -`}
              </Text>
            ) : null}
            <Text style={[styles.title, { color: theme.colors.text }]}>
              {title}
            </Text>
            {isVeryShort && !isDesktop ? null : (
              <Text
                style={[
                  styles.subtitle,
                  {
                    color:
                      theme.colors.textSecondary ?? theme.colors.textMuted,
                  },
                ]}
              >
                {subtitle}
              </Text>
            )}
          </View>

          {/* Form content */}
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
    ? 72
    : isShort
      ? 88
      : isNarrow
        ? 100
        : 110;
  const desktopMascotSize = isVeryShortDesktop
    ? 200
    : isShortDesktop
      ? Math.min(250, Math.max(210, width * 0.14))
      : Math.min(300, Math.max(220, width * 0.16));

  const headerGap = compactDesktopPanel
    ? 6
    : isDockedDesktop && isShortDesktop
      ? 3
      : isShort && !isDesktop
        ? 4
        : 5;
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
    ? 460
    : isDesktop
      ? 430
      : isNarrow
        ? 340
        : 380;
  const cardPadding = isDockedDesktop
    ? compactDesktopPanel
      ? isShortDesktop
        ? 20
        : 26
      : isVeryShortDesktop
        ? 16
        : isShortDesktop
          ? 18
          : 22
    : isDesktop
      ? 22
      : isShort
        ? 16
        : 18;
  const cardGap = isDockedDesktop
    ? compactDesktopPanel
      ? isShortDesktop
        ? 12
        : 14
      : isVeryShortDesktop
        ? 8
        : isShortDesktop
          ? 10
          : 12
    : isDesktop
      ? 16
      : isShort
        ? 11
        : 14;

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
    backgroundColor: "rgba(255,255,255,0.9)",
  },
  glowLarge: {
    position: "absolute",
    top: -60,
    right: -120,
  },
  glowSmall: {
    position: "absolute",
    bottom: -40,
    left: -80,
  },
  grainVeil: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.15,
    backgroundColor: "rgba(255,255,255,0.008)",
  },
  orbitStroke: {
    position: "absolute",
    width: 160,
    height: 72,
    borderWidth: 6,
    borderRadius: 999,
    top: 60,
    left: -60,
    transform: [{ rotate: "24deg" }],
  },
  orbitStrokeDesktop: {
    width: 220,
    height: 90,
    top: 50,
    left: 10,
    borderWidth: 7,
  },
  orbitStrokeAlt: {
    position: "absolute",
    width: 140,
    height: 60,
    borderWidth: 5,
    borderRadius: 999,
    right: -50,
    bottom: 80,
    transform: [{ rotate: "-42deg" }],
  },
  orbitStrokeAltDesktop: {
    width: 180,
    height: 75,
    right: 60,
    bottom: 50,
    borderWidth: 6,
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
    maxWidth: 780,
    minHeight: 0,
    justifyContent: "center",
    gap: 20,
    paddingHorizontal: 48,
    paddingVertical: 24,
  },
  storyBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  storyBrandCopy: {
    flex: 1,
  },
  storyLogo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  storyKicker: {
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  storyTitle: {
    maxWidth: 420,
    fontSize: 42,
    lineHeight: 46,
    fontWeight: "900",
  },
  storyTitleCompact: {
    fontSize: 36,
    lineHeight: 40,
  },
  desktopMascotStage: {
    minHeight: 300,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopMascotStageCompact: {
    minHeight: 240,
  },
  desktopMascotHalo: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
  },
  storyCopy: {
    maxWidth: 460,
    fontSize: typography.body,
    lineHeight: 22,
    fontWeight: "600",
  },
  storySignals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 115,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  statHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statTone: {
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: 14,
    overflow: "hidden",
    shadowOpacity: 0.18,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  cardDocked: {
    width: 460,
    height: "100%",
    minHeight: 0,
    alignSelf: "stretch",
    justifyContent: "center",
    borderRadius: 22,
    shadowOpacity: 0.22,
  },
  cardCompactDocked: {
    width: 460,
    alignSelf: "center",
    justifyContent: "center",
    borderRadius: 22,
    shadowOpacity: 0.22,
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
    gap: 6,
  },
  brandInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  brandIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  brandText: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  mascotStage: {
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
  },
  mascotHalo: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  header: {
    gap: 5,
  },
  cardEyebrow: {
    alignSelf: "center",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 2,
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
    lineHeight: 18,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
});
