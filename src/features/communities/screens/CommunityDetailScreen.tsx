import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Flag,
  Info,
  Layers,
  MessagesSquare,
  MessageSquare,
  Plus,
  Settings,
  Sparkles,
  Star,
  Users,
  X,
} from "lucide-react-native";
import { OnlineUsersBar } from "../../../components/community/OnlineUsersBar";
import { RoleBadge } from "../../../components/community/RoleBadge";
import { PostCard } from "../../../components/content/PostCard";
import { ReportModal } from "../../../components/content/ReportModal";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { GradientCard } from "../../../components/ui/GradientCard";
import { LoadingState } from "../../../components/ui/LoadingState";
import { useReducedMotion } from "../../../hooks/useReducedMotion";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityRole, PostWithMeta, ReactionType } from "../../../types/domain";
import { canViewModTools } from "../../../utils/community-permissions";
import { getErrorMessage } from "../../../utils/errors";
import { formatRelativeDate } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  useCommunityChats,
  useCommunityConversationMutation,
} from "../../chat/hooks/useChat";
import { useCreateReportMutation } from "../../moderation/hooks/useModeration";
import {
  useToggleReactionMutation,
  useToggleSavedPostMutation,
} from "../../posts/hooks/usePosts";
import {
  useCommunity,
  useCommunityMembers,
  useCommunityMembership,
  useCommunityPosts,
  useJoinCommunityMutation,
  useLeaveCommunityMutation,
} from "../hooks/useCommunities";
import { FeaturedSignals } from "../components/FeaturedSignals";
import { MembersByRole } from "../components/MembersByRole";
import { OrbitInfoTab } from "../components/OrbitInfoTab";

type CommunitySection =
  | "signals"
  | "featured"
  | "chats"
  | "members"
  | "info"
  | "management";

type Breakpoint = "mobile" | "tablet" | "desktop";

// Coincide con DESKTOP_WIDTH de AppNavigationFrame: a partir de aqui hay sidebar,
// asi que el detalle deja de ser inmersivo (sin flecha atras, ancho completo).
const SIDEBAR_WIDTH = 980;

function bpOf(width: number): Breakpoint {
  return width < 768 ? "mobile" : width < 1100 ? "tablet" : "desktop";
}

