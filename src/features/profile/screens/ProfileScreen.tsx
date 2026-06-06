import { useEffect, useRef, useState, type PropsWithChildren, type ReactNode } from "react";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Check,
  Flag,
  MapPin,
  MessageSquare,
  MoreVertical,
  Pencil,
  Shield,
  ShieldOff,
  UserPlus,
  Users,
} from "lucide-react-native";
import { PostCard } from "../../../components/content/PostCard";
import { ReportModal } from "../../../components/content/ReportModal";
import { RoleBadge } from "../../../components/community/RoleBadge";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { NebulaBackdrop } from "../../../components/ui/NebulaBackdrop";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TagPill } from "../../../components/ui/TagPill";
import { radius, typography } from "../../../theme/tokens";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { useTheme } from "../../../theme/useTheme";
import type {
  CommunityWithMeta,
  PostWithMeta,
  ReactionType,
} from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { formatCompactNumber, formatRelativeDate } from "../../../utils/format";
import { getRoleLabel } from "../../../utils/community-permissions";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDirectConversationMutation } from "../../chat/hooks/useChat";
import {
  useCommunityMembers,
  useJoinedCommunities,
} from "../../communities/hooks/useCommunities";
import { useCreateReportMutation } from "../../moderation/hooks/useModeration";
import {
  useToggleReactionMutation,
  useToggleSavedPostMutation,
} from "../../posts/hooks/usePosts";
import {
  useBlockProfileMutation,
  useCommunityProfilePosts,
  useFollowMutation,
  useProfileById,
  useProfilePosts,
  useUnfollowMutation,
} from "../hooks/useProfile";
import { getProfileAccent, type AccentPair } from "../utils/profile-accent";
import { resolveAccent } from "../utils/resolve-accent";
import { ProfileLinks } from "../components/ProfileLinks";
import { CosmicBackground } from "../../../components/ui/CosmicBackground";
import { useStaggerIn } from "../../../hooks/useStaggerIn";

type ProfileScreenProps = {
  profileId?: string;
  communityId?: string | undefined;
};

type TabId = "publicaciones" | "orbitas";

type StatItem = { label: string; value: number | null };

// Bajo este ancho usamos el layout mobile (banner + hero card solapada). Por
// encima, un hero centrado coherente que sirve a tablet y desktop.
const BREAKPOINT_WIDE = 720;

// Color de texto/icono legible sobre el acento (oscuro si el acento es claro,
// blanco si es oscuro). El degradado V2 es brillante -> normalmente texto oscuro.
function onAccentColor(hex: string): string {
  const h = hex.replace("#", "");
  if (h.length < 6) {
    return "#FFFFFF";
  }
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#0A0A16" : "#FFFFFF";
}

