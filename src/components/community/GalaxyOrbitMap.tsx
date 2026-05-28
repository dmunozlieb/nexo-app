import { useEffect, useRef, useState, type RefObject } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type DimensionValue,
  type ViewStyle,
} from "react-native";
import { BlurTargetView, BlurView } from "expo-blur";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  ChevronRight,
  MessageSquare,
  Sparkles,
  X,
} from "lucide-react-native";
import { NexoMascot } from "../brand/NexoMascot";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { BottomSheet } from "../ui/BottomSheet";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta } from "../../types/domain";
import { formatCompactNumber } from "../../utils/format";

type PlanetLabelPlacement = "left" | "right" | "bottom";

type PlanetLayout = {
  top: DimensionValue;
  left: DimensionValue;
  size: number;
  label: PlanetLabelPlacement;
  hue: number;
};

type GalaxyCommunity = CommunityWithMeta & {
  recent_post_count?: number | undefined;
  new_posts_count?: number | undefined;
  active_chat?: boolean | undefined;
  event_today?: boolean | undefined;
  mission_active?: boolean | undefined;
};

export type PlanetColors = readonly [string, string];

type GalaxyOrbitMapProps = {
  communities: GalaxyCommunity[];
  loading?: boolean;
  fullScreen?: boolean;
  hideHeader?: boolean;
  selectedCommunity?: GalaxyCommunity | null;
  onSelectCommunity?: (
    community: GalaxyCommunity | null,
    colors?: PlanetColors,
  ) => void;
  onOpenCommunity: (community: GalaxyCommunity) => void;
  onOpenChat?: (community: GalaxyCommunity) => void;
  onViewPosts?: (community: GalaxyCommunity) => void;
  onCreateCommunity: () => void;
};


type CommunityVisualTheme = {
  colors: readonly [string, string];
  accent: string;
  soft: string;
  particle: string;
  ringTilt: string;
};

const planetLayouts: PlanetLayout[] = [
  { top: "22%", left: "18%", size: 116, label: "right", hue: 0 },
  { top: "26%", left: "72%", size: 108, label: "left", hue: 1 },
  { top: "62%", left: "46%", size: 132, label: "bottom", hue: 2 },
  { top: "40%", left: "44%", size: 78, label: "left", hue: 3 },
  { top: "70%", left: "16%", size: 92, label: "right", hue: 4 },
  { top: "66%", left: "80%", size: 88, label: "left", hue: 5 },
];

const compactPlanetLayouts: PlanetLayout[] = [
  { top: "22%", left: "26%", size: 58, label: "bottom", hue: 0 },
  { top: "24%", left: "74%", size: 60, label: "bottom", hue: 1 },
  { top: "52%", left: "50%", size: 70, label: "bottom", hue: 2 },
  { top: "80%", left: "24%", size: 50, label: "bottom", hue: 3 },
  { top: "80%", left: "76%", size: 52, label: "bottom", hue: 4 },
];

const planetColors = [
  ["#7B5CFF", "#18D7FF"],
  ["#18D7FF", "#FF4FD8"],
  ["#FF4FD8", "#B18CFF"],
  ["#22E6B9", "#18D7FF"],
  ["#FF7AA8", "#FF4FD8"],
  ["#B18CFF", "#22E6B9"],
] as const;

const floatDurations = [4800, 5600, 6400, 7200, 8000, 6800] as const;
const floatDelays = [0, 520, 1040, 260, 780, 1300] as const;

const pointerStyle = { cursor: "pointer" } as unknown as ViewStyle;

// Difumina el aro/halo del planeta en web (en nativo el blur lo da la sombra).
const webHaloBlur =
  Platform.OS === "web"
    ? ({ filter: "blur(14px)" } as unknown as ViewStyle)
    : null;

const categoryVisualThemes: Record<string, CommunityVisualTheme> = {
  arte: {
    colors: ["#18D7FF", "#7B5CFF"],
    accent: "#B9F7FF",
    soft: "#18D7FF",
    particle: "#D6FBFF",
    ringTilt: "-18deg",
  },
  gaming: {
    colors: ["#22E6B9", "#18D7FF"],
    accent: "#B6FFE5",
    soft: "#22E6B9",
    particle: "#A8FFE1",
    ringTilt: "16deg",
  },
  lectura: {
    colors: ["#B18CFF", "#FF4FD8"],
    accent: "#E2D6FF",
    soft: "#7B5CFF",
    particle: "#E7DFFF",
    ringTilt: "-9deg",
  },
  musica: {
    colors: ["#FF4FD8", "#18D7FF"],
    accent: "#FFD4F5",
    soft: "#FF4FD8",
    particle: "#FFB7EF",
    ringTilt: "22deg",
  },
  cine: {
    colors: ["#FF7AA8", "#FF4FD8"],
    accent: "#FFD0DE",
    soft: "#FF7AA8",
    particle: "#FFE0EA",
    ringTilt: "-24deg",
  },
  tecnologia: {
    colors: ["#18D7FF", "#22E6B9"],
    accent: "#BFFAFF",
    soft: "#18D7FF",
    particle: "#C8FFF4",
    ringTilt: "11deg",
  },
  aprendizaje: {
    colors: ["#7B5CFF", "#22E6B9"],
    accent: "#D7CEFF",
    soft: "#B18CFF",
    particle: "#D9FFE9",
    ringTilt: "-14deg",
  },
};