export function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const bp = bpOf(width);
  const [activeSection, setActiveSection] = useState<CommunitySection>("signals");
  const [reportPost, setReportPost] = useState<PostWithMeta | null>(null);
  const [reportCommunityOpen, setReportCommunityOpen] = useState(false);
  const community = useCommunity(id);
  const communityId = community.data?.id;
  const membership = useCommunityMembership(communityId, auth.session?.user.id);
  const members = useCommunityMembers(communityId);
  const posts = useCommunityPosts(communityId, auth.session?.user.id);
  const join = useJoinCommunityMutation(communityId ?? "", auth.session?.user.id ?? "");
  const leave = useLeaveCommunityMutation(communityId ?? "", auth.session?.user.id ?? "");
  const chat = useCommunityConversationMutation();
  const reaction = useToggleReactionMutation(auth.session?.user.id);
  const save = useToggleSavedPostMutation(auth.session?.user.id);
  const report = useCreateReportMutation(auth.session?.user.id);

  async function handleOpenLobby() {
    try {
      if (!communityId) {
        return;
      }

      const conversationId = await chat.mutateAsync(communityId);
      router.push({ pathname: "/chat/[id]", params: { id: conversationId } });
    } catch (error) {
      Alert.alert("No se pudo abrir el chat", getErrorMessage(error));
    }
  }

  function handleReact(post: PostWithMeta, nextReaction: ReactionType) {
    reaction.mutate({ post, reaction: nextReaction });
  }

  function handleCreateSignal() {
    if (!community.data) {
      return;
    }

    router.push({
      pathname: "/create",
      params: { communityId: community.data.id },
    });
  }

  function handleOpenPost(post: PostWithMeta) {
    router.push({ pathname: "/post/[id]", params: { id: post.id } });
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/home");
  }

  if (community.isLoading) {
    return <LoadingState label="Entrando en la Orbita..." />;
  }

  if (community.isError || !community.data) {
    return <ErrorState onRetry={() => void community.refetch()} />;
  }

  const role = membership.data?.role ?? community.data.user_role ?? null;
  const isMember = Boolean(membership.data);
  const canManageCommunity = canViewModTools(role);
  const memberRows = members.data ?? [];
  const postRows = posts.data ?? [];
  const latestPost = postRows[0];
  const signalsToday = postRows.length;

  const hasSidebar = width >= SIDEBAR_WIDTH;
  // En mobile, si la Orbita aun no tiene senales, comprime el hero para dar
  // protagonismo al empty state (banner/avatar mas pequenos, sin stats).
  const heroCompact =
    bp === "mobile" && !posts.isLoading && postRows.length === 0;
  const bannerHeight = heroCompact
    ? 124
    : bp === "desktop"
      ? 260
      : bp === "tablet"
        ? 220
        : 200;
  const avatarSize = heroCompact ? 64 : bp === "desktop" ? 96 : bp === "tablet" ? 88 : 80;
  // Desktop topa en 1360 centrado, igual que Home/Discover/Profile; tablet usa
  // todo el ancho; mobile va a ancho completo (la columna nunca cap a < 768).
  const maxWidth = hasSidebar ? 1360 : bp === "tablet" ? "100%" : 860;
  const horizontalPad = hasSidebar ? 36 : bp === "tablet" ? 24 : 16;
  const verticalGap = bp === "desktop" ? 20 : bp === "tablet" ? 16 : 14;
  // Sin posts no hay nada que proteger del FAB: recorta el padding inferior
  // para que el empty state no deje un hueco muerto debajo del CTA.
  const signalsEmpty =
    activeSection === "signals" && !posts.isLoading && postRows.length === 0;
  const listPaddingBottom = (signalsEmpty ? 28 : 128) + insets.bottom;

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenContainer
        contentStyle={[
          styles.screen,
          { maxWidth, paddingHorizontal: horizontalPad },
        ]}
      >
        {hasSidebar ? null : (
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              onPress={handleBack}
              hitSlop={10}
              style={({ pressed, hovered }) => [
                styles.backButton,
                {
                  backgroundColor: hovered
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(18,20,39,0.78)",
                  borderColor: `${theme.colors.secondary}33`,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <ArrowLeft size={20} color={theme.colors.text} />
            </Pressable>
            <Text
              style={[styles.topBarTitle, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {community.data.name}
            </Text>
          </View>
        )}

        <FlatList
          data={activeSection === "signals" ? postRows : []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.list,
            { flexGrow: 1, gap: verticalGap, paddingBottom: listPaddingBottom },
          ]}
          ListHeaderComponent={
            <View style={[styles.header, { gap: verticalGap }]}>
              <CommunityHero
                name={community.data.name}
                description={community.data.description}
                category={community.data.category}
                memberCount={community.data.member_count}
                onlineCount={community.data.online_count}
                avatarUrl={community.data.avatar_url}
                bannerUrl={community.data.banner_url}
                role={role}
                isMember={isMember}
                signalsToday={signalsToday}
                bannerHeight={bannerHeight}
                avatarSize={avatarSize}
                compact={heroCompact}
                horizontal={bp !== "mobile"}
                joinPending={join.isPending || leave.isPending}
                onToggleJoin={() => (isMember ? leave.mutate() : join.mutate())}
                onReportCommunity={() => setReportCommunityOpen(true)}
              />

              <OnlineUsersBar
                members={memberRows}
                onlineCount={community.data.online_count}
              />

              <SectionHeading
                section={activeSection}
                latestPost={latestPost}
                memberCount={memberRows.length}
              />

              {activeSection === "featured" ? (
                <FeaturedSignals
                  posts={postRows}
                  onOpenPost={handleOpenPost}
                  onReact={handleReact}
                  onSave={(post) => save.mutate(post)}
                  onReport={setReportPost}
                />
              ) : activeSection === "chats" ? (
                <CommunityChatsTab communityId={community.data.id} />
              ) : activeSection === "members" ? (
                members.isLoading ? (
                  <LoadingState label="Cargando miembros..." />
                ) : (
                  <MembersByRole members={memberRows} communityId={community.data.id} />
                )
              ) : activeSection === "info" ? (
                <OrbitInfoTab
                  community={community.data}
                  members={memberRows}
                  role={role}
                  onEditCommunity={() =>
                    Alert.alert("Proximamente", "La edicion de la Orbita llega pronto.")
                  }
                  onManageRoles={() =>
                    Alert.alert("Proximamente", "La gestion de roles llega pronto.")
                  }
                />
              ) : activeSection === "management" ? (
                <ManagementPanel />
              ) : null}
            </View>
          }
          ListEmptyComponent={
            activeSection === "signals" ? (
              posts.isLoading ? (
                <LoadingState label="Cargando senales..." />
              ) : (
                <View style={styles.emptyFill}>
                  <AlienEmptyState
                    eyebrow="Senales"
                    title="Esta Orbita esta en silencio"
                    message="Lanza una pregunta, una historia o una recomendacion y deja que la conversacion entre en orbita."
                    accent={theme.colors.secondary}
                    mood="focused"
                    accessory="pencil"
                    cta={{ label: "Crear primera senal", onPress: handleCreateSignal }}
                  />
                </View>
              )
            ) : null
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => handleOpenPost(item)}
              onReact={(nextReaction) => handleReact(item, nextReaction)}
              onSave={() => save.mutate(item)}
              onReport={() => setReportPost(item)}
            />
          )}
        />

        <SectionFab
          active={activeSection}
          canManage={canManageCommunity}
          bottomInset={insets.bottom}
          onSelectSection={setActiveSection}
          onCreateSignal={handleCreateSignal}
          onOpenLobby={handleOpenLobby}
          lobbyPending={chat.isPending}
        />

        <ReportModal
          visible={Boolean(reportPost)}
          onClose={() => setReportPost(null)}
          onSubmitReport={(reason, details) =>
            report.mutateAsync({
              targetType: "post",
              targetId: reportPost?.id ?? "",
              reason,
              details,
            })
          }
        />
        <ReportModal
          visible={reportCommunityOpen}
          onClose={() => setReportCommunityOpen(false)}
          onSubmitReport={(reason, details) =>
            report.mutateAsync({
              targetType: "community",
              targetId: community.data.id,
              reason,
              details,
            })
          }
        />
      </ScreenContainer>
    </>
  );
}

