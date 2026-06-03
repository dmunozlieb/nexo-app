import { useMemo, useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { Sparkles } from "lucide-react-native";
import {
  GalaxyOrbitMap,
  OrbitDetailPanel,
  type PlanetColors,
} from "../../../components/community/GalaxyOrbitMap";
import { ErrorState } from "../../../components/ui/ErrorState";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { CosmicBackground } from "../../../components/ui/CosmicBackground";
import { useTheme } from "../../../theme/useTheme";
import { typography } from "../../../theme/tokens";
import type { CommunityWithMeta } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { formatCompactNumber } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCommunityConversationMutation } from "../../chat/hooks/useChat";
import {
  useCommunities,
  useJoinedCommunities,
} from "../../communities/hooks/useCommunities";
import {
  ActivityColumn,
  ActivityStrip,
  type HomeActivityItem,
} from "../components/HomeActivity";

const DEFAULT_PLANET_COLORS: PlanetColors = ["#7B5CFF", "#18D7FF"];
const HOME_BACKGROUND = require("../../../../assets/orbit-bg-home.png");
const webBlur = { filter: "blur(4px)" };

export function HomeFeedScreen() {
  const auth = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const sidePad = width >= 720 ? 36 : 18;
  const [selected, setSelected] = useState<{
    community: CommunityWithMeta;
    colors: PlanetColors;
  } | null>(null);
  const communities = useCommunities();
  const joinedCommunities = useJoinedCommunities(auth.session?.user.id);
  const chat = useCommunityConversationMutation();
  const joinedRows = joinedCommunities.data ?? [];
  const galaxyCommunities = useMemo(
    () => buildHomeGalaxy(communities.data ?? [], joinedRows),
    [communities.data, joinedRows],
  );
  const activityItems = useMemo(
    () => buildHomeActivity(galaxyCommunities),
    [galaxyCommunities],
  );
  const totalOnline = useMemo(
    () => galaxyCommunities.reduce((sum, c) => sum + (c.online_count ?? 0), 0),
    [galaxyCommunities],
  );
  const isDesktop = width >= 980;
  const showActivityColumn = width >= 1200;
  const showActivityStrip = width < 980;
  const activityColumnWidth = width >= 1440 ? 360 : 320;
  const isLoading = communities.isLoading || joinedCommunities.isLoading;
  const activityState = isLoading
    ? "loading"
    : joinedRows.length === 0
      ? "emptyNoOrbitas"
      : activityItems.length > 0
        ? "ok"
        : "emptyNoActivity";

  async function handleOpenChat(community: CommunityWithMeta) {
    try {
      if (!community.user_role) {
        return;
      }

      const conversationId = await chat.mutateAsync(community.id);
      router.push({ pathname: "/chat/[id]", params: { id: conversationId } });
    } catch (error) {
      Alert.alert("No se pudo abrir el chat", getErrorMessage(error));
    }
  }

  function handleOpenCommunity(community: CommunityWithMeta) {
    router.push({
      pathname: "/community/[id]",
      params: { id: community.id },
    });
  }

  function handleActivityItem(item: HomeActivityItem) {
    handleOpenCommunity(item.community);
  }

  function handleSelectCommunity(
    community: CommunityWithMeta | null,
    colors?: PlanetColors,
  ) {
    setSelected(
      community
        ? { community, colors: colors ?? DEFAULT_PLANET_COLORS }
        : null,
    );
  }

  function handlePanelEnter(community: CommunityWithMeta) {
    setSelected(null);
    handleOpenCommunity(community);
  }

  function handlePanelOpenChat(community: CommunityWithMeta) {
    setSelected(null);
    void handleOpenChat(community);
  }

  if (communities.isError) {
    return (
      <ErrorState
        title="La galaxia no respondio"
        message="Puede que falte configurar Supabase o que no tengas conexion."
        onRetry={() => void communities.refetch()}
      />
    );
  }

  if (isDesktop) {
    return (
      <View style={styles.root}>
        <CosmicBackground source={HOME_BACKGROUND} />
        <ScreenContainer contentStyle={[styles.screen, { paddingHorizontal: sidePad }]}>
          <View style={styles.desktopLayout}>
            {/* Stage: header + mapa */}
            <View style={styles.stagePane}>
              <StageHeader
                orbitas={isLoading ? 0 : galaxyCommunities.length}
                online={isLoading ? 0 : totalOnline}
              />
              <View style={styles.mapCanvas}>
                <GalaxyOrbitMap
                  hideHeader
                  fullScreen
                  communities={galaxyCommunities}
                  loading={isLoading}
                  selectedCommunity={selected?.community ?? null}
                  onSelectCommunity={handleSelectCommunity}
                  onCreateCommunity={() => router.push("/community/create")}
                  onOpenChat={handleOpenChat}
                  onOpenCommunity={handleOpenCommunity}
                />
              </View>
            </View>

            {/* Columna de actividad reciente */}
            {showActivityColumn ? (
              <View style={[styles.activityPane, { width: activityColumnWidth }]}>
                <View
                  style={[
                    styles.activityInner,
                    selected ? styles.activityDimmed : null,
                    selected && Platform.OS === "web"
                      ? (webBlur as object)
                      : null,
                  ]}
                  pointerEvents={selected ? "none" : "auto"}
                >
                  <ActivityColumn
                    items={activityItems}
                    state={activityState}
                    onPressItem={handleActivityItem}
                    onExplore={() => router.push("/discover")}
                    onRetry={() => {
                      void communities.refetch();
                      void joinedCommunities.refetch();
                    }}
                    onViewMore={() => router.push("/discover")}
                  />
                </View>
              </View>
            ) : null}

            {/* Panel de detalle: sobre la columna de actividad, con cierre por backdrop */}
            {selected ? (
              <View
                style={[styles.panelOverlay, { width: activityColumnWidth }]}
              >
                <Pressable
                  style={StyleSheet.absoluteFill}
                  accessibilityLabel="Cerrar detalle"
                  onPress={() => setSelected(null)}
                />
                <View style={styles.panelCardWrap}>
                  <OrbitDetailPanel
                    community={selected.community}
                    colors={selected.colors}
                    compact={false}
                    onClose={() => setSelected(null)}
                    onEnter={handlePanelEnter}
                    onOpenChat={handlePanelOpenChat}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </ScreenContainer>
      </View>
    );
  }

  // Mobile layout
  return (
    <View style={styles.root}>
      <CosmicBackground source={HOME_BACKGROUND} />
      <ScreenContainer contentStyle={styles.screen}>
        <View style={styles.mobileLayout}>
          {/* Header comprimido */}
          <View style={styles.mobileStageHeader}>
            <Text style={[styles.mobileEyebrow, { color: theme.colors.secondary }]}>
              Tu galaxia
            </Text>
            <Text style={styles.mobileStats}>
              <Text style={styles.statsValue}>{isLoading ? "—" : galaxyCommunities.length}</Text>
              <Text style={styles.statsLabel}> · </Text>
              <Text style={styles.statsValue}>{isLoading ? "—" : formatCompactNumber(totalOnline)}</Text>
              <Text style={styles.statsLabel}> online</Text>
            </Text>
          </View>

          {/* Canvas del mapa */}
          <View style={styles.mobileMapCanvas}>
            <GalaxyOrbitMap
              hideHeader
              fullScreen
              communities={galaxyCommunities}
              loading={isLoading}
              selectedCommunity={selected?.community ?? null}
              onSelectCommunity={handleSelectCommunity}
              onCreateCommunity={() => router.push("/community/create")}
              onOpenChat={handleOpenChat}
              onOpenCommunity={handleOpenCommunity}
            />
          </View>

          {/* Strip de actividad */}
          {showActivityStrip ? (
            <View style={styles.mobileActivityStrip}>
              <ActivityStrip
                items={activityItems.slice(0, 6)}
                state={activityState}
                onPressItem={handleActivityItem}
                onExplore={() => router.push("/discover")}
                onRetry={() => {
                  void communities.refetch();
                  void joinedCommunities.refetch();
                }}
                onViewMore={() => router.push("/discover")}
              />
            </View>
          ) : null}
        </View>
      </ScreenContainer>
    </View>
  );
}

function StageHeader({ orbitas, online }: { orbitas: number; online: number }) {
  const theme = useTheme();

  return (
    <View style={styles.stageHeader}>
      <View style={styles.stageHeaderLeft}>
        <View style={styles.eyebrow}>
          <Sparkles size={12} color={theme.colors.secondary} />
          <Text style={[styles.eyebrowText, { color: theme.colors.secondary }]}>
            Tu galaxia
          </Text>
        </View>
        <Text style={styles.stageSubtitle}>
          Esto es lo que orbita a tu alrededor. Toca un planeta y aterriza.
        </Text>
      </View>
      <Text style={styles.desktopStats}>
        <Text style={styles.statsValue}>{orbitas}</Text>
        <Text style={styles.statsLabel}> Orbitas · </Text>
        <Text style={styles.statsValue}>{formatCompactNumber(online)}</Text>
        <Text style={styles.statsLabel}> online</Text>
      </Text>
    </View>
  );
}

function buildHomeGalaxy(
  allCommunities: CommunityWithMeta[],
  joinedCommunities: CommunityWithMeta[],
) {
  const allById = new Map(
    allCommunities.map((community) => [community.id, community]),
  );
  const used = new Set<string>();
  const curated: CommunityWithMeta[] = [];

  for (const joined of joinedCommunities) {
    const full = allById.get(joined.id);
    const community: CommunityWithMeta = {
      ...(full ?? joined),
      user_role: joined.user_role ?? full?.user_role ?? "member",
      member_count:
        joined.member_count > 0
          ? joined.member_count
          : (full?.member_count ?? joined.member_count),
    };
    const onlineCount = joined.online_count ?? full?.online_count;

    if (onlineCount !== undefined) {
      community.online_count = onlineCount;
    }

    curated.push(community);
    used.add(joined.id);
  }

  const recommended = allCommunities
    .filter((community) => !used.has(community.id))
    .sort((a, b) => {
      const scoreA = (a.online_count ?? 0) * 3 + a.member_count;
      const scoreB = (b.online_count ?? 0) * 3 + b.member_count;
      return scoreB - scoreA;
    });

  return [...curated, ...recommended];
}

function buildHomeActivity(communities: CommunityWithMeta[]): HomeActivityItem[] {
  const items: HomeActivityItem[] = [];
  const joined = communities.filter((community) => community.user_role);

  for (const community of joined) {
    const newPosts = community.new_posts_count ?? community.recent_post_count ?? 0;

    if (newPosts > 0) {
      items.push({
        id: `${community.id}:new-posts`,
        kind: "newPosts",
        text: `Hay ${formatCompactNumber(newPosts)} ${
          newPosts === 1 ? "Senal nueva" : "Senales nuevas"
        } en ${community.name}`,
        time: "hoy",
        community,
      });
    }

    if (community.active_chat || (community.online_count ?? 0) > 1) {
      items.push({
        id: `${community.id}:chat`,
        kind: "chat",
        text: `El chat de ${community.name} esta activo ahora.`,
        time:
          (community.online_count ?? 0) > 1
            ? `${formatCompactNumber(community.online_count ?? 0)} online`
            : "ahora",
        community,
      });
    }

    if (community.user_role && community.user_role !== "member") {
      items.push({
        id: `${community.id}:role`,
        kind: "role",
        text: `Eres ${formatHomeRole(community.user_role)} en ${community.name}.`,
        time: "reciente",
        community,
      });
    }
  }

  return items.slice(0, 8);
}

function formatHomeRole(role: NonNullable<CommunityWithMeta["user_role"]>) {
  const labels: Record<NonNullable<CommunityWithMeta["user_role"]>, string> = {
    owner: "owner",
    admin: "admin",
    mod: "mod",
    helper: "helper",
    member: "miembro",
  };

  return labels[role];
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    position: "relative",
  },
  screen: {
    // Mismo tope de contenido que Discover y Profile (el fondo cosmico sigue a
    // pantalla completa por detras; solo se acota el contenido, centrado). El
    // padding horizontal lo aporta el inline `sidePad` (responsive).
    maxWidth: 1360,
    paddingBottom: 0,
  },

  // ── Desktop ──────────────────────────────────────────────────────────────────
  desktopLayout: {
    flex: 1,
    flexDirection: "row",
    minHeight: 0,
    position: "relative",
  },
  stagePane: {
    flex: 1,
    minWidth: 0,
    padding: 24,
    paddingBottom: 24,
    flexDirection: "column",
    gap: 12,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 24,
    paddingHorizontal: 4,
  },
  stageHeaderLeft: {
    flex: 1,
    gap: 6,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
  eyebrowText: {
    fontSize: typography.tiny,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  stageSubtitle: {
    color: "#B9C1D9",
    fontSize: typography.body,
    fontWeight: "500",
    lineHeight: 22,
    maxWidth: 520,
  },
  desktopStats: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  mapCanvas: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    backgroundColor: "rgba(7,11,26,0.24)",
  },
  activityPane: {
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 24,
    paddingLeft: 0,
  },
  activityInner: {
    flex: 1,
  },
  activityDimmed: {
    opacity: 0.45,
  },
  panelOverlay: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 24,
    paddingLeft: 8,
  },
  panelCardWrap: {
    width: "100%",
  },

  // ── Mobile ────────────────────────────────────────────────────────────────────
  mobileLayout: {
    flex: 1,
    flexDirection: "column",
    minHeight: 0,
    width: "100%",
    maxWidth: 680,
    alignSelf: "center",
  },
  mobileStageHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  mobileEyebrow: {
    fontSize: typography.tiny,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  mobileStats: {
    fontSize: 12,
    fontWeight: "600",
  },
  mobileMapCanvas: {
    flex: 1,
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
    overflow: "hidden",
    backgroundColor: "rgba(7,11,26,0.24)",
  },
  mobileActivityStrip: {
    // altura fija controlada por el contenido de ActivityStrip (~116 px)
  },

  // ── Compartidos ───────────────────────────────────────────────────────────────
  statsValue: {
    color: "#F6F7FB",
    fontWeight: "700",
  },
  statsLabel: {
    color: "#8490B4",
    fontWeight: "600",
  },
});