function avatarInitials(label: string): string {
  return (label || "NX")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

const CARD_BG = "#0D1230";
const CARD_BORDER = "rgba(255,255,255,0.10)";
const HAIRLINE = "rgba(255,255,255,0.08)";

export function ProfileScreen({ profileId, communityId }: ProfileScreenProps) {
  const auth = useAuth();
  const { width } = useWindowDimensions();
  // <720: una columna a ancho completo (mobile).
  // 720-1100: mismo panel, centrado en una columna ~620 (tablet).
  // >=1100: dos columnas (identidad a la izquierda, contenido a la derecha).
  const isCompact = width < BREAKPOINT_WIDE;
  const isDesktop = width >= 1100;
  const columnMaxWidth = 620;

  const viewedId = profileId ?? auth.session?.user.id;
  const isOwn = viewedId === auth.session?.user.id;
  const contextual = Boolean(communityId);

  const profile = useProfileById(viewedId);
  const globalPosts = useProfilePosts(
    communityId ? undefined : viewedId,
    auth.session?.user.id,
  );
  const communityPosts = useCommunityProfilePosts(
    viewedId,
    communityId,
    auth.session?.user.id,
  );
  const members = useCommunityMembers(communityId);
  const joinedCommunities = useJoinedCommunities(viewedId);
  const posts = communityId ? communityPosts : globalPosts;

  const follow = useFollowMutation(auth.session?.user.id);
  const unfollow = useUnfollowMutation(auth.session?.user.id);
  const directChat = useDirectConversationMutation(auth.session?.user.id);
  const reaction = useToggleReactionMutation(auth.session?.user.id);
  const save = useToggleSavedPostMutation(auth.session?.user.id);
  const report = useCreateReportMutation(auth.session?.user.id);
  const block = useBlockProfileMutation(auth.session?.user.id);

  const [tab, setTab] = useState<TabId>("publicaciones");
  const [following, setFollowing] = useState(false); // TODO(batch 2): leer estado real con isFollowing()
  const [reportVisible, setReportVisible] = useState(false);

  // Orbitas se oculta en contextual; si estabamos ahi, volver a publicaciones.
  useEffect(() => {
    if (contextual && tab === "orbitas") {
      setTab("publicaciones");
    }
  }, [contextual, tab]);

  const accent = resolveAccent({
    id: profile.data?.id ?? viewedId ?? "",
    accent_color: profile.data?.accent_color ?? null,
  });
  const enterHeader = useStaggerIn(0);
  const enterNav = useStaggerIn(1);
  const enterContent = useStaggerIn(2);

  function handleReact(post: PostWithMeta, nextReaction: ReactionType) {
    reaction.mutate({ post, reaction: nextReaction });
  }

  function handleToggleFollow() {
    if (!viewedId) {
      return;
    }
    if (following) {
      unfollow.mutate(viewedId);
      setFollowing(false);
    } else {
      follow.mutate(viewedId);
      setFollowing(true);
    }
  }

  async function handleBlock() {
    try {
      if (!viewedId) {
        return;
      }
      await block.mutateAsync(viewedId);
      Alert.alert(
        "Usuario bloqueado",
        "La visibilidad se actualizara segun las politicas RLS.",
      );
      router.back();
    } catch (error) {
      Alert.alert("No se pudo bloquear", getErrorMessage(error));
    }
  }

  async function handleDirectChat() {
    try {
      if (!viewedId || isOwn) {
        return;
      }
      const conversationId = await directChat.mutateAsync(viewedId);
      router.push({ pathname: "/chat/[id]", params: { id: conversationId } });
    } catch (error) {
      Alert.alert("No se pudo abrir el chat", getErrorMessage(error));
    }
  }

  if (profile.isLoading) {
    return (
      <ProfileShell>
        <View style={styles.fullState}>
          <LoadingState label="Cargando perfil..." />
        </View>
      </ProfileShell>
    );
  }

  if (profile.isError || !profile.data) {
    return (
      <ProfileShell>
        <View style={styles.fullState}>
          <ErrorState
            title="No pudimos cargar este perfil."
            onRetry={() => void profile.refetch()}
          />
        </View>
      </ProfileShell>
    );
  }

  const data = profile.data;
  const displayName = data.display_name ?? data.username;
  const communityMember = (members.data ?? []).find(
    (member) => member.user_id === viewedId,
  );
  const orbits = joinedCommunities.data ?? [];
  const postList = posts.data ?? [];

  const stats: StatItem[] = [
    { label: "Seguidores", value: null }, // TODO(batch 2): servicio de conteo
    { label: "Siguiendo", value: null }, // TODO(batch 2): servicio de conteo
    { label: "Orbitas", value: orbits.length },
    { label: "Publicaciones", value: postList.length },
  ];

  // Ajeno -> solo Publicaciones. Propio -> Orbitas + Publicaciones (Orbitas se
  // oculta en contextual). La descripcion vive en la cabecera, sin tab Info.
  const tabs: Array<{ id: TabId; label: string; count?: number }> = [
    { id: "publicaciones", label: "Publicaciones" },
    isOwn && !contextual
      ? { id: "orbitas", label: "Orbitas", count: orbits.length }
      : null,
  ].filter(Boolean) as Array<{ id: TabId; label: string; count?: number }>;

  const header = (
    <Identity
      data={data}
      displayName={displayName}
      accent={accent}
      isOwn={isOwn}
      contextual={contextual}
      stacked
      centered={false}
      role={communityMember?.role}
      joinedCommunity={communityMember?.joined_at}
      stats={stats}
      following={following}
      followPending={follow.isPending || unfollow.isPending}
      chatPending={directChat.isPending}
      onToggleFollow={handleToggleFollow}
      onMessage={handleDirectChat}
      onBlock={handleBlock}
      onReport={() => setReportVisible(true)}
      onEdit={() => router.push("/settings/edit-profile")}
    />
  );

  const nav =
    tabs.length > 1 ? (
      <SegmentedTabs
        tabs={tabs}
        active={tab}
        accent={accent}
        full
        onChange={setTab}
      />
    ) : contextual ? (
      <ContextChip accent={accent} label="Posts en esta Orbita" />
    ) : null;

  const content = (
    <View style={styles.tabContent}>
      {tab === "orbitas" ? (
        <OrbitsTab
          orbits={orbits}
          loading={joinedCommunities.isLoading}
          isOwn={isOwn}
          accent={accent}
        />
      ) : (
        <PostsTab
          posts={postList}
          loading={posts.isLoading}
          error={posts.isError}
          contextual={contextual}
          accent={accent}
          showTitle={false}
          onRetry={() => void posts.refetch()}
          onOpen={(id) => router.push({ pathname: "/post/[id]", params: { id } })}
          onReact={handleReact}
          onSave={(post) => save.mutate(post)}
          onReport={() => setReportVisible(true)}
        />
      )}
    </View>
  );

  return (
    <>
      <ProfileShell backgroundUri={data.banner_url}>
        {isDesktop ? (
          <View style={styles.twoColOuter}>
            <View style={styles.twoCol}>
              <View style={styles.leftCol}>
                <Animated.View style={enterHeader}>{header}</Animated.View>
              </View>
              <View style={styles.rightCol}>
                <Animated.View style={enterNav}>{nav}</Animated.View>
                <Animated.View style={enterContent}>{content}</Animated.View>
              </View>
            </View>
          </View>
        ) : isCompact ? (
          <>
            <Animated.View style={enterHeader}>{header}</Animated.View>
            {nav ? <Animated.View style={[styles.navMobileWrap, enterNav]}>{nav}</Animated.View> : null}
            <Animated.View style={enterContent}>{content}</Animated.View>
          </>
        ) : (
          <View style={styles.wideOuter}>
            <View style={[styles.wideColumn, { maxWidth: columnMaxWidth }]}>
              <Animated.View style={enterHeader}>{header}</Animated.View>
              {nav ? <Animated.View style={[styles.navWideWrap, enterNav]}>{nav}</Animated.View> : null}
              <Animated.View style={enterContent}>{content}</Animated.View>
            </View>
          </View>
        )}
      </ProfileShell>

      <ReportModal
        visible={reportVisible}
        onClose={() => setReportVisible(false)}
        onSubmitReport={(reason, details) =>
          report.mutateAsync({
            targetType: "profile",
            targetId: viewedId ?? "",
            reason,
            details,
          })
        }
      />
    </>
  );
}

/* ──────────────────────────── Shell (fondo cosmico) ──────────────────────────── */

function ProfileShell({
  children,
  backgroundUri,
}: PropsWithChildren<{ backgroundUri?: string | null }>) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const sidePad = width >= BREAKPOINT_WIDE ? 36 : 18;
  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {backgroundUri ? (
        <NebulaBackdrop source={{ uri: backgroundUri }} dim="rgba(6,7,22,0.72)" />
      ) : (
        <CosmicBackground dim="rgba(6,7,22,0.62)" />
      )}
      <ScreenContainer scroll contentStyle={[styles.screen, { paddingHorizontal: sidePad }]}>
        {children}
      </ScreenContainer>
    </View>
  );
}