type CommunityHeroProps = {
  name: string;
  description: string | null;
  category: string | null;
  memberCount: number;
  onlineCount: number | null | undefined;
  avatarUrl: string | null;
  bannerUrl: string | null;
  role: CommunityRole | null;
  isMember: boolean;
  signalsToday: number;
  bannerHeight: number;
  avatarSize: number;
  compact?: boolean;
  horizontal: boolean;
  joinPending: boolean;
  onToggleJoin: () => void;
  onReportCommunity: () => void;
};

function CommunityHero({
  name,
  description,
  category,
  memberCount,
  onlineCount,
  avatarUrl,
  bannerUrl,
  role,
  isMember,
  signalsToday,
  bannerHeight,
  avatarSize,
  compact = false,
  horizontal,
  joinPending,
  onToggleJoin,
  onReportCommunity,
}: CommunityHeroProps) {
  const theme = useTheme();
  const ringSize = avatarSize + 16;
  const descriptionText = description ?? "Una comunidad preparada para nuevos ecos.";

  const heroStyle = {
    backgroundColor: "rgba(18,20,39,0.78)",
    borderColor: `${theme.colors.secondary}2E`,
    shadowColor: theme.colors.primary,
  };

  const bannerArt = (
    <View style={[styles.bannerWrap, { height: bannerHeight }]}>
      {bannerUrl ? (
        <Image source={{ uri: bannerUrl }} style={styles.bannerFill} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerFill}
        />
      )}
      <View style={styles.bannerOverlay} />
    </View>
  );

  const avatarBlock = (extraStyle?: StyleProp<ViewStyle>) => (
    <View
      style={[
        styles.avatarLift,
        {
          width: ringSize,
          height: ringSize,
          borderRadius: ringSize / 2,
          backgroundColor: theme.colors.surface,
          borderColor: `${theme.colors.secondary}55`,
          shadowColor: theme.colors.secondary,
        },
        extraStyle,
      ]}
    >
      <Avatar uri={avatarUrl} label={name} size={avatarSize} />
    </View>
  );

  const badgeEls = (
    <>
      <Badge label={category ?? "General"} tone="primary" />
      <Badge label={`${memberCount} miembros`} tone="secondary" />
      <Badge label={`${onlineCount ?? 0} online`} tone="success" />
      {role ? <RoleBadge role={role} /> : null}
    </>
  );

  const statsEls = (
    <>
      <SignalPill
        icon={<Sparkles size={15} color={theme.colors.secondary} />}
        label={`${signalsToday} ${signalsToday === 1 ? "senal" : "senales"}`}
      />
      <SignalPill icon={<Star size={15} color={theme.colors.accent} />} label="Orbita viva" />
    </>
  );

  const actions = (
    <View style={styles.heroActions}>
      <Button
        title={isMember ? "Salir" : "Unirse"}
        variant={isMember ? "danger" : "primary"}
        loading={joinPending}
        icon={isMember ? undefined : <Plus size={17} color="#FFFFFF" />}
        onPress={onToggleJoin}
        style={[
          styles.joinButtonInline,
          isMember
            ? null
            : { backgroundColor: theme.colors.success, borderColor: theme.colors.success },
        ]}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reportar comunidad"
        onPress={onReportCommunity}
        style={({ pressed, hovered }) => [
          styles.reportButton,
          {
            backgroundColor: hovered ? `${theme.colors.warning}1F` : theme.colors.surface,
            borderColor: `${theme.colors.warning}66`,
            opacity: pressed ? 0.8 : 1,
          },
        ]}
      >
        <Flag size={18} color={theme.colors.warning} />
      </Pressable>
    </View>
  );

  if (horizontal) {
    return (
      <View style={[styles.hero, heroStyle]}>
        {bannerArt}
        <View style={[styles.heroBodyRow, { paddingTop: bannerHeight }]}>
          <View style={styles.identityRow}>
            {avatarBlock({ marginTop: -(avatarSize * 0.6) })}
            <View style={styles.identityColLeft}>
              <Text style={styles.orbitLabel}>Orbita</Text>
              <Text style={[styles.name, styles.alignLeft]}>{name}</Text>
              <View style={styles.badgesLeft}>{badgeEls}</View>
            </View>
            {actions}
          </View>
          <View style={styles.heroStatsLeft}>{statsEls}</View>
          <Text style={[styles.description, styles.alignLeft]}>{descriptionText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.hero, heroStyle]}>
      {bannerArt}
      <View style={[styles.heroBody, { marginTop: bannerHeight - avatarSize * 0.5 }]}>
        {avatarBlock()}
        <Text style={styles.orbitLabel}>Orbita</Text>
        <Text style={styles.name}>{name}</Text>
        <View style={styles.badges}>{badgeEls}</View>
        {compact ? null : <View style={styles.heroStats}>{statsEls}</View>}
        <Text style={styles.description}>{descriptionText}</Text>
        {actions}
      </View>
    </View>
  );
}

