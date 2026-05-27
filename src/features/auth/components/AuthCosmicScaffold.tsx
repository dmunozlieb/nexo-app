import {
  createElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type DimensionValue,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { fontFamilies, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { AuthOrbitMascot } from "./AuthOrbitMascot";

type AuthCosmicScaffoldProps = PropsWithChildren<{
  title: string;
  subtitle: string;
  storyTitle: string;
  storyCopy: string;
  storyBadge?: string | undefined;
  visualSignals?: ReadonlyArray<AuthVisualSignal> | undefined;
  showTabletMascot?: boolean | undefined;
}>;

type AuthVisualSignal = {
  label: string;
  hint?: string | undefined;
  color: string;
  icon?: ReactNode | undefined;
};

const stars: {
  top: DimensionValue;
  left: DimensionValue;
  size: number;
  opacity: number;
}[] = [
  { top: "3%", left: "7%", size: 1, opacity: 0.72 },
  { top: "7%", left: "24%", size: 1, opacity: 0.38 },
  { top: "10%", left: "72%", size: 1, opacity: 0.68 },
  { top: "13%", left: "90%", size: 2, opacity: 0.58 },
  { top: "18%", left: "44%", size: 1, opacity: 0.42 },
  { top: "23%", left: "15%", size: 1, opacity: 0.5 },
  { top: "28%", left: "81%", size: 1, opacity: 0.72 },
  { top: "35%", left: "5%", size: 1, opacity: 0.4 },
  { top: "42%", left: "58%", size: 2, opacity: 0.58 },
  { top: "49%", left: "94%", size: 1, opacity: 0.44 },
  { top: "58%", left: "12%", size: 2, opacity: 0.64 },
  { top: "63%", left: "68%", size: 1, opacity: 0.48 },
  { top: "71%", left: "32%", size: 1, opacity: 0.54 },
  { top: "79%", left: "83%", size: 1, opacity: 0.72 },
  { top: "85%", left: "48%", size: 2, opacity: 0.55 },
  { top: "93%", left: "18%", size: 1, opacity: 0.45 },
];

export function AuthCosmicScaffold({
  title,
  subtitle,
  storyTitle,
  storyCopy,
  storyBadge,
  visualSignals,
  showTabletMascot = false,
  children,
}: AuthCosmicScaffoldProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const reduceMotion = useReduceMotion();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && !isDesktop;
  const isShort = height < 740;
  const scroll = !isDesktop || height < 720;
  const formMaxWidth = isDesktop ? 440 : isTablet ? 520 : 440;
  const desktopGap = Math.min(Math.max(width * 0.075, 90), 150);
  const visualWidth = Math.min(Math.max(width * 0.44, 520), 760);
  const visualHeight = Math.min(Math.max(height - 28, 620), 860);

  return (
    <ScreenContainer
      scroll={scroll}
      contentStyle={[
        styles.screen,
        {
          maxWidth: "100%",
          paddingHorizontal: isDesktop ? 20 : width < 390 ? 14 : 18,
          paddingVertical: isDesktop ? 10 : isShort ? 14 : 20,
        },
      ]}
    >
      <RegisterBackdrop reduceMotion={reduceMotion} />

      {isDesktop ? (
        <View style={[styles.desktopLayout, { gap: desktopGap }]}>
          <View style={styles.formColumn}>
            <GlassCard maxWidth={formMaxWidth}>
              {renderFormHeader(
                title,
                subtitle,
                theme.colors.text,
                theme.colors.textMuted,
              )}
              {children}
            </GlassCard>
          </View>
          <View style={[styles.visualColumn, { width: visualWidth }]}>
            <View style={[styles.visualShell, { height: visualHeight }]}>
              {Platform.OS === "web" ? (
                <WebVisualPanelBackdrop />
              ) : (
                <LinearGradient
                  colors={[
                    "rgba(123,92,255,0.14)",
                    "rgba(217,70,239,0.07)",
                    "rgba(24,215,255,0.1)",
                  ]}
                  start={{ x: 0.15, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={styles.visualOrbitOne} />
              <View style={styles.visualOrbitTwo} />
              <View style={styles.visualInner}>
                <AuthOrbitMascot
                  size={height < 820 ? 168 : 198}
                  animated={!reduceMotion}
                  style={styles.visualMascot}
                />
                {storyBadge ? (
                  <View
                    style={[
                      styles.storyBadge,
                      {
                        borderColor: `${theme.colors.secondary}44`,
                        backgroundColor: `${theme.colors.secondary}18`,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.storyBadgeText,
                        { color: theme.colors.secondary },
                      ]}
                    >
                      {storyBadge}
                    </Text>
                  </View>
                ) : null}
                <Text style={[styles.storyTitle, { color: theme.colors.text }]}>
                  {storyTitle}
                </Text>
                <Text
                  style={[styles.storyCopy, { color: theme.colors.textMuted }]}
                >
                  {storyCopy}
                </Text>
                {visualSignals?.length ? (
                  <View style={styles.conceptSignalRow}>
                    {visualSignals.map((signal) => (
                      <ConceptSignal key={signal.label} signal={signal} />
                    ))}
                  </View>
                ) : (
                  <View style={styles.signalRow}>
                    <SignalDot label="Orbitas" color={theme.colors.primary} />
                    <SignalDot label="Senales" color={theme.colors.secondary} />
                    <SignalDot label="Conexiones" color={theme.colors.accent} />
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      ) : (
        <View style={[styles.mobileLayout, { maxWidth: formMaxWidth }]}>
          {isTablet ? (
            <>
              {showTabletMascot ? (
                <AuthOrbitMascot
                  size={92}
                  animated={!reduceMotion}
                  style={styles.tabletMascot}
                />
              ) : null}
              <GlassCard maxWidth={formMaxWidth}>
                {renderFormHeader(
                  title,
                  subtitle,
                  theme.colors.text,
                  theme.colors.textMuted,
                )}
                {children}
              </GlassCard>
            </>
          ) : (
            <View style={styles.mobileForm}>
              {renderFormHeader(
                title,
                subtitle,
                theme.colors.text,
                theme.colors.textMuted,
              )}
              {children}
            </View>
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

function renderFormHeader(
  title: string,
  subtitle: string,
  textColor: string,
  mutedColor: string,
) {
  return (
    <View style={styles.header}>
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <LinearGradient
            colors={["#7B5CFF", "#18D7FF", "#FF4FD8"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.brandMarkInner}>
            <View style={styles.brandCore} />
          </View>
        </View>
        <Text style={[styles.brandText, { color: mutedColor }]}>Nexo</Text>
      </View>
      <Text style={[styles.title, { color: textColor }]}>{title}</Text>
      <Text style={[styles.subtitle, { color: mutedColor }]}>{subtitle}</Text>
    </View>
  );
}

function GlassCard({
  children,
  maxWidth,
}: PropsWithChildren<{ maxWidth: number }>) {
  return (
    <View style={[styles.card, { maxWidth }]}>
      <BlurView
        intensity={42}
        tint="dark"
        experimentalBlurMethod="dimezisBlurView"
        style={styles.cardBlur}
      />
      <LinearGradient
        colors={[
          "rgba(255,255,255,0.045)",
          "rgba(123,92,255,0.055)",
          "rgba(255,255,255,0.02)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.cardContent}>{children}</View>
    </View>
  );
}

function SignalDot({ label, color }: { label: string; color: string }) {
  return (
    <View style={styles.signal}>
      <View
        style={[
          styles.signalDot,
          {
            backgroundColor: color,
            shadowColor: color,
          },
        ]}
      />
      <Text style={styles.signalText}>{label}</Text>
    </View>
  );
}

function ConceptSignal({ signal }: { signal: AuthVisualSignal }) {
  return (
    <View
      style={[
        styles.conceptSignal,
        {
          backgroundColor: `${signal.color}12`,
          borderColor: `${signal.color}62`,
          shadowColor: signal.color,
        },
      ]}
    >
      <View style={styles.conceptSignalHeader}>
        {signal.icon ? (
          <View style={styles.conceptSignalIcon}>{signal.icon}</View>
        ) : null}
        <Text style={[styles.conceptSignalLabel, { color: signal.color }]}>
          {signal.label.toUpperCase()}
        </Text>
      </View>
      {signal.hint ? (
        <Text style={styles.conceptSignalHint}>{signal.hint}</Text>
      ) : null}
    </View>
  );
}

function RegisterBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  const useFigmaWebBackground = Platform.OS === "web";

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {useFigmaWebBackground ? (
        <FigmaWebCosmicBackground />
      ) : (
        <>
          <LinearGradient
            colors={["#070622", "#090A1F", "#050611"]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.nebulaViolet} />
          <View style={styles.nebulaCyan} />
          <View style={styles.nebulaMagenta} />
          <View style={styles.backOrbitLarge} />
          <View style={styles.backOrbitSmall} />
        </>
      )}
      {stars.map((star, index) => (
        <TwinkleStar
          key={`${star.top}-${star.left}`}
          star={star}
          index={index}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

function FigmaWebCosmicBackground() {
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
    createElement("div", { style: webCosmic.nebulaAccent }),
    createElement("div", { style: webCosmic.orbitLarge }),
    createElement("div", { style: webCosmic.orbitSmall }),
  );
}

function WebVisualPanelBackdrop() {
  if (Platform.OS !== "web") {
    return null;
  }

  return createElement("div", { style: webVisualPanel });
}

function TwinkleStar({
  star,
  index,
  reduceMotion,
}: {
  star: {
    top: DimensionValue;
    left: DimensionValue;
    size: number;
    opacity: number;
  };
  index: number;
  reduceMotion: boolean;
}) {
  const opacity = useRef(new Animated.Value(star.opacity)).current;

  useEffect(() => {
    if (reduceMotion) {
      opacity.setValue(star.opacity);
      return;
    }

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: Math.min(1, star.opacity + 0.28),
          duration: 1600 + index * 40,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: Math.max(0.18, star.opacity - 0.24),
          duration: 1900 + index * 45,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [index, opacity, reduceMotion, star.opacity]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          opacity,
        },
      ]}
    />
  );
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
      "radial-gradient(120% 80% at 50% -10%, #1a1240 0%, #0a0a1f 55%, #050510 100%)",
  },
  nebulaViolet: {
    position: "absolute",
    top: -160,
    left: -128,
    width: "65vmin",
    height: "65vmin",
    borderRadius: 9999,
    opacity: 0.55,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(139,92,246,0.6), rgba(139,92,246,0) 65%)",
  },
  nebulaCyan: {
    position: "absolute",
    top: "33.333%",
    right: -128,
    width: "58vmin",
    height: "58vmin",
    borderRadius: 9999,
    opacity: 0.45,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(34,211,238,0.5), rgba(34,211,238,0) 65%)",
  },
  nebulaMagenta: {
    position: "absolute",
    bottom: -160,
    left: "33.333%",
    width: "52vmin",
    height: "52vmin",
    borderRadius: 9999,
    opacity: 0.35,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(217,70,239,0.52), rgba(217,70,239,0) 65%)",
  },
  nebulaAccent: {
    position: "absolute",
    top: "50%",
    left: "25%",
    width: "40vmin",
    height: "40vmin",
    borderRadius: 9999,
    opacity: 0.25,
    filter: "blur(64px)",
    background:
      "radial-gradient(closest-side, rgba(168,85,247,0.45), transparent 70%)",
  },
  orbitLarge: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "140vmin",
    height: "140vmin",
    marginLeft: "-70vmin",
    marginTop: "-70vmin",
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.03)",
    boxShadow: "inset 0 0 120px rgba(139,92,246,0.1)",
  },
  orbitSmall: {
    position: "absolute",
    left: "50%",
    top: "50%",
    width: "90vmin",
    height: "90vmin",
    marginLeft: "-45vmin",
    marginTop: "-45vmin",
    borderRadius: 9999,
    border: "1px solid rgba(255,255,255,0.035)",
    boxShadow: "0 0 80px rgba(34,211,238,0.06)",
  },
};

const webVisualPanel: CSSProperties = {
  position: "absolute",
  inset: 0,
  background:
    "radial-gradient(130% 80% at 50% 30%, rgba(139,92,246,0.22), transparent 65%), radial-gradient(100% 70% at 70% 80%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(90% 90% at 30% 50%, rgba(217,70,239,0.15), transparent 65%)",
  borderRadius: 36,
  pointerEvents: "none",
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  desktopLayout: {
    flex: 1,
    width: "100%",
    maxWidth: 1500,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  formColumn: {
    width: 440,
    flexShrink: 0,
    alignItems: "center",
  },
  visualColumn: {
    flexShrink: 0,
    justifyContent: "center",
  },
  mobileLayout: {
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
  },
  mobileForm: {
    width: "100%",
    gap: 17,
  },
  tabletMascot: {
    alignSelf: "center",
    marginBottom: 18,
  },
  card: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 14,
  },
  cardBlur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  cardContent: {
    gap: 14,
    paddingHorizontal: 28,
    paddingVertical: 26,
  },
  header: {
    alignItems: "center",
    gap: 7,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 4,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#7B5CFF",
    shadowOpacity: 0.5,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  brandMarkInner: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#090A1F",
    alignItems: "center",
    justifyContent: "center",
  },
  brandCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  brandText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.tiny,
    fontWeight: "600",
    letterSpacing: 3.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: fontFamilies.interBold,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    letterSpacing: 0,
    textAlign: "center",
  },
  subtitle: {
    maxWidth: 300,
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: "500",
    textAlign: "center",
  },
  visualShell: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 36,
    overflow: "hidden",
    justifyContent: "center",
  },
  visualOrbitOne: {
    position: "absolute",
    width: 760,
    height: 760,
    borderRadius: 380,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
    left: -260,
    top: 18,
  },
  visualOrbitTwo: {
    position: "absolute",
    width: 520,
    height: 520,
    borderRadius: 260,
    borderWidth: 1,
    borderColor: "rgba(24,215,255,0.04)",
    right: -120,
    bottom: -30,
  },
  visualInner: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  visualMascot: {
    marginBottom: 34,
  },
  storyBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  storyBadgeText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  storyTitle: {
    maxWidth: 390,
    fontFamily: fontFamilies.interBold,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: -0.2,
    marginBottom: 16,
  },
  storyCopy: {
    maxWidth: 350,
    fontFamily: fontFamilies.interMedium,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 36,
  },
  signalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 22,
  },
  signal: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  signalDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOpacity: 0.75,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  signalText: {
    color: "rgba(255,255,255,0.46)",
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "500",
  },
  conceptSignalRow: {
    width: "100%",
    maxWidth: 430,
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
  },
  conceptSignal: {
    flex: 1,
    minHeight: 62,
    borderWidth: 1,
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 11,
    alignItems: "flex-start",
    justifyContent: "center",
    gap: 5,
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  conceptSignalHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 5,
  },
  conceptSignalIcon: {
    width: 14,
    height: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  conceptSignalLabel: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "600",
    letterSpacing: 0.8,
    textAlign: "left",
  },
  conceptSignalHint: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    textAlign: "left",
  },
  nebulaViolet: {
    position: "absolute",
    width: 540,
    height: 540,
    borderRadius: 270,
    backgroundColor: "rgba(123,92,255,0.12)",
    top: -220,
    left: -170,
  },
  nebulaCyan: {
    position: "absolute",
    width: 560,
    height: 560,
    borderRadius: 280,
    backgroundColor: "rgba(24,215,255,0.07)",
    right: -180,
    bottom: -100,
  },
  nebulaMagenta: {
    position: "absolute",
    width: 480,
    height: 480,
    borderRadius: 240,
    backgroundColor: "rgba(255,79,216,0.07)",
    bottom: -180,
    left: "33%",
  },
  backOrbitLarge: {
    position: "absolute",
    width: 930,
    height: 930,
    borderRadius: 465,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.035)",
    left: "12%",
    top: "6%",
  },
  backOrbitSmall: {
    position: "absolute",
    width: 620,
    height: 620,
    borderRadius: 310,
    borderWidth: 1,
    borderColor: "rgba(123,92,255,0.045)",
    left: "-8%",
    bottom: "-18%",
  },
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    shadowColor: "#FFFFFF",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