function HeaderBadge({ label, color }: { label: string; color: string }) {
  return (
    <View
      style={[
        styles.hBadge,
        { borderColor: `${color}59`, backgroundColor: `${color}1A` },
      ]}
    >
      <Text style={[styles.hBadgeText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

/* ──────────────────────────── Identity (cabecera) ──────────────────────────── */

type IdentityProps = {
  data: NonNullable<ReturnType<typeof useProfileById>["data"]>;
  displayName: string;
  accent: AccentPair;
  isOwn: boolean;
  contextual: boolean;
  stacked: boolean;
  centered: boolean;
  role?: CommunityWithMeta["user_role"] | undefined;
  joinedCommunity?: string | undefined;
  stats: StatItem[];
  following: boolean;
  followPending: boolean;
  chatPending: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onBlock: () => void;
  onReport: () => void;
  onEdit: () => void;
};

function Identity(props: IdentityProps) {
  const {
    data,
    displayName,
    accent,
    isOwn,
    contextual,
    stacked,
    centered,
    role,
    joinedCommunity,
    stats,
    following,
    followPending,
    chatPending,
    onToggleFollow,
    onMessage,
    onBlock,
    onReport,
    onEdit,
  } = props;
  const theme = useTheme();
  const avatarSize = centered ? 104 : 88;

  return (
    <View style={[styles.headerWrap, { paddingTop: avatarSize * 0.5 + 40 }]}>
      <View style={[styles.card, centered ? styles.cardCentered : null]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.cardWash}
          pointerEvents="none"
        />

        {!isOwn ? (
          <View style={styles.cornerMenu}>
            <MoreMenu onReport={onReport} onBlock={onBlock} />
          </View>
        ) : null}

        <View style={[styles.avatarSlot, { marginTop: -(avatarSize * 0.5) }]}>
          <AvatarRing
            uri={data.avatar_url}
            label={displayName}
            accent={accent}
            size={avatarSize}
            online={!isOwn}
          />
        </View>

        <View style={centered ? styles.identityCentered : undefined}>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {displayName}
          </Text>
          <Text style={[styles.handle, { color: accent[0] }]}>
            @{data.username}
          </Text>

          <View style={[styles.badges, centered ? styles.badgesCentered : null]}>
            <HeaderBadge label="Perfil público" color={accent[0]} />
            {contextual && role ? <RoleBadge role={role} /> : null}
            {data.is_banned ? (
              <HeaderBadge label="Baneado" color={theme.colors.error} />
            ) : null}
          </View>

          {data.bio ? (
            <CollapsibleBio bio={data.bio} accent={accent} centered={centered} />
          ) : null}
          <ProfileLinks links={data.links ?? []} accent={accent} />
        </View>

        <StatsBlock stats={stats} centered={centered} />

        <MetaInfo
          accent={accent}
          contextual={contextual}
          role={role}
          isOwn={isOwn}
          joinedNexo={data.created_at}
          joinedCommunity={joinedCommunity}
          centered={centered}
        />

        <View
          style={[
            styles.actionsSlot,
            centered ? styles.actionsCentered : null,
          ]}
        >
          <ProfileActions
            isOwn={isOwn}
            accent={accent}
            following={following}
            followPending={followPending}
            chatPending={chatPending}
            stacked={stacked}
            onToggleFollow={onToggleFollow}
            onMessage={onMessage}
            onEdit={onEdit}
          />
        </View>
      </View>
    </View>
  );
}

function CollapsibleBio({
  bio,
  accent,
  centered,
}: {
  bio: string;
  accent: AccentPair;
  centered: boolean;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(false);
  // Solo ofrecemos "ver mas" cuando la bio es larga (heuristica por longitud).
  const isLong = bio.length > 220;

  return (
    <View>
      <Text
        style={[
          styles.bio,
          { color: theme.colors.text },
          centered ? styles.bioCentered : null,
        ]}
        numberOfLines={expanded ? undefined : 5}
      >
        {bio}
      </Text>
      {isLong ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => setExpanded((value) => !value)}
          style={[hoverTransition, pointerStyle]}
        >
          <Text style={[styles.bioToggle, { color: accent[0] }]}>
            {expanded ? "ver menos" : "ver mas"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function AvatarRing({
  uri,
  label,
  accent,
  size,
  online,
}: {
  uri?: string | null;
  label: string;
  accent: AccentPair;
  size: number;
  online: boolean;
}) {
  const reducedMotion = useReducedMotion();
  const ringSpinValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (reducedMotion) {
      return;
    }
    const loop = Animated.loop(
      Animated.timing(ringSpinValue, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [ringSpinValue, reducedMotion]);
  const ringSpin = ringSpinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });
  const theme = useTheme();
  return (
    <View style={styles.avatarRingWrap}>
      <View
        style={[
          styles.avatarRing,
          { borderRadius: radius.pill, shadowColor: accent[0] },
        ]}
      >
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.pill, overflow: "hidden", transform: reducedMotion ? [] : [{ rotate: ringSpin }] },
          ]}
        >
          <LinearGradient
            colors={accent as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <View
          style={[
            styles.avatarInner,
            { backgroundColor: theme.colors.background, borderRadius: radius.pill },
          ]}
        >
          {uri ? (
            <Avatar uri={uri} label={label} size={size} />
          ) : (
            <LinearGradient
              colors={accent as unknown as readonly [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontWeight: "800",
                  fontSize: size * 0.38,
                  letterSpacing: -0.5,
                }}
              >
                {avatarInitials(label)}
              </Text>
            </LinearGradient>
          )}
        </View>
      </View>
      {online ? (
        <View
          style={[
            styles.onlineDot,
            {
              backgroundColor: theme.colors.success,
              borderColor: theme.colors.background,
            },
          ]}
        />
      ) : null}
    </View>
  );
}

/* ──────────────────────────── Stats (grid 2x2 / fila) ──────────────────────────── */

function StatsBlock({ stats, centered }: { stats: StatItem[]; centered: boolean }) {
  const theme = useTheme();

  return (
    <View style={[styles.statsBlock, centered ? styles.statsBlockCentered : null]}>
      {stats.map((item) => (
        <View
          key={item.label}
          style={[styles.statCell, centered ? styles.statCellCentered : null]}
        >
          <View>
            {item.value == null ? (
              <Text style={[styles.statSoon, { color: theme.colors.textFaint }]}>
                pronto
              </Text>
            ) : null}
            <Text style={[styles.statValue, { color: theme.colors.text }]}>
              {item.value == null ? "—" : formatCompactNumber(item.value)}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.textFaint }]}>
              {item.label}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ──────────────────────────── Meta (se unio / rol) ──────────────────────────── */

function MetaInfo({
  accent,
  contextual,
  role,
  isOwn,
  joinedNexo,
  joinedCommunity,
  centered,
}: {
  accent: AccentPair;
  contextual: boolean;
  role?: CommunityWithMeta["user_role"] | undefined;
  isOwn: boolean;
  joinedNexo: string;
  joinedCommunity?: string | undefined;
  centered: boolean;
}) {
  const theme = useTheme();
  const align = centered ? styles.metaCentered : null;

  return (
    <View style={[styles.metaRows, align]}>
      {isOwn ? <InterestsCta centered={centered} /> : null}

      <View style={[styles.infoRow, align]}>
        <Calendar size={14} color={accent[1]} />
        <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
          Se unio a Nexo {formatRelativeDate(joinedNexo)}
        </Text>
      </View>

      {contextual && joinedCommunity ? (
        <View style={[styles.infoRow, align]}>
          <MapPin size={14} color={accent[0]} />
          <Text style={[styles.metaText, { color: accent[0] }]}>
            En esta Orbita desde {formatRelativeDate(joinedCommunity)}
          </Text>
        </View>
      ) : null}

      {contextual && role ? (
        <View style={[styles.infoRow, align]}>
          <Shield size={14} color={accent[1]} />
          <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
            Rol en esta Orbita: {getRoleLabel(role).toLowerCase()}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

function InterestsCta({ centered }: { centered: boolean }) {
  // TODO(batch 2): leer intereses reales con getUserInterests(userId).
  return (
    <View style={[styles.interests, centered ? styles.interestsCentered : null]}>
      <TagPill
        label="+ Anade tus intereses"
        onPress={() => router.push("/settings/edit-profile")}
      />
    </View>
  );
}

/* ──────────────────────────── Acciones ──────────────────────────── */

type ActionsProps = {
  isOwn: boolean;
  accent: AccentPair;
  following: boolean;
  followPending: boolean;
  chatPending: boolean;
  stacked: boolean;
  onToggleFollow: () => void;
  onMessage: () => void;
  onEdit: () => void;
};

function ProfileActions(props: ActionsProps) {
  const theme = useTheme();
  const {
    isOwn,
    accent,
    following,
    followPending,
    chatPending,
    stacked,
    onToggleFollow,
    onMessage,
    onEdit,
  } = props;

  const flexBtn = stacked ? styles.btnFlex : styles.btnAuto;
  // Tono oscuro suave (no negro) y bold para el texto/icono sobre el degradado.
  const accentFg = "#2A2350";

  if (isOwn) {
    return (
      <View style={styles.actionsRow}>
        <Button
          title="Editar perfil"
          gradient={accent}
          icon={<Pencil size={17} color={accentFg} />}
          textStyle={{ color: accentFg, fontWeight: "800" }}
          onPress={onEdit}
          style={stacked ? styles.btnFull : styles.btnAuto}
        />
      </View>
    );
  }

  return (
    <View style={styles.actionsRow}>
      <Button
        title={following ? "Siguiendo" : "Seguir"}
        variant={following ? "secondary" : "primary"}
        gradient={following ? undefined : accent}
        loading={followPending}
        textStyle={following ? undefined : { color: accentFg, fontWeight: "800" }}
        icon={
          following ? (
            <Check size={17} color={theme.colors.text} />
          ) : (
            <UserPlus size={17} color={accentFg} />
          )
        }
        onPress={onToggleFollow}
        style={flexBtn}
      />
      <Button
        title="Mensaje"
        variant="ghost"
        loading={chatPending}
        icon={<MessageSquare size={17} color={theme.colors.text} />}
        onPress={onMessage}
        style={flexBtn}
      />
    </View>
  );
}

const MENU_WIDTH = 200;

function MoreMenu({ onReport, onBlock }: { onReport: () => void; onBlock: () => void }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<View>(null);

  function openMenu() {
    if (btnRef.current) {
      btnRef.current.measureInWindow((x, y, w, h) => {
        setPos({ top: y + h + 6, left: x + w - MENU_WIDTH });
        setOpen(true);
      });
    } else {
      setOpen(true);
    }
  }

  return (
    <>
      <Pressable
        ref={btnRef}
        accessibilityRole="button"
        accessibilityLabel="Mas acciones"
        onPress={openMenu}
        style={({ pressed, hovered }) => [
          styles.moreBtn,
          hoverTransition,
          pointerStyle,
          {
            backgroundColor: hovered ? "rgba(255,255,255,0.08)" : "transparent",
            opacity: pressed ? 0.6 : 1,
          },
        ]}
      >
        <MoreVertical size={20} color={theme.colors.textMuted} />
      </Pressable>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setOpen(false)}>
          <View
            style={[
              styles.menu,
              {
                top: pos?.top ?? 80,
                left: Math.max(12, pos?.left ?? 12),
                backgroundColor: theme.colors.elevated,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                onReport();
              }}
              style={({ pressed, hovered }) => [
                styles.menuItem,
                hoverTransition,
                pointerStyle,
                {
                  backgroundColor: hovered ? "rgba(255,255,255,0.07)" : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <Flag size={17} color={theme.colors.textMuted} />
              <Text style={[styles.menuText, { color: theme.colors.text }]}>Reportar</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setOpen(false);
                onBlock();
              }}
              style={({ pressed, hovered }) => [
                styles.menuItem,
                hoverTransition,
                pointerStyle,
                {
                  backgroundColor: hovered ? "rgba(255,92,138,0.14)" : "transparent",
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ShieldOff size={17} color={theme.colors.error} />
              <Text style={[styles.menuText, { color: theme.colors.error }]}>Bloquear</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

/* ──────────────────────────── Tabs (control segmentado) ──────────────────────────── */

function SegmentedTabs({
  tabs,
  active,
  accent,
  full,
  onChange,
}: {
  tabs: Array<{ id: TabId; label: string; count?: number }>;
  active: TabId;
  accent: AccentPair;
  full: boolean;
  onChange: (id: TabId) => void;
}) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [trackWidth, setTrackWidth] = useState(0);
  const idx = Math.max(
    0,
    tabs.findIndex((item) => item.id === active),
  );
  const n = tabs.length;
  const anim = useRef(new Animated.Value(idx)).current;

  useEffect(() => {
    if (reducedMotion) {
      anim.setValue(idx);
      return;
    }
    Animated.timing(anim, {
      toValue: idx,
      duration: 280,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    }).start();
  }, [anim, idx, reducedMotion]);

  const pad = 4;
  const onAccent = onAccentColor(accent[0]);
  const segWidth = trackWidth > 0 ? (trackWidth - pad * 2) / n : 0;
  const translateX =
    n > 1 && segWidth > 0
      ? anim.interpolate({
          inputRange: tabs.map((_, i) => i),
          outputRange: tabs.map((_, i) => pad + i * segWidth),
        })
      : pad;

  return (
    <View
      style={[styles.segWrap, full ? styles.segFull : styles.segInline]}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      {segWidth > 0 ? (
        <Animated.View
          style={[
            styles.segThumb,
            { width: segWidth, transform: [{ translateX }] },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={accent as unknown as readonly [string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      ) : null}
      {tabs.map((t) => {
        const selected = t.id === active;
        return (
          <Pressable
            key={t.id}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onChange(t.id)}
            style={[styles.segItem, hoverTransition, pointerStyle]}
          >
            <Text
              style={[
                styles.segText,
                { color: selected ? onAccent : theme.colors.textMuted },
              ]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
            {t.count != null ? (
              <View
                style={[
                  styles.segCount,
                  {
                    backgroundColor: selected
                      ? "rgba(10,10,22,0.16)"
                      : "rgba(255,255,255,0.08)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.segCountText,
                    { color: selected ? onAccent : theme.colors.textFaint },
                  ]}
                >
                  {t.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function ContextChip({ accent, label }: { accent: AccentPair; label: string }) {
  return (
    <View
      style={[
        styles.contextChip,
        { backgroundColor: `${accent[0]}1F`, borderColor: `${accent[0]}66` },
      ]}
    >
      <View style={[styles.contextDot, { backgroundColor: accent[0] }]} />
      <Text style={[styles.contextChipText, { color: accent[0] }]}>{label}</Text>
    </View>
  );
}

/* ──────────────────────────── Contenido por tab ──────────────────────────── */

type PostsTabProps = {
  posts: PostWithMeta[];
  loading: boolean;
  error: boolean;
  contextual: boolean;
  accent: AccentPair;
  showTitle: boolean;
  onRetry: () => void;
  onOpen: (id: string) => void;
  onReact: (post: PostWithMeta, reaction: ReactionType) => void;
  onSave: (post: PostWithMeta) => void;
  onReport: () => void;
};

function PostsTab(props: PostsTabProps) {
  const theme = useTheme();
  const {
    posts,
    loading,
    error,
    contextual,
    accent,
    showTitle,
    onRetry,
    onOpen,
    onReact,
    onSave,
    onReport,
  } = props;
  const title = contextual ? "Posts en esta Orbita" : showTitle ? "Publicaciones" : null;

  if (loading) {
    return <LoadingState label="Cargando publicaciones..." />;
  }
  if (error) {
    return <ErrorState title="No pudimos cargar las publicaciones." onRetry={onRetry} />;
  }
  if (posts.length === 0) {
    return (
      <AlienEmptyState
        accent={accent[0]}
        mood="curious"
        accessory="sparkle"
        title="Sin publicaciones"
        message={
          contextual
            ? "No hay Ecos publicados en esta Orbita todavia."
            : "No hay Ecos publicados aqui todavia."
        }
      />
    );
  }

  return (
    <View style={styles.feed}>
      {title ? (
        <Text style={[styles.feedEyebrow, { color: theme.colors.textFaint }]}>{title}</Text>
      ) : null}
      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPress={() => onOpen(post.id)}
          onReact={(next) => onReact(post, next)}
          onSave={() => onSave(post)}
          onReport={onReport}
        />
      ))}
    </View>
  );
}

function OrbitsTab({
  orbits,
  loading,
  isOwn,
  accent,
}: {
  orbits: CommunityWithMeta[];
  loading: boolean;
  isOwn: boolean;
  accent: AccentPair;
}) {
  if (loading) {
    return <LoadingState label="Cargando orbitas..." />;
  }
  if (orbits.length === 0) {
    if (isOwn) {
      return (
        <AlienEmptyState
          accent={accent[0]}
          mood="friendly"
          accessory="magnifier"
          title="Aun no orbita ninguna comunidad"
          message="Cuando te unas a una Orbita, aparecera aqui."
          cta={{
            label: "Explorar orbitas",
            onPress: () => router.push("/discover"),
          }}
        />
      );
    }
    return (
      <AlienEmptyState
        accent={accent[0]}
        mood="calm"
        title="Aun no orbita ninguna comunidad"
        message="Todavia no se ha unido a ninguna Orbita."
      />
    );
  }
  return (
    <View style={styles.orbitGrid}>
      {orbits.map((orbit) => (
        <OrbitCard key={orbit.id} orbit={orbit} />
      ))}
    </View>
  );
}

function OrbitCard({ orbit }: { orbit: CommunityWithMeta }) {
  const theme = useTheme();
  const accent = getProfileAccent(orbit.id);
  const online = orbit.online_count ?? Math.max(1, Math.ceil((orbit.member_count ?? 0) * 0.3));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir Orbita ${orbit.name}`}
      onPress={() => router.push({ pathname: "/community/[id]", params: { id: orbit.id } })}
      style={({ pressed, hovered }) => [
        styles.orbitCard,
        hoverTransition,
        pointerStyle,
        {
          backgroundColor: CARD_BG,
          borderColor: hovered ? `${accent[0]}70` : CARD_BORDER,
          opacity: pressed ? 0.92 : 1,
          transform: [{ translateY: hovered ? -2 : 0 }],
        },
      ]}
    >
      <View style={styles.orbitBanner}>
        <LinearGradient
          colors={[`${accent[0]}99`, `${accent[1]}55`, "rgba(7,11,26,0.4)"]}
          start={{ x: 0, y: 1 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={styles.orbitBody}>
        <View
          style={[
            styles.orbitAvatarRing,
            { borderColor: accent[0], backgroundColor: theme.colors.surface },
          ]}
        >
          <Avatar uri={orbit.avatar_url} label={orbit.name} size={40} />
        </View>
        <View style={styles.orbitMain}>
          <View style={styles.orbitNameRow}>
            <Text style={[styles.orbitName, { color: theme.colors.text }]} numberOfLines={1}>
              {orbit.name}
            </Text>
            {orbit.category ? (
              <Text style={[styles.orbitCat, { color: theme.colors.textMuted }]}>
                {orbit.category}
              </Text>
            ) : null}
          </View>
          {orbit.description ? (
            <Text style={[styles.orbitDesc, { color: theme.colors.textMuted }]} numberOfLines={3}>
              {orbit.description}
            </Text>
          ) : null}
          <View style={styles.orbitStats}>
            <View style={styles.orbitStat}>
              <Users size={13} color={theme.colors.textFaint} />
              <Text style={[styles.orbitStatText, { color: theme.colors.textFaint }]}>
                {formatCompactNumber(orbit.member_count ?? 0)}
              </Text>
            </View>
            <View style={styles.orbitStat}>
              <View style={[styles.orbitOnlineDot, { backgroundColor: theme.colors.aurora }]} />
              <Text style={[styles.orbitStatText, { color: theme.colors.aurora }]}>
                {formatCompactNumber(online)} en linea
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

/* ──────────────────────────── Styles ──────────────────────────── */

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    // Mismo ancho de contenido que Discover para que la pantalla no se sienta
    // mas estrecha al cambiar de pestana.
    maxWidth: 1360,
    paddingHorizontal: 18,
    paddingBottom: 96,
  },
  fullState: {
    flex: 1,
    justifyContent: "center",
  },

  // Wide (tablet / desktop) centrado
  wideOuter: {
    width: "100%",
    alignItems: "center",
  },
  wideColumn: {
    width: "100%",
  },

  // Desktop: dos columnas (identidad | contenido)
  twoColOuter: {
    width: "100%",
    alignItems: "center",
  },
  twoCol: {
    width: "100%",
    maxWidth: 1360,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 28,
  },
  leftCol: {
    width: 400,
    flexShrink: 0,
  },
  rightCol: {
    flex: 1,
    minWidth: 0,
    // Alinea el contenido con el borde superior de la card de identidad
    // (la card arranca tras el paddingTop del header: avatar 88 -> 88*0.5 + 40).
    paddingTop: 84,
  },
  navWideWrap: {
    marginTop: 24,
    marginBottom: 20,
    alignItems: "center",
  },
  navMobileWrap: {
    marginTop: 16,
    marginBottom: 4,
  },

  // Header
  headerWrap: {
    paddingTop: 8,
  },

  // Glass card (panel del perfil sobre el fondo)
  card: {
    backgroundColor: "#0F1330",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 28,
    paddingHorizontal: 22,
    paddingBottom: 28,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 28,
    elevation: 14,
  },
  cardCentered: {
    alignItems: "center",
    paddingHorizontal: 28,
  },
  cardWash: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  avatarSlot: {
    marginBottom: 12,
  },
  identityCentered: {
    alignItems: "center",
  },

  avatarRingWrap: {
    position: "relative",
    alignSelf: "flex-start",
  },
  avatarRing: {
    padding: 3,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  avatarInner: {
    padding: 2,
  },
  onlineDot: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },

  name: {
    fontSize: typography.h1,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  handle: {
    fontSize: typography.body,
    fontWeight: "700",
    marginTop: 4,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 12,
  },
  badgesCentered: {
    justifyContent: "center",
  },
  hBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  hBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bio: {
    fontSize: 14.5,
    lineHeight: 23,
    marginTop: 14,
  },
  bioCentered: {
    textAlign: "center",
    maxWidth: 520,
  },
  bioToggle: {
    fontSize: typography.small,
    fontWeight: "800",
    marginTop: 6,
  },

  // Stats
  statsBlock: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 18,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: HAIRLINE,
  },
  statsBlockCentered: {
    justifyContent: "center",
    gap: 36,
  },
  statCell: {
    width: "50%",
    marginBottom: 14,
  },
  statCellCentered: {
    width: "auto",
    marginBottom: 0,
    alignItems: "center",
  },
  statValue: {
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  statLabel: {
    fontSize: 12.5,
    fontWeight: "600",
    marginTop: 1,
  },
  statSoon: {
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    marginBottom: 1,
  },

  // Meta
  metaRows: {
    gap: 8,
    marginTop: 16,
  },
  metaCentered: {
    alignItems: "center",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  metaText: {
    fontSize: 13,
    fontWeight: "600",
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  interestsCentered: {
    justifyContent: "center",
  },

  // Actions
  actionsSlot: {
    marginTop: 20,
  },
  actionsCentered: {
    alignItems: "center",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  btnFlex: {
    flex: 1,
  },
  btnFull: {
    flex: 1,
  },
  btnAuto: {
    minWidth: 140,
    paddingHorizontal: 22,
  },
  cornerMenu: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 5,
  },
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  menuBackdrop: {
    flex: 1,
  },
  menu: {
    position: "absolute",
    width: MENU_WIDTH,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 6,
    gap: 2,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 11,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
  },
  menuText: {
    fontSize: typography.body,
    fontWeight: "700",
  },

  // Segmented tabs
  segWrap: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 15,
    backgroundColor: "#12173A",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    position: "relative",
  },
  segFull: {
    width: "100%",
  },
  segInline: {
    alignSelf: "center",
  },
  segThumb: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 11,
    overflow: "hidden",
  },
  segItem: {
    flex: 1,
    minHeight: 40,
    minWidth: 120,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingHorizontal: 16,
    borderRadius: 11,
  },
  segText: {
    fontSize: 14.5,
    fontWeight: "700",
  },
  segCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  segCountText: {
    fontSize: 11,
    fontWeight: "800",
  },

  // Context chip (contextual sin tabs)
  contextChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "center",
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  contextDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  contextChipText: {
    fontSize: 14,
    fontWeight: "700",
  },

  // Content
  tabContent: {
    marginTop: 16,
    minHeight: 240,
  },
  feed: {
    gap: 14,
  },
  feedEyebrow: {
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
  },

  // Orbit grid
  orbitGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
  },
  orbitCard: {
    flexGrow: 1,
    flexBasis: 300,
    minHeight: 212,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  orbitBanner: {
    height: 92,
  },
  orbitBody: {
    flex: 1,
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 14,
    paddingBottom: 18,
    marginTop: -20,
  },
  orbitAvatarRing: {
    borderRadius: radius.pill,
    borderWidth: 2,
    padding: 2,
    alignSelf: "flex-start",
  },
  orbitMain: {
    flex: 1,
    minWidth: 0,
    paddingTop: 22,
  },
  orbitNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  orbitName: {
    flex: 1,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  orbitCat: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  orbitDesc: {
    fontSize: typography.small,
    lineHeight: 19,
    marginTop: 6,
    minHeight: 57,
  },
  orbitStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 10,
  },
  orbitStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  orbitStatText: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  orbitOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