type SectionHeadingProps = {
  section: CommunitySection;
  latestPost: PostWithMeta | undefined;
  memberCount: number;
};

function SectionHeading({ section, latestPost, memberCount }: SectionHeadingProps) {
  const theme = useTheme();

  if (section === "signals") {
    return (
      <View style={styles.feedHeader}>
        <View style={styles.headingCopy}>
          <Text style={[styles.headingTitle, { color: theme.colors.text }]}>
            Senales recientes
          </Text>
          <Text style={[styles.headingSubtitle, { color: theme.colors.textMuted }]}>
            {latestPost
              ? `Ultima senal ${formatRelativeDate(latestPost.created_at)}`
              : "La primera senal puede salir de aqui."}
          </Text>
        </View>
        <View
          style={[
            styles.feedBadge,
            {
              backgroundColor: `${theme.colors.secondary}14`,
              borderColor: `${theme.colors.secondary}44`,
            },
          ]}
        >
          <Sparkles size={14} color={theme.colors.secondary} />
          <Text style={[styles.feedBadgeText, { color: theme.colors.secondary }]}>Vivo</Text>
        </View>
      </View>
    );
  }

  const copy: Record<
    Exclude<CommunitySection, "signals">,
    { title: string; subtitle: string }
  > = {
    featured: {
      title: "Senales destacadas",
      subtitle: "Las que mas Eco recogieron esta semana",
    },
    chats: { title: "Chats de la Orbita", subtitle: "Lobby y canales de la comunidad" },
    members: { title: "Miembros", subtitle: `${memberCount} en la tripulacion` },
    info: { title: "Sobre la Orbita", subtitle: "Normas, equipo y datos de la comunidad" },
    management: { title: "Gestion", subtitle: "Modera y cuida la salud de la Orbita" },
  };
  const c = copy[section];

  return (
    <View style={styles.headingCopy}>
      <Text style={[styles.headingTitle, { color: theme.colors.text }]}>{c.title}</Text>
      <Text style={[styles.headingSubtitle, { color: theme.colors.textMuted }]}>
        {c.subtitle}
      </Text>
    </View>
  );
}

