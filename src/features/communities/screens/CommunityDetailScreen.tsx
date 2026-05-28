import { useState, type ReactNode } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Info,
  MessagesSquare,
  MessageSquare,
  Plus,
  Settings,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
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
import { CommunityTabs } from "../../../components/navigation/CommunityTabs";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { PostWithMeta, ReactionType } from "../../../types/domain";
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

type CommunityTab =
  | "signals"
  | "featured"
  | "chats"
  | "members"
  | "info"
  | "management";

const TABS: Array<{ label: string; value: CommunityTab }> = [
  { label: "Senales", value: "signals" },
  { label: "Destacados", value: "featured" },
  { label: "Chats", value: "chats" },
  { label: "Miembros", value: "members" },
  { label: "Info", value: "info" },
];

export function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<CommunityTab>("signals");
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

  async function handleChat() {
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

  if (community.isLoading) {
    return <LoadingState label="Entrando en la Orbita..." />;
  }

  if (community.isError || !community.data) {
    return <ErrorState onRetry={() => void community.refetch()} />;
  }

  const role = membership.data?.role ?? community.data.user_role ?? null;
  const isMember = Boolean(membership.data);
  const canManageCommunity = canViewModTools(role);
  const baseTabs = canManageCommunity
    ? [...TABS, { label: "Gestion", value: "management" as const }]
    : TABS;
  const communityTabs = baseTabs.map((tab) => ({
    ...tab,
    icon: tabIcon(tab.value, activeTab === tab.value, theme),
  }));
  const memberRows = members.data ?? [];
  const postRows = posts.data ?? [];
  const latestPost = postRows[0];
  const signalsToday = postRows.length;

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={[styles.nebulaOne, { backgroundColor: `${theme.colors.primary}18` }]} />
        <View style={[styles.nebulaTwo, { backgroundColor: `${theme.colors.accent}12` }]} />
        <View style={[styles.nebulaThree, { backgroundColor: `${theme.colors.secondary}10` }]} />
        <View style={[styles.spaceDust, { borderColor: `${theme.colors.secondary}20` }]} />
      </View>
      <FlatList
        data={activeTab === "signals" ? postRows : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.hero,
                {
                  backgroundColor: "rgba(18,20,39,0.78)",
                  borderColor: `${theme.colors.secondary}2E`,
                  shadowColor: theme.colors.primary,
                },
              ]}
            >
              {community.data.banner_url ? (
                <Image
                  source={{ uri: community.data.banner_url }}
                  style={styles.bannerImage}
                  contentFit="cover"
                />
              ) : (
                <LinearGradient
                  colors={[
                    theme.colors.primary,
                    theme.colors.secondary,
                    theme.colors.accent,
                  ]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.bannerImage}
                />
              )}
              <LinearGradient
                colors={["rgba(255,255,255,0.08)", "transparent", "rgba(9,10,18,0.38)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bannerTexture}
              />
              <View style={[styles.bannerOrbit, { borderColor: `${theme.colors.secondary}55` }]} />
              <View style={[styles.bannerSparkOne, { backgroundColor: theme.colors.secondary }]} />
              <View style={[styles.bannerSparkTwo, { backgroundColor: theme.colors.accent }]} />
              <View style={styles.bannerOverlay} />
              <View style={styles.heroBody}>
                <View style={styles.identityRow}>
                  <View
                    style={[
                      styles.avatarLift,
                      {
                        backgroundColor: theme.colors.surface,
                        borderColor: `${theme.colors.secondary}55`,
                        shadowColor: theme.colors.secondary,
                      },
                    ]}
                  >
                    <Avatar uri={community.data.avatar_url} label={community.data.name} size={76} />
                  </View>
                  <View style={styles.identityCopy}>
                    <Text style={styles.orbitLabel}>Orbita</Text>
                    <Text style={styles.name} numberOfLines={2}>
                      {community.data.name}
                    </Text>
                    <View style={styles.badges}>
                      <Badge label={community.data.category ?? "General"} tone="primary" />
                      <Badge label={`${community.data.member_count} miembros`} tone="secondary" />
                      <Badge label={`${community.data.online_count ?? 0} online`} tone="success" />
                      {role ? <RoleBadge role={role} /> : null}
                    </View>
                  </View>
                </View>
                <View style={styles.heroStats}>
                  <SignalPill
                    icon={<Sparkles size={15} color={theme.colors.secondary} />}
                    label={`${signalsToday} ${signalsToday === 1 ? "senal" : "senales"}`}
                  />
                  <SignalPill
                    icon={<Star size={15} color={theme.colors.accent} />}
                    label="Orbita viva"
                  />
                </View>
                <Text style={styles.description}>
                  {community.data.description ?? "Una comunidad preparada para nuevos ecos."}
                </Text>
                <View style={styles.actions}>
                  <Button
                    title={isMember ? "Salir" : "Unirse"}
                    variant={isMember ? "secondary" : "primary"}
                    loading={join.isPending || leave.isPending}
                    onPress={() => (isMember ? leave.mutate() : join.mutate())}
                  />
                  <Button
                    title="Crear senal"
                    variant="secondary"
                    icon={<Plus size={17} color={theme.colors.text} />}
                    onPress={handleCreateSignal}
                  />
                  <Button
                    title="Chat"
                    variant="secondary"
                    icon={<MessageSquare size={17} color={theme.colors.text} />}
                    loading={chat.isPending}
                    onPress={handleChat}
                  />
                </View>
              </View>
            </View>

            <OnlineUsersBar
              members={memberRows}
              onlineCount={community.data.online_count}
            />

            <CommunityTabs tabs={communityTabs} value={activeTab} onChange={setActiveTab} />

            {activeTab === "signals" ? (
              <View style={styles.feedHeader}>
                <View>
                  <Text style={[styles.feedTitle, { color: theme.colors.text }]}>
                    Senales recientes
                  </Text>
                  <Text style={[styles.feedSubtitle, { color: theme.colors.textMuted }]}>
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
                  <Text style={[styles.feedBadgeText, { color: theme.colors.secondary }]}>
                    Vivo
                  </Text>
                </View>
              </View>
            ) : activeTab === "featured" ? (
              <FeaturedSignals
                posts={postRows}
                onOpenPost={handleOpenPost}
                onReact={handleReact}
                onSave={(post) => save.mutate(post)}
                onReport={setReportPost}
              />
            ) : activeTab === "chats" ? (
              <CommunityChatsTab communityId={community.data.id} />
            ) : activeTab === "members" ? (
              members.isLoading ? (
                <LoadingState label="Cargando miembros..." />
              ) : (
                <MembersByRole members={memberRows} communityId={community.data.id} />
              )
            ) : activeTab === "info" ? (
              <OrbitInfoTab
                community={community.data}
                members={memberRows}
                role={role}
                onReportCommunity={() => setReportCommunityOpen(true)}
                onEditCommunity={() =>
                  Alert.alert("Proximamente", "La edicion de la Orbita llega pronto.")
                }
                onManageRoles={() =>
                  Alert.alert("Proximamente", "La gestion de roles llega pronto.")
                }
              />
            ) : (
              <ManagementPanel />
            )}
          </View>
        }
        ListEmptyComponent={
          activeTab === "signals" ? (
            posts.isLoading ? (
              <LoadingState label="Cargando senales..." />
            ) : (
              <AlienEmptyState
                title="Esta Orbita esta en silencio"
                message="Lanza una pregunta, historia o recomendacion y activa la conversacion."
                action={<Button title="Crear primera senal" onPress={handleCreateSignal} />}
              />
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
  );
}

function tabIcon(
  value: CommunityTab,
  active: boolean,
  theme: ReturnType<typeof useTheme>,
) {
  const color = active ? "#FFFFFF" : theme.colors.textMuted;

  switch (value) {
    case "signals":
      return <Sparkles size={15} color={color} />;
    case "featured":
      return <Star size={15} color={color} />;
    case "chats":
      return <MessagesSquare size={15} color={color} />;
    case "members":
      return <Users size={15} color={color} />;
    case "info":
      return <Info size={15} color={color} />;
    default:
      return <Settings size={15} color={color} />;
  }
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
      <Text style={[styles.signalPillText, { color: theme.colors.text }]}>
        {label}
      </Text>
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
      </View>

      {chats.isLoading ? (
        <Text style={[styles.chatsLoading, { color: theme.colors.textFaint }]}>
          Cargando chats...
        </Text>
      ) : list.length === 0 ? (
        <AlienEmptyState
          title="Sin chats todavia"
          message="Crea el primer canal para esta Orbita."
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
              <Avatar
                uri={chat.avatar_url}
                label={chat.name ?? "Chat"}
                size={42}
              />
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
                        style={[
                          styles.chatLobbyTagText,
                          { color: theme.colors.secondary },
                        ]}
                      >
                        Lobby
                      </Text>
                    </View>
                  ) : null}
                  {chat.visibility === "invite_only" ? (
                    <Text
                      style={[
                        styles.chatRowVisibility,
                        { color: theme.colors.textFaint },
                      ]}
                    >
                      · Solo invitacion
                    </Text>
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.chatRowDesc,
                    { color: theme.colors.textMuted },
                  ]}
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
    maxWidth: 1180,
  },
  backgroundArt: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    overflow: "hidden",
  },
  nebulaOne: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    top: 20,
    right: -110,
  },
  nebulaTwo: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    bottom: 120,
    left: -130,
  },
  nebulaThree: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    top: "44%",
    right: "20%",
  },
  spaceDust: {
    position: "absolute",
    width: 240,
    height: 92,
    borderWidth: 1,
    borderRadius: 999,
    top: 92,
    left: "22%",
    transform: [{ rotate: "-18deg" }],
  },
  list: {
    gap: 14,
    paddingTop: 10,
    paddingBottom: 34,
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
  bannerImage: {
    height: 196,
    width: "100%",
  },
  bannerTexture: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 196,
  },
  bannerOrbit: {
    position: "absolute",
    width: 260,
    height: 90,
    borderWidth: 2,
    borderRadius: 999,
    top: 42,
    right: -40,
    transform: [{ rotate: "-18deg" }],
  },
  bannerSparkOne: {
    position: "absolute",
    width: 7,
    height: 7,
    borderRadius: 4,
    top: 44,
    right: 90,
  },
  bannerSparkTwo: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    top: 118,
    right: 180,
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 196,
    backgroundColor: "rgba(9,10,18,0.22)",
  },
  heroBody: {
    padding: 16,
    gap: 13,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: -54,
  },
  avatarLift: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
    paddingBottom: 4,
  },
  orbitLabel: {
    color: "#FFFFFF",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  name: {
    color: "#FFFFFF",
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 32,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
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
  feedTitle: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  feedHeader: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  feedSubtitle: {
    marginTop: 3,
    fontSize: typography.small,
    fontWeight: "700",
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
