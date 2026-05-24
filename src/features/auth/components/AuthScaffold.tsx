import type { PropsWithChildren } from "react";
import {
  Platform,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from "react-native";
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
}>;

export function AuthScaffold({ title, subtitle, children }: AuthScaffoldProps) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const isDesktop = width >= 980 && height >= 680;
  const isNarrow = width < 390;
  const isShort = height < 720;
  const isVeryShort = height < 640;
  const mobileMascotSize = isVeryShort ? 100 : isShort ? 122 : isNarrow ? 134 : 154;
  const desktopMascotSize = Math.min(330, Math.max(230, width * 0.18));

  return (
    <ScreenContainer
      scroll
      contentStyle={[
        styles.screen,
        {
          maxWidth: isDesktop ? 1160 : 430,
          justifyContent: isShort && !isDesktop ? "flex-start" : "center",
          paddingVertical: isDesktop ? 34 : isShort ? 16 : 28,
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
      </View>

      <View style={[styles.layout, isDesktop ? styles.layoutDesktop : styles.layoutMobile]}>
        {isDesktop ? (
          <View pointerEvents="none" style={[styles.storyPanel, webNoSelect]}>
            <View style={styles.storyBrand}>
              <View style={styles.storyLogo}>
                <NexoMark size={58} />
              </View>
              <View>
                <Text style={[styles.storyKicker, { color: theme.colors.secondary }]}>
                  Nexo
                </Text>
                <Text style={[styles.storyTitle, { color: theme.colors.text }]}>
                  Tu mapa de orbitas sociales
                </Text>
              </View>
            </View>

            <View style={styles.desktopMascotStage}>
              <View
                style={[
                  styles.desktopMascotHalo,
                  { backgroundColor: `${theme.colors.primary}18` },
                ]}
              />
              <NexoMascot size={desktopMascotSize} />
            </View>

            <Text style={[styles.storyCopy, { color: theme.colors.textMuted }]}>
              Descubre comunidades, comparte ecos con energia y participa en espacios
              moderados desde el primer dia.
            </Text>

            <View style={styles.storySignals}>
              <View
                style={[
                  styles.signalItem,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Orbit size={18} color={theme.colors.secondary} />
                <Text style={[styles.signalText, { color: theme.colors.text }]}>
                  Orbitas vivas
                </Text>
              </View>
              <View
                style={[
                  styles.signalItem,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Sparkles size={18} color={theme.colors.accent} />
                <Text style={[styles.signalText, { color: theme.colors.text }]}>
                  Ecos con sentido
                </Text>
              </View>
              <View
                style={[
                  styles.signalItem,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <ShieldCheck size={18} color={theme.colors.success} />
                <Text style={[styles.signalText, { color: theme.colors.text }]}>
                  Seguridad UGC
                </Text>
              </View>
            </View>
          </View>
        ) : null}

        <View
          style={[
            styles.card,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            {
              maxWidth: isDesktop ? 430 : isNarrow ? 356 : 392,
              padding: isDesktop ? 22 : isShort ? 14 : 18,
              gap: isDesktop ? 18 : isShort ? 11 : 16,
            },
          ]}
        >
          <LinearGradient
            colors={[
              `${theme.colors.primary}24`,
              `${theme.colors.secondary}14`,
              `${theme.colors.accent}1F`,
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGlow}
          />

          <View pointerEvents="none" style={[styles.brand, webNoSelect]}>
            <View style={styles.brandIcon}>
              <NexoMark size={44} />
            </View>
            <Text style={[styles.brandText, { color: theme.colors.text }]}>Nexo</Text>
          </View>

          {!isDesktop ? (
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
              <NexoMascot size={mobileMascotSize} />
            </View>
          ) : null}

          <View style={[styles.header, { gap: isShort && !isDesktop ? 4 : 6 }]}>
            <Text style={[styles.title, { color: theme.colors.text }]}>{title}</Text>
            {isVeryShort && !isDesktop ? null : (
              <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
                {subtitle}
              </Text>
            )}
          </View>

          <View style={styles.form}>{children}</View>
        </View>
      </View>
    </ScreenContainer>
  );
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
  backgroundArt: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
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
    flexDirection: "row",
    justifyContent: "center",
    gap: 42,
  },
  storyPanel: {
    flex: 1,
    minWidth: 0,
    maxWidth: 620,
    minHeight: 560,
    justifyContent: "center",
    gap: 24,
  },
  storyBrand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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
    fontSize: 44,
    lineHeight: 49,
    fontWeight: "900",
  },
  desktopMascotStage: {
    minHeight: 330,
    alignItems: "center",
    justifyContent: "center",
  },
  desktopMascotHalo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
  },
  storyCopy: {
    maxWidth: 520,
    fontSize: typography.h3,
    lineHeight: 25,
    fontWeight: "700",
  },
  storySignals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
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
  card: {
    width: "100%",
    borderWidth: 1,
    borderRadius: radius.lg,
    gap: 16,
    overflow: "hidden",
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
    minHeight: 154,
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
  title: {
    fontSize: typography.h2,
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