export function GalaxyOrbitMap({
  communities,
  loading = false,
  fullScreen = false,
  hideHeader = false,
  selectedCommunity: controlledSelectedCommunity,
  onSelectCommunity,
  onOpenCommunity,
  onOpenChat,
  onCreateCommunity,
}: GalaxyOrbitMapProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const blurTargetRef = useRef<View | null>(null);
  const reduceMotion = useReduceMotion();
  const isControlled = onSelectCommunity !== undefined;
  const [internalSelected, setInternalSelected] =
    useState<GalaxyCommunity | null>(null);
  const selectedCommunity = isControlled
    ? (controlledSelectedCommunity ?? null)
    : internalSelected;

  const setSelectedCommunity = (
    community: GalaxyCommunity | null,
    colors?: PlanetColors,
  ) => {
    if (isControlled) {
      onSelectCommunity?.(community, colors);
    } else {
      setInternalSelected(community);
    }
  };
  const compact = width < 980;
  const activeLayouts = compact ? compactPlanetLayouts : planetLayouts;
  const visibleCommunities = communities.slice(0, activeLayouts.length);
  const mobileListCommunities = communities.slice(0, 8);
  const mobileStageHeight = Math.min(420, Math.max(320, width * 0.92));
  // Escala los planetas con el ancho: telefono ~1.0, tablet hasta ~1.55x.
  const planetSizeScale = compact
    ? Math.min(1.55, Math.max(1, width / 480))
    : 1;
  const totalOnline = communities.reduce(
    (sum, community) => sum + (community.online_count ?? 0),
    0,
  );
  const selectedIndex = selectedCommunity
    ? Math.max(
        0,
        visibleCommunities.findIndex(
          (community) => community.id === selectedCommunity.id,
        ),
      )
    : 0;
  const selectedBaseColors =
    planetColors[
      activeLayouts[selectedIndex]?.hue ?? selectedIndex % planetColors.length
    ] ?? planetColors[0];
  const selectedColors = selectedCommunity
    ? getCommunityVisualTheme(selectedCommunity, selectedBaseColors).colors
    : selectedBaseColors;

  useEffect(() => {
    if (isControlled || !selectedCommunity) {
      return;
    }

    const nextSelected = communities.find(
      (community) => community.id === selectedCommunity.id,
    );

    if (!nextSelected) {
      setInternalSelected(null);
      return;
    }

    setInternalSelected(nextSelected);
  }, [communities, selectedCommunity?.id, isControlled]);

  const handleOpenCommunity = (community: GalaxyCommunity) => {
    setSelectedCommunity(null);
    onOpenCommunity(community);
  };

  const handleOpenChat = (community: GalaxyCommunity) => {
    if (!onOpenChat) {
      return;
    }

    setSelectedCommunity(null);
    onOpenChat(community);
  };

  // El fondo cosmico (gradiente + nebulosas + estrellas) vive a nivel de app.
  // El mapa es transparente para no duplicar atmosfera.
  const galaxyBackground = (
    <BlurTargetView
      ref={blurTargetRef}
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    />
  );

  if (compact) {
    // fullScreen mobile: canvas fills available space, no scroll, no list
    if (fullScreen) {
      return (
        <View style={[styles.map, styles.mapFull]}>
          {galaxyBackground}

          {visibleCommunities.length > 0 ? (
            <>
              {visibleCommunities.map((community, index) => {
                const baseLayout = activeLayouts[index]!;
                const layout = {
                  ...baseLayout,
                  size: Math.round(baseLayout.size * planetSizeScale),
                };
                const fallbackColors =
                  planetColors[layout.hue % planetColors.length] ??
                  planetColors[0];
                const visualTheme = getCommunityVisualTheme(
                  community,
                  fallbackColors,
                );

                return (
                  <MobileOrbitNode
                    key={community.id}
                    index={index}
                    community={community}
                    layout={layout}
                    colors={visualTheme.colors}
                    visualTheme={visualTheme}
                    reduceMotion={reduceMotion}
                    selected={selectedCommunity?.id === community.id}
                    onPress={() => setSelectedCommunity(community)}
                  />
                );
              })}
            </>
          ) : loading ? (
            <View style={[styles.empty, styles.emptyFull]}>
              <Text style={styles.emptyTitle}>Cargando galaxia...</Text>
              <Text style={styles.emptyCopy}>
                Estamos ubicando las Orbitas activas.
              </Text>
            </View>
          ) : (
            <View style={[styles.empty, styles.emptyFull]}>
              <NexoMascot size={96} />
              <Text style={styles.emptyTitle}>
                Todavia no hay Orbitas activas
              </Text>
              <Text style={styles.emptyCopy}>
                Crea el primer planeta de esta galaxia y empieza a reunir gente.
              </Text>
              <Button
                title="Crear comunidad"
                size="sm"
                onPress={onCreateCommunity}
              />
            </View>
          )}

          <BottomSheet
            visible={Boolean(selectedCommunity)}
            onClose={() => setSelectedCommunity(null)}
          >
            {selectedCommunity ? (
              <OrbitDetailPanel
                community={selectedCommunity}
                colors={selectedColors}
                compact={compact}
                blurTargetRef={blurTargetRef}
                onClose={() => setSelectedCommunity(null)}
                onEnter={handleOpenCommunity}
                onOpenChat={onOpenChat ? handleOpenChat : undefined}
              />
            ) : null}
          </BottomSheet>
        </View>
      );
    }

    // non-fullScreen mobile: versión scrollable con lista (para otros contextos)
    return (
      <View style={styles.map}>
        {galaxyBackground}
        <ScrollView
          style={styles.mobileScroll}
          contentContainerStyle={styles.mobileContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.mobileHeader}>
            <View style={styles.mobileHeaderRow}>
              <View style={styles.eyebrow}>
                <Sparkles size={13} color={theme.colors.secondary} />
                <Text
                  style={[
                    styles.eyebrowText,
                    { color: theme.colors.secondary },
                  ]}
                >
                  Tu galaxia
                </Text>
              </View>
              <Text style={styles.statsLine}>
                <Text style={styles.statsValue}>{communities.length}</Text>
                <Text style={styles.statsLabel}> · </Text>
                <Text style={styles.statsValue}>
                  {formatCompactNumber(totalOnline)}
                </Text>
                <Text style={styles.statsLabel}> online</Text>
              </Text>
            </View>
          </View>

          {visibleCommunities.length > 0 ? (
            <>
              <View
                style={[styles.mobileOrbitStage, { height: mobileStageHeight }]}
              >
                <View style={styles.mobileStageGlow} />
                <View
                  style={[styles.mobileOrbitLine, styles.mobileOrbitLineOne]}
                />
                <View
                  style={[styles.mobileOrbitLine, styles.mobileOrbitLineTwo]}
                />
                {visibleCommunities.map((community, index) => {
                  const layout = activeLayouts[index]!;
                  const fallbackColors =
                    planetColors[layout.hue % planetColors.length] ??
                    planetColors[0];
                  const visualTheme = getCommunityVisualTheme(
                    community,
                    fallbackColors,
                  );

                  return (
                    <MobileOrbitNode
                      key={community.id}
                      index={index}
                      community={community}
                      layout={layout}
                      colors={visualTheme.colors}
                      visualTheme={visualTheme}
                      reduceMotion={reduceMotion}
                      selected={selectedCommunity?.id === community.id}
                      onPress={() => setSelectedCommunity(community)}
                    />
                  );
                })}
              </View>
              <MobileOrbitList
                communities={mobileListCommunities}
                selectedId={selectedCommunity?.id}
                onSelect={setSelectedCommunity}
              />
            </>
          ) : loading ? (
            <View style={styles.mobileEmpty}>
              <Text style={styles.emptyTitle}>Cargando galaxia...</Text>
              <Text style={styles.emptyCopy}>
                Estamos ubicando las Orbitas activas.
              </Text>
            </View>
          ) : (
            <View style={styles.mobileEmpty}>
              <NexoMascot size={102} />
              <Text style={styles.emptyTitle}>
                Todavia no hay Orbitas activas
              </Text>
              <Text style={styles.emptyCopy}>
                Crea el primer planeta de esta galaxia y empieza a reunir gente.
              </Text>
              <Button
                title="Crear comunidad"
                size="sm"
                onPress={onCreateCommunity}
              />
            </View>
          )}
        </ScrollView>

        <BottomSheet
          visible={Boolean(selectedCommunity)}
          onClose={() => setSelectedCommunity(null)}
        >
          {selectedCommunity ? (
            <OrbitDetailPanel
              community={selectedCommunity}
              colors={selectedColors}
              compact={compact}
              blurTargetRef={blurTargetRef}
              onClose={() => setSelectedCommunity(null)}
              onEnter={handleOpenCommunity}
              onOpenChat={onOpenChat ? handleOpenChat : undefined}
            />
          ) : null}
        </BottomSheet>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.map,
        fullScreen ? styles.mapFull : null,
      ]}
    >
      {galaxyBackground}

      {!hideHeader ? (
        <View style={[styles.header, compact ? styles.headerCompact : null]}>
          <View
            style={[styles.headerCopy, compact ? styles.headerCopyCompact : null]}
          >
            <View style={styles.eyebrow}>
              <Sparkles size={15} color={theme.colors.secondary} />
              <Text
                style={[styles.eyebrowText, { color: theme.colors.secondary }]}
              >
                Tu galaxia
              </Text>
            </View>
            <Text style={styles.subtitle}>
              Esto es lo que orbita a tu alrededor. Toca un planeta y aterriza.
            </Text>
          </View>
          <Text style={styles.statsLine}>
            <Text style={styles.statsValue}>{communities.length}</Text>
            <Text style={styles.statsLabel}> Orbitas · </Text>
            <Text style={styles.statsValue}>
              {formatCompactNumber(totalOnline)}
            </Text>
            <Text style={styles.statsLabel}> online</Text>
          </Text>
        </View>
      ) : null}

      {visibleCommunities.length > 0 ? (
        <>
          {visibleCommunities.map((community, index) => {
            const layout = activeLayouts[index]!;
            const fallbackColors =
              planetColors[layout.hue % planetColors.length] ?? planetColors[0];
            const visualTheme = getCommunityVisualTheme(
              community,
              fallbackColors,
            );

            return (
              <PlanetNode
                key={community.id}
                index={index}
                compact={compact}
                community={community}
                layout={layout}
                colors={visualTheme.colors}
                visualTheme={visualTheme}
                reduceMotion={reduceMotion}
                selected={selectedCommunity?.id === community.id}
                onPress={() =>
                  setSelectedCommunity(community, visualTheme.colors)
                }
              />
            );
          })}
        </>
      ) : loading ? (
        <View style={[styles.empty, fullScreen ? styles.emptyFull : null]}>
          <Text style={styles.emptyTitle}>Cargando galaxia...</Text>
          <Text style={styles.emptyCopy}>
            Estamos ubicando las Orbitas activas.
          </Text>
        </View>
      ) : (
        <View style={[styles.empty, fullScreen ? styles.emptyFull : null]}>
          <NexoMascot size={compact ? 102 : 132} />
          <Text style={styles.emptyTitle}>Todavia no hay Orbitas activas</Text>
          <Text style={styles.emptyCopy}>
            Crea el primer planeta de esta galaxia y empieza a reunir gente.
          </Text>
          <Button
            title="Crear comunidad"
            size="sm"
            onPress={onCreateCommunity}
          />
        </View>
      )}

      {!compact && selectedCommunity && !isControlled ? (
        <OrbitDetailPanel
          community={selectedCommunity}
          colors={selectedColors}
          compact={compact}
          blurTargetRef={blurTargetRef}
          onClose={() => setSelectedCommunity(null)}
          onEnter={handleOpenCommunity}
          onOpenChat={onOpenChat ? handleOpenChat : undefined}
        />
      ) : null}

      <BottomSheet
        visible={compact && Boolean(selectedCommunity)}
        onClose={() => setSelectedCommunity(null)}
      >
        {selectedCommunity ? (
          <OrbitDetailPanel
            community={selectedCommunity}
            colors={selectedColors}
            compact={compact}
            blurTargetRef={blurTargetRef}
            onClose={() => setSelectedCommunity(null)}
            onEnter={handleOpenCommunity}
            onOpenChat={onOpenChat ? handleOpenChat : undefined}
          />
        ) : null}
      </BottomSheet>
    </View>
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

function PlanetNode({
  community,
  index,
  layout,
  colors,
  visualTheme,
  compact,
  reduceMotion,
  selected,
  onPress,
}: {
  community: GalaxyCommunity;
  index: number;
  layout: PlanetLayout;
  colors: readonly [string, string];
  visualTheme: CommunityVisualTheme;
  compact: boolean;
  reduceMotion: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const float = useRef(new Animated.Value(0)).current;
  const interaction = useRef(new Animated.Value(0)).current;
  const hovered = useRef(false);
  const pressed = useRef(false);
  const initials = getInitials(community.name);
  const compactWidth = Math.max(layout.size + 64, 148);
  const imageUri = community.avatar_url ?? community.banner_url;
  const isSuggested = !community.user_role;
  const isLive = (community.online_count ?? 0) > 0;
  const initialsSize = layout.size >= 112 ? 32 : layout.size >= 92 ? 26 : 22;
  const planetOpacity = isSuggested ? 0.9 : 1;
  const floatDistance = 4 + (index % 3) * 1.2;
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, index % 2 === 0 ? -floatDistance : floatDistance],
  });
  const interactionScale = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1.018 : 1.045],
  });
  const haloBreathScale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1 : 1.08],
  });
  const haloOpacity = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [isSuggested ? 0.24 : 0.38, selected ? 0.7 : 0.56],
  });

  const animateInteraction = (active: boolean) => {
    if (reduceMotion) {
      interaction.setValue(active ? 1 : 0);
      return;
    }

    Animated.spring(interaction, {
      toValue: active ? 1 : 0,
      tension: 180,
      friction: 18,
      useNativeDriver: true,
    }).start();
  };

  const syncInteraction = () => {
    animateInteraction(hovered.current || pressed.current || selected);
  };

  useEffect(() => {
    if (reduceMotion) {
      float.stopAnimation();
      float.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: floatDurations[index % floatDurations.length],
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: floatDurations[index % floatDurations.length],
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const startDelay = setTimeout(
      () => animation.start(),
      floatDelays[index % floatDelays.length],
    );

    return () => {
      clearTimeout(startDelay);
      animation.stop();
    };
  }, [float, index, reduceMotion]);

  useEffect(() => {
    animateInteraction(hovered.current || pressed.current || selected);
  }, [selected, reduceMotion]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir Orbita ${community.name}`}
      onHoverIn={() => {
        hovered.current = true;
        syncInteraction();
      }}
      onHoverOut={() => {
        hovered.current = false;
        syncInteraction();
      }}
      onPressIn={() => {
        pressed.current = true;
        syncInteraction();
      }}
      onPressOut={() => {
        pressed.current = false;
        syncInteraction();
      }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.planetNode,
        compact
          ? {
              top: layout.top,
              left: layout.left,
              width: compactWidth,
              height: layout.size + 54,
              marginLeft: -compactWidth / 2,
            }
          : {
              top: layout.top,
              left: layout.left,
              width: layout.size,
              height: layout.size,
              marginLeft: -layout.size / 2,
              marginTop: -layout.size / 2,
            },
        {
          opacity: pressed ? 0.92 : 1,
        },
        !compact ? pointerStyle : null,
      ]}
    >
      <Animated.View
        style={[
          styles.planetMotion,
          {
            width: layout.size,
            height: layout.size,
            transform: [{ translateY }, { scale: interactionScale }],
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.planetHalo,
            webHaloBlur,
            {
              width: layout.size * 1.3,
              height: layout.size * 1.3,
              borderRadius: (layout.size * 1.3) / 2,
              backgroundColor: colors[0],
              shadowColor: colors[0],
              opacity: haloOpacity,
              transform: [{ scale: haloBreathScale }],
            },
          ]}
        />
        <View
          style={[
            styles.planetWrap,
            {
              width: layout.size,
              height: layout.size,
              borderRadius: layout.size / 2,
              borderColor: "transparent",
              opacity: planetOpacity,
              shadowColor: colors[0],
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.planetImage,
                {
                  width: layout.size,
                  height: layout.size,
                  borderRadius: layout.size / 2,
                },
              ]}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={colors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.planet,
                {
                  width: layout.size,
                  height: layout.size,
                  borderRadius: layout.size / 2,
                },
              ]}
            />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.34)",
              "rgba(255,255,255,0.0)",
              "rgba(7,11,26,0.46)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0.18, y: 0.12 }}
            end={{ x: 0.85, y: 0.92 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.planetSpecular} />
          {!imageUri ? (
            <Text
              pointerEvents="none"
              style={[
                styles.planetInitials,
                { fontSize: initialsSize, lineHeight: initialsSize + 2 },
              ]}
            >
              {initials}
            </Text>
          ) : null}
        </View>

        {/* Label pill integrada (estilo V06): se solapa con la base del planeta */}
        <View
          pointerEvents="none"
          style={[styles.planetLabelWrap, { top: layout.size - 12 }]}
        >
          <View
            style={[
              styles.planetPill,
              {
                borderColor: selected
                  ? visualTheme.accent
                  : "rgba(255,255,255,0.12)",
                shadowColor: selected ? visualTheme.accent : "#000000",
                shadowOpacity: selected ? 0.4 : 0.45,
              },
            ]}
          >
            {isLive ? (
              <View
                style={[
                  styles.planetPillDot,
                  { backgroundColor: theme.colors.success },
                ]}
              />
            ) : null}
            <Text style={styles.planetPillName} numberOfLines={1}>
              {community.name}
            </Text>
          </View>
          <Text style={styles.planetMembers} numberOfLines={1}>
            {isSuggested
              ? "Sugerido"
              : `${formatCompactNumber(community.member_count)} miembros`}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function MobileOrbitNode({
  community,
  index,
  layout,
  colors,
  visualTheme,
  reduceMotion,
  selected,
  onPress,
}: {
  community: GalaxyCommunity;
  index: number;
  layout: PlanetLayout;
  colors: readonly [string, string];
  visualTheme: CommunityVisualTheme;
  reduceMotion: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const float = useRef(new Animated.Value(0)).current;
  const interaction = useRef(new Animated.Value(selected ? 1 : 0)).current;
  const initials = getInitials(community.name);
  const imageUri = community.avatar_url ?? community.banner_url;
  const online = (community.online_count ?? 0) > 0;
  const nodeWidth = Math.max(layout.size + 34, 82);
  const floatDistance = 2.4 + (index % 3) * 0.7;
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, index % 2 === 0 ? -floatDistance : floatDistance],
  });
  const scale = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1.01 : 1.055],
  });
  const haloBreathScale = float.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1 : 1.07],
  });

  const animateInteraction = (active: boolean) => {
    if (reduceMotion) {
      interaction.setValue(active ? 1 : 0);
      return;
    }

    Animated.spring(interaction, {
      toValue: active ? 1 : 0,
      tension: 190,
      friction: 17,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    if (reduceMotion) {
      float.stopAnimation();
      float.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: floatDurations[index % floatDurations.length],
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: floatDurations[index % floatDurations.length],
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const startDelay = setTimeout(
      () => animation.start(),
      floatDelays[index % floatDelays.length],
    );

    return () => {
      clearTimeout(startDelay);
      animation.stop();
    };
  }, [float, index, reduceMotion]);

  useEffect(() => {
    animateInteraction(selected);
  }, [selected, reduceMotion]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${community.name}`}
      onPressIn={() => animateInteraction(true)}
      onPressOut={() => animateInteraction(selected)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.mobilePlanetNode,
        {
          top: layout.top,
          left: layout.left,
          width: nodeWidth,
          marginLeft: -nodeWidth / 2,
          marginTop: -layout.size / 2,
          opacity: pressed ? 0.88 : 1,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.mobilePlanetMotion,
          { transform: [{ translateY }, { scale }] },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.mobilePlanetHalo,
            webHaloBlur,
            {
              width: layout.size * 1.3,
              height: layout.size * 1.3,
              borderRadius: (layout.size * 1.3) / 2,
              backgroundColor: colors[0],
              shadowColor: colors[0],
              transform: [{ scale: haloBreathScale }],
            },
          ]}
        />
        <View
          style={[
            styles.mobilePlanetWrap,
            {
              width: layout.size,
              height: layout.size,
              borderRadius: layout.size / 2,
              borderColor: "transparent",
              shadowColor: colors[0],
            },
          ]}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={[
                styles.planetImage,
                {
                  width: layout.size,
                  height: layout.size,
                  borderRadius: layout.size / 2,
                },
              ]}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={colors}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={[
                styles.planet,
                {
                  width: layout.size,
                  height: layout.size,
                  borderRadius: layout.size / 2,
                },
              ]}
            />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.34)",
              "rgba(255,255,255,0.0)",
              "rgba(7,11,26,0.46)",
            ]}
            locations={[0, 0.5, 1]}
            start={{ x: 0.18, y: 0.12 }}
            end={{ x: 0.85, y: 0.92 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.planetSpecular} />
          <Text pointerEvents="none" style={styles.mobilePlanetInitials}>
            {initials}
          </Text>
        </View>
        <View
          pointerEvents="none"
          style={[
            styles.mobilePlanetPill,
            {
              borderColor: selected
                ? visualTheme.accent
                : "rgba(255,255,255,0.12)",
            },
          ]}
        >
          {online ? (
            <View
              style={[
                styles.planetPillDot,
                { backgroundColor: theme.colors.success },
              ]}
            />
          ) : null}
          <Text style={styles.mobilePlanetPillName} numberOfLines={1}>
            {getCompactOrbitName(community.name)}
          </Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

function MobileOrbitList({
  communities,
  selectedId,
  onSelect,
}: {
  communities: GalaxyCommunity[];
  selectedId: string | undefined;
  onSelect: (community: GalaxyCommunity) => void;
}) {
  const theme = useTheme();

  if (communities.length === 0) {
    return null;
  }

  return (
    <View style={styles.mobileList}>
      <View style={styles.mobileListHeader}>
        <Text style={styles.mobileListTitle}>Orbitas en tu mapa</Text>
        <Text style={styles.mobileListCount}>{communities.length}</Text>
      </View>
      {communities.map((community, index) => {
        const online = community.online_count ?? 0;
        const fallbackColors =
          planetColors[index % planetColors.length] ?? planetColors[0];
        const visualTheme = getCommunityVisualTheme(community, fallbackColors);
        const colors = visualTheme.colors;
        const selected = selectedId === community.id;

        return (
          <Pressable
            key={community.id}
            accessibilityRole="button"
            accessibilityLabel={`Ver detalles de ${community.name}`}
            onPress={() => onSelect(community)}
            style={({ pressed }) => [
              styles.mobileListItem,
              {
                borderColor: selected
                  ? `${visualTheme.accent}B3`
                  : "rgba(255,255,255,0.1)",
                backgroundColor: selected
                  ? `${visualTheme.soft}24`
                  : "rgba(255,255,255,0.06)",
                opacity: pressed ? 0.86 : 1,
                transform: [{ scale: pressed ? 0.985 : 1 }],
              },
            ]}
          >
            <View
              style={[
                styles.mobileListAvatarRing,
                { borderColor: `${visualTheme.accent}70` },
              ]}
            >
              <Avatar
                uri={community.avatar_url}
                label={community.name}
                size={42}
              />
            </View>
            <View style={styles.mobileListCopy}>
              <Text style={styles.mobileListName} numberOfLines={1}>
                {community.name}
              </Text>
              <Text style={styles.mobileListMeta} numberOfLines={1}>
                {community.category ?? "Orbita social"} -{" "}
                {formatCompactNumber(online)} online
              </Text>
            </View>
            <View
              style={[
                styles.mobileListOnline,
                {
                  backgroundColor:
                    online > 0 ? theme.colors.success : theme.colors.textFaint,
                },
              ]}
            />
            <ChevronRight size={17} color="rgba(255,255,255,0.7)" />
          </Pressable>
        );
      })}
    </View>
  );
}

export function OrbitDetailPanel({
  community,
  colors,
  compact,
  blurTargetRef,
  onClose,
  onEnter,
  onOpenChat,
}: {
  community: GalaxyCommunity;
  colors: readonly [string, string];
  compact: boolean;
  blurTargetRef?: RefObject<View | null> | undefined;
  onClose: () => void;
  onEnter: (community: GalaxyCommunity) => void;
  onOpenChat: ((community: GalaxyCommunity) => void) | undefined;
}) {
  const theme = useTheme();
  const orbitType = getOrbitType(community);
  const online = community.online_count ?? 0;
  const canOpenChat = Boolean(community.user_role && onOpenChat);
  const initials = getInitials(community.name);
  const tags = getDetailTags(community, orbitType);
  const tagColors = [
    theme.colors.secondary,
    theme.colors.primary,
    theme.colors.accent,
  ] as const;

  const content = (
    <View
      style={[
        styles.detailContent,
        compact ? styles.detailContentCompact : null,
      ]}
    >
      <View style={styles.detailBanner}>
        {community.banner_url ? (
          <Image
            source={{ uri: community.banner_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <LinearGradient
          pointerEvents="none"
          colors={[
            "rgba(255,255,255,0.24)",
            "rgba(7,11,26,0.04)",
            "rgba(7,11,26,0.3)",
          ]}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cerrar detalle"
        hitSlop={10}
        style={({ pressed }) => [
          styles.detailCloseButton,
          { opacity: pressed ? 0.72 : 1 },
          !compact ? pointerStyle : null,
        ]}
        onPress={onClose}
      >
        <X size={14} color="#FFFFFF" />
      </Pressable>

      <View
        style={[
          styles.detailAvatarOverlap,
          { borderColor: theme.colors.background },
        ]}
      >
        {community.avatar_url ? (
          <Image
            source={{ uri: community.avatar_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={colors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {!community.avatar_url ? (
          <Text style={styles.detailAvatarInitials}>{initials}</Text>
        ) : null}
      </View>

      <View style={styles.detailInfo}>
        <Text style={styles.detailName} numberOfLines={2}>
          {community.name}
        </Text>
        <Text style={[styles.detailHandle, { color: theme.colors.secondary }]}>
          @{community.slug}
        </Text>

        <View style={styles.detailInlineStats}>
          <Text style={styles.detailInlineStatText}>
            {formatCompactNumber(community.member_count)} miembros
          </Text>
          <Text style={styles.detailInlineDivider}>·</Text>
          <View
            style={[
              styles.detailOnlineDot,
              { backgroundColor: theme.colors.success },
            ]}
          />
          <Text style={styles.detailInlineStatText}>
            {formatCompactNumber(online)} online
          </Text>
        </View>

        <View style={styles.detailTags}>
          {tags.map((tag, tagIndex) => {
            const tagColor = tagColors[tagIndex % tagColors.length];

            return (
              <View
                key={`${tag}-${tagIndex}`}
                style={[
                  styles.detailTag,
                  {
                    borderColor: `${tagColor}88`,
                    backgroundColor: `${tagColor}1F`,
                  },
                ]}
              >
                <Text style={[styles.detailTagText, { color: tagColor }]}>
                  {tag}
                </Text>
              </View>
            );
          })}
        </View>

        <Text style={styles.detailDescription} numberOfLines={4}>
          {community.description ??
            "Una Orbita abierta a nuevos ecos, ideas y conversaciones."}
        </Text>
      </View>

      <View
        style={[
          styles.detailFooter,
          compact ? styles.detailFooterCompact : null,
        ]}
      >
        <Button
          title="Entrar a la Orbita"
          size="md"
          gradient={colors}
          iconRight={<ChevronRight size={16} color="#FFFFFF" />}
          style={styles.detailPrimaryButton}
          textStyle={styles.detailPrimaryText}
          onPress={() => onEnter(community)}
        />
        <Button
          title="Abrir chat"
          size="md"
          variant="secondary"
          disabled={!canOpenChat}
          icon={<MessageSquare size={16} color={theme.colors.text} />}
          style={styles.detailSecondaryButton}
          textStyle={styles.detailSecondaryText}
          onPress={() => onOpenChat?.(community)}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver detalle completo"
          onPress={() => onEnter(community)}
          style={({ pressed }) => [
            styles.detailFullLink,
            { opacity: pressed ? 0.64 : 1 },
            !compact ? pointerStyle : null,
          ]}
        >
          <Text style={styles.detailFullLinkText}>Ver detalle completo</Text>
        </Pressable>
      </View>
    </View>
  );

  if (compact) {
    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.detailSheetContent}
      >
        {content}
      </ScrollView>
    );
  }

  return (
    <View style={styles.detailPanelInline}>
      <View
        pointerEvents="none"
        style={[styles.detailPanelGlow, { backgroundColor: colors[1] }]}
      />
      <BlurView
        blurMethod="dimezisBlurViewSdk31Plus"
        blurReductionFactor={3}
        {...(blurTargetRef ? { blurTarget: blurTargetRef } : null)}
        intensity={84}
        tint="dark"
        style={[
          styles.detailPanelGlass,
          {
            backgroundColor: theme.colors.overlay,
            borderColor: "rgba(255,255,255,0.1)",
          },
        ]}
      >
        {content}
      </BlurView>
    </View>
  );
}

function getDetailTags(community: GalaxyCommunity, orbitType: string) {
  return [
    community.category?.trim() || "Orbita social",
    community.user_role ? formatRole(community.user_role) : orbitType,
    formatVisibility(community.visibility),
  ].slice(0, 3);
}

function formatVisibility(visibility: CommunityWithMeta["visibility"]) {
  if (visibility === "private") {
    return "Privada";
  }

  if (visibility === "unlisted") {
    return "Oculta";
  }

  return "Publica";
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getCompactOrbitName(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "Orbita";
  }

  if (words.length === 1) {
    return words[0]!.slice(0, 10);
  }

  return words.slice(0, 2).join(" ").slice(0, 13);
}

function getCommunityVisualTheme(
  community: GalaxyCommunity,
  fallbackColors: readonly [string, string],
): CommunityVisualTheme {
  const category = normalizeCategory(community.category);
  const theme = category ? categoryVisualThemes[category] : undefined;

  if (theme) {
    return theme;
  }

  return {
    colors: fallbackColors,
    accent: "#FFFFFF",
    soft: fallbackColors[0],
    particle: fallbackColors[1],
    ringTilt: "12deg",
  };
}

function normalizeCategory(category: string | null | undefined) {
  return category
    ?.normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function getOrbitType(community: GalaxyCommunity) {
  if (community.user_role) {
    return "Tu Orbita";
  }

  if (isRecentCommunity(community.created_at)) {
    return "Nueva";
  }

  const popularityScore =
    community.member_count + (community.online_count ?? 0) * 4;

  if (popularityScore >= 18) {
    return "Popular";
  }

  return "Recomendada";
}

function isRecentCommunity(createdAt: string) {
  const createdTime = new Date(createdAt).getTime();

  if (Number.isNaN(createdTime)) {
    return false;
  }

  return Date.now() - createdTime < 1000 * 60 * 60 * 24 * 14;
}

function formatRole(role: CommunityWithMeta["user_role"]) {
  if (!role) {
    return "";
  }

  const labels: Record<NonNullable<CommunityWithMeta["user_role"]>, string> = {
    owner: "Owner",
    admin: "Admin",
    mod: "Mod",
    helper: "Helper",
    member: "Miembro",
  };

  return labels[role];
}

const styles = StyleSheet.create({
  map: {
    minHeight: 372,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 16,
  },
  mapFull: {
    flex: 1,
    minHeight: 0,
    borderWidth: 0,
    borderRadius: 0,
    marginBottom: 0,
  },
  mapMobileFull: {
    minHeight: 0,
  },
  mobileScroll: {
    flex: 1,
  },
  mobileContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 20,
    gap: 14,
  },
  header: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 24,
    alignItems: "flex-end",
  },
  headerCompact: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 0,
    flexDirection: "column",
    alignItems: "stretch",
  },
  headerCopy: {
    flex: 1,
    maxWidth: 640,
    gap: 8,
  },
  headerCopyCompact: {
    maxWidth: "100%",
  },
  mobileHeader: {
    gap: 10,
  },
  mobileHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  eyebrowText: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  subtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 580,
  },
  statsLine: {
    fontSize: typography.small,
    fontWeight: "600",
    color: "#8490B4",
  },
  statsValue: {
    color: "#F6F7FB",
    fontWeight: "700",
  },
  statsLabel: {
    color: "#8490B4",
    fontWeight: "600",
  },
  mobileOrbitStage: {
    position: "relative",
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(246,247,251,0.11)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(7,11,26,0.24)",
  },
  mobileStageGlow: {
    position: "absolute",
    width: 142,
    height: 142,
    borderRadius: 71,
    left: "50%",
    top: "50%",
    marginLeft: -71,
    marginTop: -71,
    backgroundColor: "rgba(177,140,255,0.08)",
    shadowColor: "#B18CFF",
    shadowOpacity: 0.28,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  mobileOrbitLine: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(246,247,251,0.075)",
    borderRadius: 999,
  },
  mobileOrbitLineOne: {
    width: "112%",
    height: "48%",
    left: "-6%",
    top: "27%",
    transform: [{ rotate: "-12deg" }],
  },
  mobileOrbitLineTwo: {
    width: "76%",
    height: "68%",
    left: "12%",
    top: "16%",
    transform: [{ rotate: "28deg" }],
  },
  planetNode: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  planetMotion: {
    alignItems: "center",
    justifyContent: "center",
  },
  planetHalo: {
    position: "absolute",
    shadowColor: "#18D7FF",
    shadowOpacity: 0.45,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 0 },
  },
  planetWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
    shadowColor: "#18D7FF",
    shadowOpacity: 0.38,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  planet: {
    position: "absolute",
  },
  planetImage: {
    position: "absolute",
  },
  planetInitials: {
    color: "#FFFFFF",
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.42)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  planetSpecular: {
    position: "absolute",
    top: "14%",
    left: "20%",
    width: "30%",
    height: "20%",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.4)",
  },
  planetLabelWrap: {
    position: "absolute",
    left: -60,
    right: -60,
    alignItems: "center",
  },
  planetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: 188,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: "#0D1230",
    shadowColor: "#000000",
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
  },
  planetPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: "#22E6B9",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  planetPillName: {
    flexShrink: 1,
    color: "#F6F7FB",
    fontSize: 12,
    fontWeight: "600",
  },
  planetMembers: {
    marginTop: 6,
    color: "#8490B4",
    fontSize: 10,
    fontWeight: "600",
  },
  mobilePlanetNode: {
    position: "absolute",
    minHeight: 88,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  mobilePlanetMotion: {
    alignItems: "center",
    justifyContent: "center",
  },
  mobilePlanetHalo: {
    position: "absolute",
    top: -8,
    opacity: 0.22,
    shadowColor: "#18D7FF",
    shadowOpacity: 0.32,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 0 },
  },
  mobilePlanetWrap: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    shadowColor: "#18D7FF",
    shadowOpacity: 0.32,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  mobilePlanetInitials: {
    color: "#FFFFFF",
    fontSize: typography.small,
    fontWeight: "900",
  },
  mobilePlanetPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    maxWidth: 116,
    marginTop: -9,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: "#0D1230",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  mobilePlanetPillName: {
    flexShrink: 1,
    color: "#F6F7FB",
    fontSize: 10.5,
    fontWeight: "600",
  },
  mobileList: {
    maxWidth: 560,
    width: "100%",
    alignSelf: "center",
    gap: 8,
    paddingBottom: 4,
  },
  mobileListHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  mobileListTitle: {
    color: "#FFFFFF",
    fontSize: typography.h3,
    fontWeight: "900",
  },
  mobileListCount: {
    color: "rgba(255,255,255,0.6)",
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  mobileListItem: {
    minHeight: 62,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  mobileListAvatarRing: {
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 2,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  mobileListCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  mobileListName: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "900",
  },
  mobileListMeta: {
    color: "rgba(255,255,255,0.64)",
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  mobileListOnline: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  detailPanelInline: {
    width: "100%",
    maxHeight: "100%",
    borderRadius: 24,
    shadowColor: "#18D7FF",
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 16,
  },
  detailPanelGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 24,
    bottom: -18,
    borderRadius: 24,
    opacity: 0.2,
  },
  detailPanelGlass: {
    borderWidth: 1,
    borderRadius: 24,
    overflow: "hidden",
  },
  detailSheetContent: {
    paddingBottom: 4,
  },
  detailContent: {
    position: "relative",
    overflow: "hidden",
  },
  detailContentCompact: {
    borderRadius: 20,
    backgroundColor: "rgba(7,11,26,0.18)",
  },
  detailBanner: {
    height: 108,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  detailCloseButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 4,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
  },
  detailAvatarOverlap: {
    position: "absolute",
    left: 20,
    top: 68,
    zIndex: 3,
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000000",
    shadowOpacity: 0.45,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
  },
  detailAvatarInitials: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.38)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  detailInfo: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 14,
    gap: 10,
  },
  detailName: {
    color: "#FFFFFF",
    fontSize: typography.h2,
    lineHeight: 24,
    fontWeight: "800",
  },
  detailHandle: {
    fontSize: typography.small,
    lineHeight: 17,
    fontWeight: "700",
  },
  detailInlineStats: {
    minHeight: 20,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 2,
  },
  detailInlineStatText: {
    color: "rgba(246,247,251,0.72)",
    fontSize: typography.small,
    fontWeight: "600",
  },
  detailInlineDivider: {
    color: "rgba(132,144,180,0.78)",
    fontSize: typography.small,
    fontWeight: "700",
  },
  detailOnlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowColor: "#22E6B9",
    shadowOpacity: 0.75,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  detailTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 2,
  },
  detailTag: {
    height: 24,
    borderRadius: radius.pill,
    borderWidth: 1,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  detailTagText: {
    fontSize: typography.tiny,
    lineHeight: 13,
    fontWeight: "700",
  },
  detailDescription: {
    color: "rgba(246,247,251,0.74)",
    fontSize: 14,
    lineHeight: 20,
  },
  detailFooter: {
    borderTopWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 16,
    gap: 10,
  },
  detailFooterCompact: {
    marginTop: 4,
  },
  detailPrimaryButton: {
    width: "100%",
    minHeight: 46,
    borderColor: "transparent",
    shadowColor: "#7B5CFF",
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  detailPrimaryText: {
    fontSize: 14,
    fontWeight: "800",
  },
  detailSecondaryButton: {
    width: "100%",
    minHeight: 44,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "rgba(255,255,255,0.14)",
  },
  detailSecondaryText: {
    fontSize: 14,
    fontWeight: "800",
  },
  detailFullLink: {
    minHeight: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  detailFullLinkText: {
    color: "rgba(246,247,251,0.58)",
    fontSize: typography.small,
    fontWeight: "600",
  },
  empty: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 110,
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  mobileEmpty: {
    flex: 1,
    minHeight: 320,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 22,
  },
  emptyFull: {
    top: 0,
    bottom: 0,
    justifyContent: "center",
  },
  emptyTitle: {
    color: "#FFFFFF",
    fontSize: typography.h3,
    fontWeight: "900",
    textAlign: "center",
  },
  emptyCopy: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.small,
    lineHeight: 19,
    textAlign: "center",
    maxWidth: 320,
  },
});