type SectionFabProps = {
  active: CommunitySection;
  canManage: boolean;
  bottomInset: number;
  onSelectSection: (section: CommunitySection) => void;
  onCreateSignal: () => void;
  onOpenLobby: () => void;
  lobbyPending: boolean;
};

type FabNavItem = {
  value: CommunitySection | "lobby";
  label: string;
  icon: ReactNode;
  hint?: string;
};

function SectionFab({
  active,
  canManage,
  bottomInset,
  onSelectSection,
  onCreateSignal,
  onOpenLobby,
}: SectionFabProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: open ? 1 : 0,
      duration: reducedMotion ? 0 : 180,
      useNativeDriver: true,
    }).start();
  }, [open, anim, reducedMotion]);

  const navItems: FabNavItem[] = [
    { value: "signals", label: "Senales", icon: <Sparkles size={16} color={theme.colors.textMuted} /> },
    { value: "featured", label: "Destacados", icon: <Star size={16} color={theme.colors.textMuted} /> },
    { value: "chats", label: "Chats", icon: <MessagesSquare size={16} color={theme.colors.textMuted} /> },
    {
      value: "lobby",
      label: "Chat principal",
      icon: <MessageSquare size={16} color={theme.colors.textMuted} />,
      hint: "Lobby",
    },
    { value: "members", label: "Miembros", icon: <Users size={16} color={theme.colors.textMuted} /> },
    { value: "info", label: "Info", icon: <Info size={16} color={theme.colors.textMuted} /> },
    ...(canManage
      ? [
          {
            value: "management" as const,
            label: "Gestion",
            icon: <Settings size={16} color={theme.colors.textMuted} />,
          },
        ]
      : []),
  ];

  function pick(item: FabNavItem) {
    if (item.value === "lobby") {
      onOpenLobby();
    } else {
      onSelectSection(item.value);
    }
    setOpen(false);
  }

  const menuTransform = [
    { scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] }) },
    { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
  ];
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "90deg"] });

  return (
    <>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[styles.fabBackdrop, { opacity: anim }]}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
      </Animated.View>

      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[
          styles.fabMenu,
          {
            bottom: bottomInset + 88,
            backgroundColor: "rgba(13,16,38,0.96)",
            borderColor: `${theme.colors.secondary}38`,
            opacity: anim,
            transform: menuTransform,
          },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Crear senal"
          onPress={() => {
            onCreateSignal();
            setOpen(false);
          }}
          style={({ pressed }) => [styles.createItem, { opacity: pressed ? 0.85 : 1 }]}
        >
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.createItemIcon}>
            <Plus size={18} color="#FFFFFF" />
          </View>
          <View style={styles.createItemCopy}>
            <Text style={styles.createItemTitle}>Crear senal</Text>
            <Text style={styles.createItemSub}>Lanza un nuevo eco</Text>
          </View>
        </Pressable>

        <View style={[styles.fabDivider, { backgroundColor: theme.colors.border }]} />

        {navItems.map((item) => {
          const isActive = item.value === active;
          return (
            <Pressable
              key={item.value}
              accessibilityRole="button"
              accessibilityLabel={item.label}
              onPress={() => pick(item)}
              style={({ pressed, hovered }) => [
                styles.fabItem,
                {
                  borderColor: isActive ? `${theme.colors.secondary}66` : "transparent",
                  backgroundColor: isActive
                    ? `${theme.colors.secondary}1F`
                    : hovered || pressed
                      ? "rgba(255,255,255,0.05)"
                      : "transparent",
                },
              ]}
            >
              <View
                style={[
                  styles.fabItemIcon,
                  {
                    backgroundColor: isActive
                      ? `${theme.colors.secondary}29`
                      : "rgba(255,255,255,0.05)",
                  },
                ]}
              >
                {item.icon}
              </View>
              <Text
                style={[
                  styles.fabItemLabel,
                  { color: isActive ? theme.colors.text : theme.colors.textMuted },
                ]}
              >
                {item.label}
              </Text>
              {item.hint ? (
                <View
                  style={[
                    styles.fabHint,
                    {
                      backgroundColor: `${theme.colors.secondary}24`,
                      borderColor: `${theme.colors.secondary}55`,
                    },
                  ]}
                >
                  <Text style={[styles.fabHintText, { color: theme.colors.secondary }]}>
                    {item.hint}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </Animated.View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? "Cerrar secciones" : "Abrir secciones"}
        onPress={() => setOpen((prev) => !prev)}
        style={[styles.fab, { bottom: bottomInset + 16, shadowColor: theme.colors.primary }]}
      >
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={{ transform: [{ rotate }] }}>
          {open ? <X size={24} color="#FFFFFF" /> : <Layers size={24} color="#FFFFFF" />}
        </Animated.View>
      </Pressable>
    </>
  );
}

function SignalPill({ icon, label }: { icon: ReactNode; label: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.signalPill,
        {
          backgroundColor: "rgba(255,255,255,0.07)",
          borderColor: "rgba(255,255,255,0.14)",
        },
      ]}
    >
      {icon}
      <Text style={[styles.signalPillText, { color: theme.colors.text }]}>{label}</Text>
    </View>
  );
}

function ManagementPanel() {
  const theme = useTheme();

  return (
    <GradientCard contentStyle={styles.tabPanel}>
      <View style={styles.panelTitleRow}>
        <Settings size={18} color={theme.colors.secondary} />
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
          Gestion de comunidad
        </Text>
      </View>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
        Revisa reportes, oculta contenido y ayuda a mantener sana esta Orbita.
      </Text>
      <Button
        title="Abrir moderacion"
        variant="secondary"
        size="sm"
        onPress={() => router.push("/moderation")}
      />
    </GradientCard>
  );
}

function CommunityChatsTab({ communityId }: { communityId: string }) {
  const theme = useTheme();
  const chats = useCommunityChats(communityId);
  const list = chats.data ?? [];

  return (
    <View style={styles.chatsTab}>
      <View style={styles.chatsTabHeader}>
        <View style={styles.chatsTabTitleRow}>
          <MessagesSquare size={17} color={theme.colors.secondary} />
          <Text style={[styles.chatsTabTitle, { color: theme.colors.text }]}>
            Chats de la Orbita
          </Text>
        </View>
        {!chats.isLoading && list.length > 0 ? (
          <Button
            title="Crear chat"
            size="sm"
            icon={<Plus size={15} color="#FFFFFF" />}
            onPress={() =>
              router.push({
                pathname: "/chat/create",
                params: { communityId },
              })
            }
          />
        ) : null}
      </View>

      {chats.isLoading ? (
        <Text style={[styles.chatsLoading, { color: theme.colors.textFaint }]}>
          Cargando chats...
        </Text>
      ) : list.length === 0 ? (
        <AlienEmptyState
          eyebrow="Chats"
          title="Ningun canal abierto todavia"
          message="Abre un canal y dale a la tripulacion un sitio donde cruzar senales en tiempo real."
          accent={theme.colors.primary}
          mood="chatty"
          accessory="walkie"
          cta={{
            label: "Crear chat",
            onPress: () =>
              router.push({ pathname: "/chat/create", params: { communityId } }),
          }}
        />
      ) : (
        <View style={styles.chatsList}>
          {list.map((chat) => (
            <Pressable
              key={chat.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir chat ${chat.name ?? "general"}`}
              onPress={() =>
                router.push({ pathname: "/chat/[id]", params: { id: chat.id } })
              }
              style={({ pressed, hovered }) => [
                styles.chatRow,
                {
                  backgroundColor: hovered
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(255,255,255,0.03)",
                  borderColor: chat.is_default
                    ? `${theme.colors.secondary}55`
                    : theme.colors.border,
                  opacity: pressed ? 0.82 : 1,
                },
              ]}
            >
              <Avatar uri={chat.avatar_url} label={chat.name ?? "Chat"} size={42} />
              <View style={styles.chatRowCopy}>
                <View style={styles.chatRowTitleLine}>
                  <Text
                    style={[styles.chatRowTitle, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {chat.name ?? "Sin nombre"}
                  </Text>
                  {chat.is_default ? (
                    <View
                      style={[
                        styles.chatLobbyTag,
                        {
                          backgroundColor: `${theme.colors.secondary}22`,
                          borderColor: `${theme.colors.secondary}66`,
                        },
                      ]}
                    >
                      <Text
                        style={[styles.chatLobbyTagText, { color: theme.colors.secondary }]}
                      >
                        Lobby
                      </Text>
                    </View>
                  ) : null}
                  {chat.visibility === "invite_only" ? (
                    <Text style={[styles.chatRowVisibility, { color: theme.colors.textFaint }]}>
                      · Solo invitacion
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[styles.chatRowDesc, { color: theme.colors.textMuted }]}
                  numberOfLines={2}
                >
                  {chat.description ?? "Sin descripcion."}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    maxWidth: 860,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  topBarTitle: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.h3,
    fontWeight: "900",
  },
  list: {
    gap: 14,
    paddingTop: 4,
  },
  emptyFill: {
    flex: 1,
    justifyContent: "center",
  },
  header: {
    gap: 14,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 22,
    overflow: "hidden",
    shadowOpacity: 0.24,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 10,
  },
  bannerWrap: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
  },
  bannerFill: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    bottom: 0,
    backgroundColor: "rgba(9,10,18,0.2)",
  },
  heroBody: {
    padding: 18,
    alignItems: "center",
    gap: 12,
  },
  heroBodyRow: {
    paddingHorizontal: 22,
    paddingBottom: 22,
    gap: 16,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 14,
  },
  identityColLeft: {
    flex: 1,
    minWidth: 0,
    gap: 6,
    paddingBottom: 4,
  },
  badgesLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  heroStatsLeft: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  alignLeft: {
    textAlign: "left",
  },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  joinButtonInline: {
    minWidth: 140,
  },
  reportButton: {
    width: 48,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarLift: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  orbitLabel: {
    color: "#FFFFFF",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
    opacity: 0.9,
  },
  name: {
    color: "#FFFFFF",
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 32,
    textAlign: "center",
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    justifyContent: "center",
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
  signalPill: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  signalPillText: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  description: {
    color: "rgba(255,255,255,0.82)",
    fontSize: typography.body,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 560,
  },
  headingCopy: {
    gap: 3,
  },
  headingTitle: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  headingSubtitle: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  feedHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  feedBadge: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  feedBadgeText: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  fabBackdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 30,
    backgroundColor: "rgba(5,7,15,0.55)",
  },
  fabMenu: {
    position: "absolute",
    right: 16,
    width: 264,
    zIndex: 32,
    borderRadius: 18,
    borderWidth: 1,
    padding: 10,
    gap: 4,
    shadowColor: "#000000",
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 20 },
    elevation: 18,
  },
  createItem: {
    minHeight: 50,
    borderRadius: 13,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    overflow: "hidden",
  },
  createItemIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  createItemCopy: {
    flex: 1,
    minWidth: 0,
  },
  createItemTitle: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "900",
  },
  createItemSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  fabDivider: {
    height: 1,
    marginVertical: 6,
    marginHorizontal: 4,
  },
  fabItem: {
    minHeight: 44,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  fabItemIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  fabItemLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "800",
  },
  fabHint: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  fabHintText: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  fab: {
    position: "absolute",
    right: 16,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 33,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  panelTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  copy: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  tabPanel: {
    gap: 10,
  },
  chatsTab: {
    gap: 12,
    paddingVertical: 4,
  },
  chatsTabHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  chatsTabTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chatsTabTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  chatsLoading: {
    fontSize: typography.small,
    fontWeight: "600",
    paddingVertical: 12,
    textAlign: "center",
  },
  chatsList: {
    gap: 8,
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
  },
  chatRowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  chatRowTitleLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  chatRowTitle: {
    fontSize: typography.body,
    fontWeight: "900",
    flexShrink: 1,
  },
  chatRowVisibility: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  chatRowDesc: {
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "500",
  },
  chatLobbyTag: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chatLobbyTagText: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
});
