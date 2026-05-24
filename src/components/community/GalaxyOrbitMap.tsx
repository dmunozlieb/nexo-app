import { useEffect, useRef, useState, type RefObject } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
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
  Calendar,
  ChevronRight,
  FileText,
  MessageSquare,
  Plus,
  Radio,
  Rocket,
  Sparkles,
  Users,
  Wifi,
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

type GalaxyOrbitMapProps = {
  communities: GalaxyCommunity[];
  loading?: boolean;
  fullScreen?: boolean;
  onOpenCommunity: (community: GalaxyCommunity) => void;
  onOpenChat?: (community: GalaxyCommunity) => void;
  onViewPosts?: (community: GalaxyCommunity) => void;
  onCreateCommunity: () => void;
};

type OrbitActivitySignal = {
  id: string;
  label: string;
  color: string;
  icon: "posts" | "chat" | "event" | "mission";
};

const planetLayouts: PlanetLayout[] = [
  { top: "19%", left: "10%", size: 96, label: "right", hue: 0 },
  { top: "47%", left: "27%", size: 136, label: "right", hue: 1 },
  { top: "20%", left: "58%", size: 116, label: "left", hue: 2 },
  { top: "57%", left: "73%", size: 94, label: "left", hue: 3 },
  { top: "12%", left: "83%", size: 74, label: "left", hue: 4 },
  { top: "69%", left: "11%", size: 84, label: "right", hue: 5 },
];

const compactPlanetLayouts: PlanetLayout[] = [
  { top: "29%", left: "25%", size: 78, label: "bottom", hue: 0 },
  { top: "45%", left: "68%", size: 98, label: "bottom", hue: 1 },
  { top: "57%", left: "29%", size: 86, label: "bottom", hue: 2 },
  { top: "61%", left: "72%", size: 72, label: "bottom", hue: 3 },
];

const planetColors = [
  ["#7C5CFF", "#00D4FF"],
  ["#00D4FF", "#FF4FD8"],
  ["#FF4FD8", "#7C5CFF"],
  ["#37E29F", "#00D4FF"],
  ["#FFB020", "#FF4FD8"],
  ["#9A7BFF", "#37E29F"],
] as const;

const floatDurations = [4800, 5600, 6400, 7200, 8000, 6800] as const;
const floatDelays = [0, 520, 1040, 260, 780, 1300] as const;

const pointerStyle = { cursor: "pointer" } as unknown as ViewStyle;

const stars = [
  { top: "13%", left: "7%", size: 2 },
  { top: "19%", left: "37%", size: 3 },
  { top: "9%", left: "68%", size: 2 },
  { top: "31%", left: "88%", size: 2 },
  { top: "42%", left: "14%", size: 3 },
  { top: "62%", left: "52%", size: 2 },
  { top: "78%", left: "22%", size: 2 },
  { top: "83%", left: "78%", size: 3 },
  { top: "51%", left: "94%", size: 2 },
  { top: "26%", left: "47%", size: 2 },
  { top: "71%", left: "92%", size: 2 },
  { top: "88%", left: "42%", size: 2 },
] as const;

export function GalaxyOrbitMap({
  communities,
  loading = false,
  fullScreen = false,
  onOpenCommunity,
  onOpenChat,
  onViewPosts,
  onCreateCommunity,
}: GalaxyOrbitMapProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const blurTargetRef = useRef<View | null>(null);
  const reduceMotion = useReduceMotion();
  const [selectedCommunity, setSelectedCommunity] =
    useState<GalaxyCommunity | null>(null);
  const compact = width < 720;
  const activeLayouts = compact ? compactPlanetLayouts : planetLayouts;
  const visibleCommunities = communities.slice(0, activeLayouts.length);
  const ambientLayouts = activeLayouts.slice(visibleCommunities.length);
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
  const selectedColors =
    planetColors[
      activeLayouts[selectedIndex]?.hue ?? selectedIndex % planetColors.length
    ] ?? planetColors[0];

  useEffect(() => {
    if (!selectedCommunity) {
      return;
    }

    const nextSelected = communities.find(
      (community) => community.id === selectedCommunity.id,
    );

    if (!nextSelected) {
      setSelectedCommunity(null);
      return;
    }

    setSelectedCommunity(nextSelected);
  }, [communities, selectedCommunity?.id]);

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

  const handleViewPosts = (community: GalaxyCommunity) => {
    setSelectedCommunity(null);
    (onViewPosts ?? onOpenCommunity)(community);
  };

  return (
    <View
      style={[
        styles.map,
        fullScreen ? styles.mapFull : null,
        !fullScreen
          ? {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          : null,
      ]}
    >
      <BlurTargetView
        ref={blurTargetRef}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      >
        <LinearGradient
          colors={["#070811", "#101735", "#1D1646", "#090A12"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View
          style={[
            styles.nebulaOne,
            { backgroundColor: `${theme.colors.primary}38` },
          ]}
        />
        <View
          style={[
            styles.nebulaTwo,
            { backgroundColor: `${theme.colors.accent}30` },
          ]}
        />
        <View
          style={[
            styles.nebulaThree,
            { backgroundColor: `${theme.colors.secondary}24` },
          ]}
        />
        <View style={[styles.orbitRing, styles.orbitRingOne]} />
        <View style={[styles.orbitRing, styles.orbitRingTwo]} />
        <View style={[styles.orbitRing, styles.orbitRingThree]} />
        <View style={[styles.orbitRing, styles.orbitRingFour]} />
        {stars.map((star) => (
          <View
            key={`${star.top}-${star.left}`}
            style={[
              styles.star,
              {
                top: star.top,
                left: star.left,
                width: star.size,
                height: star.size,
                borderRadius: star.size / 2,
              },
            ]}
          />
        ))}
      </BlurTargetView>

      <View style={[styles.header, compact ? styles.headerCompact : null]}>
        <View
          style={[styles.headerCopy, compact ? styles.headerCopyCompact : null]}
        >
          <View style={styles.eyebrow}>
            <Sparkles size={15} color={theme.colors.secondary} />
            <Text
              style={[styles.eyebrowText, { color: theme.colors.secondary }]}
            >
              Galaxia Nexo
            </Text>
          </View>
          <Text style={[styles.title, fullScreen ? styles.titleFull : null]}>
            Tu sistema orbital
          </Text>
          <Text style={styles.subtitle}>
            Tus Orbitas aparecen primero. Si hay huecos, Nexo acerca comunidades
            recomendadas para descubrir.
          </Text>
        </View>
        <Button
          title="Crear Orbita"
          size="sm"
          variant="secondary"
          icon={<Plus size={16} color={theme.colors.text} />}
          style={styles.createButton}
          onPress={onCreateCommunity}
        />
      </View>

      <View style={[styles.stats, compact ? styles.statsCompact : null]}>
        <View style={styles.stat}>
          <Radio size={15} color="#FFFFFF" />
          <Text style={styles.statValue}>{communities.length}</Text>
          <Text style={styles.statLabel}>Orbitas</Text>
        </View>
        <View style={styles.stat}>
          <View style={styles.onlineIconWrap}>
            <View style={styles.onlineDot} />
            <Wifi size={15} color="#FFFFFF" />
          </View>
          <Text style={styles.statValue}>
            {formatCompactNumber(totalOnline)}
          </Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
      </View>

      {visibleCommunities.length > 0 ? (
        <>
          {ambientLayouts.map((layout, index) => (
            <AmbientOrbitSlot
              key={`${layout.top}-${layout.left}`}
              compact={compact}
              layout={layout}
              index={visibleCommunities.length + index}
              colors={
                planetColors[layout.hue % planetColors.length] ??
                planetColors[0]
              }
            />
          ))}
          {visibleCommunities.map((community, index) => {
            const layout = activeLayouts[index]!;

            return (
              <PlanetNode
                key={community.id}
                index={index}
                compact={compact}
                community={community}
                layout={layout}
                colors={
                  planetColors[layout.hue % planetColors.length] ??
                  planetColors[0]
                }
                blurTargetRef={blurTargetRef}
                reduceMotion={reduceMotion}
                selected={selectedCommunity?.id === community.id}
                onPress={() => setSelectedCommunity(community)}
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

      {!compact && selectedCommunity ? (
        <OrbitDetailPanel
          community={selectedCommunity}
          colors={selectedColors}
          compact={compact}
          blurTargetRef={blurTargetRef}
          onClose={() => setSelectedCommunity(null)}
          onEnter={handleOpenCommunity}
          onOpenChat={onOpenChat ? handleOpenChat : undefined}
          onViewPosts={handleViewPosts}
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
            onViewPosts={handleViewPosts}
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

function AmbientOrbitSlot({
  layout,
  colors,
  compact,
  index,
}: {
  layout: PlanetLayout;
  colors: readonly [string, string];
  compact: boolean;
  index: number;
}) {
  const slotSize = Math.max(42, layout.size * 0.52);
  const compactWidth = Math.max(layout.size + 64, 142);

  return (
    <View
      pointerEvents="none"
      style={[
        styles.ambientSlot,
        compact
          ? {
              top: layout.top,
              left: layout.left,
              width: compactWidth,
              marginLeft: -compactWidth / 2,
            }
          : {
              top: layout.top,
              left: layout.left,
            },
      ]}
    >
      <View
        style={[
          styles.ambientSlotHalo,
          {
            width: slotSize * 1.8,
            height: slotSize * 1.8,
            borderRadius: slotSize * 0.9,
            backgroundColor: colors[index % 2],
          },
        ]}
      />
      <View
        style={[
          styles.ambientSlotPlanet,
          {
            width: slotSize,
            height: slotSize,
            borderRadius: slotSize / 2,
            borderColor: `${colors[0]}55`,
          },
        ]}
      >
        <LinearGradient
          colors={[
            `${colors[0]}33`,
            "rgba(255,255,255,0.05)",
            `${colors[1]}22`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

function PlanetNode({
  community,
  index,
  layout,
  colors,
  compact,
  blurTargetRef,
  reduceMotion,
  selected,
  onPress,
}: {
  community: GalaxyCommunity;
  index: number;
  layout: PlanetLayout;
  colors: readonly [string, string];
  compact: boolean;
  blurTargetRef: RefObject<View | null>;
  reduceMotion: boolean;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const float = useRef(new Animated.Value(0)).current;
  const interaction = useRef(new Animated.Value(0)).current;
  const hovered = useRef(false);
  const pressed = useRef(false);
  const initials = community.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const labelBottom = compact || layout.label === "bottom";
  const labelLeft = layout.label === "left";
  const labelWidth = compact ? 178 : 216;
  const compactWidth = Math.max(layout.size + 64, labelWidth);
  const online = community.online_count ?? 0;
  const imageUri = community.avatar_url ?? community.banner_url;
  const orbitType = getOrbitType(community);
  const category = community.category?.trim();
  const members = community.member_count;
  const newPostsCount = community.new_posts_count ?? 0;
  const activitySignals = getActivitySignals(community, theme.colors);
  const floatDistance = 4 + (index % 3) * 1.2;
  const translateY = float.interpolate({
    inputRange: [0, 1],
    outputRange: [0, index % 2 === 0 ? -floatDistance : floatDistance],
  });
  const interactionScale = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1.018 : 1.045],
  });
  const labelLift = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [0, reduceMotion ? 0 : -3],
  });
  const labelGlowOpacity = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.58],
  });
  const planetActiveOpacity = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.92],
  });
  const planetActiveScale = interaction.interpolate({
    inputRange: [0, 1],
    outputRange: [1, reduceMotion ? 1.01 : 1.08],
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
              marginLeft: -compactWidth / 2,
            }
          : {
              top: layout.top,
              left: layout.left,
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
            transform: [{ translateY }, { scale: interactionScale }],
          },
        ]}
      >
        <View
          pointerEvents="none"
          style={[
            styles.planetHalo,
            {
              width: layout.size * 1.22,
              height: layout.size * 1.22,
              borderRadius: (layout.size * 1.22) / 2,
              backgroundColor: colors[0],
            },
          ]}
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.planetActiveRing,
            {
              width: layout.size + 12,
              height: layout.size + 12,
              borderRadius: (layout.size + 12) / 2,
              borderColor: colors[1],
              opacity: planetActiveOpacity,
              shadowColor: colors[1],
              transform: [{ scale: planetActiveScale }],
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
              borderColor: selected
                ? `${colors[1]}CC`
                : "rgba(255,255,255,0.34)",
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
              "rgba(255,255,255,0.24)",
              "rgba(9,10,18,0.08)",
              "rgba(9,10,18,0.34)",
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View pointerEvents="none" style={styles.planetShade} />
          <Text pointerEvents="none" style={styles.planetInitials}>
            {initials}
          </Text>
        </View>
        <Animated.View
          style={[
            styles.planetLabel,
            labelBottom
              ? styles.planetLabelBottom
              : labelLeft
                ? {
                    right: layout.size * 0.72,
                  }
                : {
                    left: layout.size * 0.72,
                  },
            {
              width: labelWidth,
              shadowColor: colors[1],
              transform: [{ translateY: labelLift }],
            },
          ]}
        >
          <Animated.View
            pointerEvents="none"
            style={[
              styles.planetLabelGlow,
              { backgroundColor: colors[1], opacity: labelGlowOpacity },
            ]}
          />
          <BlurView
            blurMethod="dimezisBlurViewSdk31Plus"
            blurReductionFactor={3}
            blurTarget={blurTargetRef}
            intensity={selected ? 88 : 72}
            tint="dark"
            style={[
              styles.planetLabelGlass,
              {
                backgroundColor: theme.colors.overlay,
                borderColor: selected ? colors[1] : `${colors[0]}9C`,
              },
            ]}
          >
            <View
              style={[styles.planetLabelAccent, { backgroundColor: colors[1] }]}
            />
            <View style={styles.planetLabelTop}>
              <Text
                style={[styles.planetName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {community.name}
              </Text>
              <View style={styles.planetTypeRow}>
                <View
                  style={[
                    styles.orbitTypePill,
                    {
                      backgroundColor: `${colors[0]}20`,
                      borderColor: `${colors[1]}66`,
                    },
                  ]}
                >
                  <Text
                    style={[styles.orbitTypeText, { color: colors[1] }]}
                    numberOfLines={1}
                  >
                    {orbitType}
                  </Text>
                </View>
                {category ? (
                  <Text style={styles.planetCategory} numberOfLines={1}>
                    {category}
                  </Text>
                ) : null}
              </View>
            </View>
            <View style={styles.planetMetrics}>
              <View style={styles.planetMetric}>
                <View
                  style={[
                    styles.statusDot,
                    { backgroundColor: theme.colors.success },
                  ]}
                />
                <Wifi size={11} color={theme.colors.success} />
                <Text style={styles.planetMetricText}>
                  {formatCompactNumber(online)} online
                </Text>
              </View>
              {members > 0 ? (
                <>
                  <View style={styles.metricDivider} />
                  <View style={styles.planetMetric}>
                    <Users size={11} color="rgba(255,255,255,0.72)" />
                    <Text style={styles.planetMetricText}>
                      {formatCompactNumber(members)} miembros
                    </Text>
                  </View>
                </>
              ) : null}
            </View>
            {newPostsCount > 0 || activitySignals.length > 0 ? (
              <View style={styles.planetSignalRow}>
                {newPostsCount > 0 ? (
                  <Text style={[styles.planetSignalText, { color: colors[1] }]}>
                    +{formatCompactNumber(newPostsCount)} posts
                  </Text>
                ) : null}
                {activitySignals.slice(0, 1).map((signal) => (
                  <Text
                    key={signal.id}
                    style={[styles.planetSignalText, { color: signal.color }]}
                    numberOfLines={1}
                  >
                    {signal.label}
                  </Text>
                ))}
              </View>
            ) : null}
          </BlurView>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function OrbitDetailPanel({
  community,
  colors,
  compact,
  blurTargetRef,
  onClose,
  onEnter,
  onOpenChat,
  onViewPosts,
}: {
  community: GalaxyCommunity;
  colors: readonly [string, string];
  compact: boolean;
  blurTargetRef: RefObject<View | null>;
  onClose: () => void;
  onEnter: (community: GalaxyCommunity) => void;
  onOpenChat: ((community: GalaxyCommunity) => void) | undefined;
  onViewPosts: (community: GalaxyCommunity) => void;
}) {
  const theme = useTheme();
  const orbitType = getOrbitType(community);
  const online = community.online_count ?? 0;
  const recentPostCount = community.recent_post_count;
  const activitySignals = getActivitySignals(community, theme.colors);
  const canOpenChat = Boolean(community.user_role && onOpenChat);

  const content = (
    <View style={styles.detailContent}>
      <View style={styles.detailHeader}>
        <View
          style={[styles.detailAvatarRing, { borderColor: `${colors[1]}88` }]}
        >
          <Avatar
            uri={community.avatar_url}
            label={community.name}
            size={compact ? 62 : 74}
          />
        </View>
        <View style={styles.detailIdentity}>
          <View style={styles.detailKickerRow}>
            <View
              style={[
                styles.detailTypePill,
                {
                  backgroundColor: `${colors[0]}22`,
                  borderColor: `${colors[1]}70`,
                },
              ]}
            >
              <Text style={[styles.detailTypeText, { color: colors[1] }]}>
                {orbitType}
              </Text>
            </View>
            {community.user_role ? (
              <Text style={styles.detailRoleText}>
                {formatRole(community.user_role)}
              </Text>
            ) : null}
          </View>
          <Text style={styles.detailName} numberOfLines={2}>
            {community.name}
          </Text>
          <Text style={styles.detailCategory} numberOfLines={1}>
            {community.category ?? "Orbita social"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar detalle"
          style={({ pressed }) => [
            styles.detailCloseButton,
            { opacity: pressed ? 0.7 : 1 },
            !compact ? pointerStyle : null,
          ]}
          onPress={onClose}
        >
          <X size={16} color="rgba(255,255,255,0.82)" />
        </Pressable>
      </View>

      <Text style={styles.detailDescription}>
        {community.description ??
          "Una Orbita abierta a nuevos ecos, ideas y conversaciones."}
      </Text>

      <View style={styles.detailStats}>
        <DetailStat
          label="Miembros"
          value={formatCompactNumber(community.member_count)}
        />
        <DetailStat label="Online" value={formatCompactNumber(online)} active />
        <DetailStat
          label="Posts recientes"
          value={
            recentPostCount !== undefined
              ? formatCompactNumber(recentPostCount)
              : "Pronto"
          }
        />
      </View>

      <View style={styles.detailSignals}>
        {activitySignals.length > 0 ? (
          activitySignals.map((signal) => (
            <View
              key={signal.id}
              style={[
                styles.detailSignalPill,
                {
                  borderColor: `${signal.color}66`,
                  backgroundColor: `${signal.color}18`,
                },
              ]}
            >
              <SignalIcon signal={signal} />
              <Text style={[styles.detailSignalText, { color: signal.color }]}>
                {signal.label}
              </Text>
            </View>
          ))
        ) : (
          <View style={[styles.detailSignalPill, styles.detailSignalIdle]}>
            <Sparkles size={13} color="rgba(255,255,255,0.72)" />
            <Text style={styles.detailSignalIdleText}>Actividad estable</Text>
          </View>
        )}
      </View>

      <View style={styles.detailActions}>
        <Button
          title="Entrar"
          size="sm"
          icon={<ChevronRight size={16} color="#FFFFFF" />}
          style={[
            styles.detailButton,
            { backgroundColor: colors[0], borderColor: colors[0] },
          ]}
          onPress={() => onEnter(community)}
        />
        <Button
          title="Chat"
          size="sm"
          variant="secondary"
          disabled={!canOpenChat}
          icon={<MessageSquare size={16} color={theme.colors.text} />}
          style={styles.detailButton}
          onPress={() => onOpenChat?.(community)}
        />
        <Button
          title="Ver posts"
          size="sm"
          variant="ghost"
          icon={<FileText size={16} color={theme.colors.text} />}
          style={styles.detailButton}
          onPress={() => onViewPosts(community)}
        />
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
    <View style={styles.detailPanel}>
      <View
        pointerEvents="none"
        style={[styles.detailPanelGlow, { backgroundColor: colors[1] }]}
      />
      <BlurView
        blurMethod="dimezisBlurViewSdk31Plus"
        blurReductionFactor={3}
        blurTarget={blurTargetRef}
        intensity={84}
        tint="dark"
        style={[
          styles.detailPanelGlass,
          {
            backgroundColor: theme.colors.overlay,
            borderColor: `${colors[0]}AA`,
          },
        ]}
      >
        {content}
      </BlurView>
    </View>
  );
}

function DetailStat({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <View style={[styles.detailStat, active ? styles.detailStatActive : null]}>
      <Text style={styles.detailStatValue}>{value}</Text>
      <Text style={styles.detailStatLabel}>{label}</Text>
    </View>
  );
}

function SignalIcon({ signal }: { signal: OrbitActivitySignal }) {
  const iconColor = signal.color;

  if (signal.icon === "posts") {
    return <FileText size={13} color={iconColor} />;
  }

  if (signal.icon === "chat") {
    return <MessageSquare size={13} color={iconColor} />;
  }

  if (signal.icon === "event") {
    return <Calendar size={13} color={iconColor} />;
  }

  return <Rocket size={13} color={iconColor} />;
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

function getActivitySignals(
  community: GalaxyCommunity,
  colors: ReturnType<typeof useTheme>["colors"],
): OrbitActivitySignal[] {
  const signals: OrbitActivitySignal[] = [];
  const newPosts = community.new_posts_count ?? 0;

  if (newPosts > 0) {
    signals.push({
      id: "posts",
      label: `${formatCompactNumber(newPosts)} posts nuevos`,
      color: colors.secondary,
      icon: "posts",
    });
  }

  if (community.active_chat || (community.online_count ?? 0) > 1) {
    signals.push({
      id: "chat",
      label: "Chat activo",
      color: colors.success,
      icon: "chat",
    });
  }

  if (community.event_today) {
    signals.push({
      id: "event",
      label: "Evento hoy",
      color: colors.warning,
      icon: "event",
    });
  }

  if (community.mission_active) {
    signals.push({
      id: "mission",
      label: "Mision activa",
      color: colors.accent,
      icon: "mission",
    });
  }

  return signals;
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
  nebulaOne: {
    position: "absolute",
    width: 420,
    height: 420,
    borderRadius: 210,
    top: -138,
    right: -82,
  },
  nebulaTwo: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    bottom: -142,
    left: -92,
  },
  nebulaThree: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    top: "38%",
    left: "42%",
  },
  orbitRing: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 999,
  },
  orbitRingOne: {
    width: 780,
    height: 258,
    left: "-8%",
    top: "26%",
    transform: [{ rotate: "-17deg" }],
  },
  orbitRingTwo: {
    width: 900,
    height: 322,
    right: "-12%",
    top: "18%",
    transform: [{ rotate: "16deg" }],
  },
  orbitRingThree: {
    width: 640,
    height: 212,
    left: "21%",
    bottom: "15%",
    transform: [{ rotate: "-31deg" }],
  },
  orbitRingFour: {
    width: 520,
    height: 176,
    right: "16%",
    bottom: "30%",
    transform: [{ rotate: "29deg" }],
  },
  star: {
    position: "absolute",
    backgroundColor: "rgba(255,255,255,0.82)",
  },
  header: {
    paddingHorizontal: 26,
    paddingTop: 24,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  headerCompact: {
    paddingHorizontal: 18,
    paddingTop: 18,
    flexDirection: "column",
  },
  headerCopy: {
    flex: 1,
    maxWidth: 640,
    gap: 8,
  },
  headerCopyCompact: {
    maxWidth: "100%",
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
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    color: "#FFFFFF",
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 32,
  },
  titleFull: {
    fontSize: 34,
    lineHeight: 40,
  },
  subtitle: {
    color: "rgba(255,255,255,0.76)",
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 580,
  },
  createButton: {
    backgroundColor: "rgba(255,255,255,0.14)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  stats: {
    position: "absolute",
    left: 26,
    bottom: 24,
    flexDirection: "row",
    gap: 8,
  },
  statsCompact: {
    left: 16,
    right: 16,
    bottom: 14,
    justifyContent: "center",
  },
  stat: {
    minWidth: 92,
    minHeight: 52,
    borderRadius: radius.md,
    backgroundColor: "rgba(9,10,18,0.52)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    gap: 1,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: typography.h3,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.68)",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  onlineIconWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#37E29F",
  },
  ambientSlot: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.5,
  },
  ambientSlotHalo: {
    position: "absolute",
    opacity: 0.12,
    shadowColor: "#00D4FF",
    shadowOpacity: 0.22,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  ambientSlotPlanet: {
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.04)",
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
    opacity: 0.18,
    shadowColor: "#00D4FF",
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  planetActiveRing: {
    position: "absolute",
    borderWidth: 1,
    shadowOpacity: 0.44,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  planetWrap: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#00D4FF",
    shadowOpacity: 0.32,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
  },
  planet: {
    position: "absolute",
  },
  planetImage: {
    position: "absolute",
  },
  planetShade: {
    position: "absolute",
    width: "78%",
    height: "78%",
    borderRadius: 999,
    right: -6,
    bottom: -4,
    backgroundColor: "rgba(9,10,18,0.20)",
  },
  planetInitials: {
    color: "#FFFFFF",
    fontSize: typography.h3,
    fontWeight: "900",
  },
  planetLabel: {
    position: "absolute",
    minWidth: 178,
    maxWidth: 236,
    borderRadius: radius.md,
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
  },
  planetLabelBottom: {
    top: "100%",
    marginTop: 10,
    alignItems: "center",
  },
  planetLabelGlow: {
    position: "absolute",
    left: 10,
    right: 10,
    top: 8,
    bottom: -10,
    borderRadius: radius.md,
  },
  planetLabelGlass: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    paddingHorizontal: 13,
    paddingVertical: 11,
    gap: 8,
  },
  planetLabelAccent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    opacity: 0.9,
  },
  planetLabelTop: {
    gap: 5,
  },
  planetName: {
    fontSize: typography.body,
    fontWeight: "900",
    lineHeight: 19,
  },
  planetTypeRow: {
    minHeight: 21,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  orbitTypePill: {
    maxWidth: "62%",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  orbitTypeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  planetCategory: {
    flexShrink: 1,
    color: "rgba(255,255,255,0.62)",
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  planetMetrics: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 7,
  },
  planetMetric: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  planetMetricText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  metricDivider: {
    width: 1,
    height: 11,
    backgroundColor: "rgba(255,255,255,0.16)",
  },
  planetSignalRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
    paddingTop: 1,
  },
  planetSignalText: {
    fontSize: 10,
    fontWeight: "900",
  },
  detailPanel: {
    position: "absolute",
    top: 120,
    right: 24,
    width: 348,
    maxWidth: 360,
    borderRadius: radius.lg,
    shadowColor: "#00D4FF",
    shadowOpacity: 0.34,
    shadowRadius: 26,
    shadowOffset: { width: 0, height: 16 },
    elevation: 16,
  },
  detailPanelGlow: {
    position: "absolute",
    left: 18,
    right: 18,
    top: 12,
    bottom: -16,
    borderRadius: radius.lg,
    opacity: 0.24,
  },
  detailPanelGlass: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    padding: 16,
  },
  detailSheetContent: {
    paddingBottom: 8,
  },
  detailContent: {
    gap: 14,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailAvatarRing: {
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  detailIdentity: {
    flex: 1,
    gap: 4,
  },
  detailKickerRow: {
    minHeight: 22,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailTypePill: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  detailTypeText: {
    fontSize: 9,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0,
  },
  detailRoleText: {
    color: "rgba(255,255,255,0.66)",
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  detailName: {
    color: "#FFFFFF",
    fontSize: typography.h2,
    fontWeight: "900",
    lineHeight: 24,
  },
  detailCategory: {
    color: "rgba(255,255,255,0.64)",
    fontSize: typography.small,
    fontWeight: "800",
  },
  detailCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
  },
  detailDescription: {
    color: "rgba(255,255,255,0.78)",
    fontSize: typography.small,
    lineHeight: 19,
  },
  detailStats: {
    flexDirection: "row",
    gap: 8,
  },
  detailStat: {
    flex: 1,
    minHeight: 58,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.07)",
    justifyContent: "center",
    paddingHorizontal: 10,
    gap: 2,
  },
  detailStatActive: {
    borderColor: "rgba(55,226,159,0.44)",
    backgroundColor: "rgba(55,226,159,0.1)",
  },
  detailStatValue: {
    color: "#FFFFFF",
    fontSize: typography.h3,
    fontWeight: "900",
  },
  detailStatLabel: {
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  detailSignals: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailSignalPill: {
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  detailSignalText: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  detailSignalIdle: {
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  detailSignalIdleText: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  detailActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailButton: {
    flexGrow: 1,
    flexBasis: "30%",
    paddingHorizontal: 10,
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
