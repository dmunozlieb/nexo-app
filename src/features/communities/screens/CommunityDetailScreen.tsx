import { useState, type ReactNode } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  CalendarDays,
  Flame,
  MessagesSquare,
  MessageSquare,
  Plus,
  Radio,
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
import type {
  CommunityMemberWithProfile,
  PostWithMeta,
  ReactionType,
} from "../../../types/domain";
import { canViewModTools } from "../../../utils/community-permissions";
import { getErrorMessage } from "../../../utils/errors";
import { formatRelativeDate } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCommunityConversationMutation } from "../../chat/hooks/useChat";
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

type CommunityTab = "posts" | "chats" | "members" | "rules" | "management";

const TABS: Array<{ label: string; value: CommunityTab }> = [
  { label: "Posts", value: "posts" },
  { label: "Chats", value: "chats" },
  { label: "Miembros", value: "members" },
  { label: "Normas", value: "rules" },
];

export function CommunityDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const [activeTab, setActiveTab] = useState<CommunityTab>("posts");
  const [reportPost, setReportPost] = useState<PostWithMeta | null>(null);
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
    icon:
      tab.value === "posts" ? (
        <Sparkles size={15} color={activeTab === tab.value ? "#FFFFFF" : theme.colors.textMuted} />
      ) : tab.value === "chats" ? (
        <MessagesSquare size={15} color={activeTab === tab.value ? "#FFFFFF" : theme.colors.textMuted} />
      ) : tab.value === "members" ? (
        <Users size={15} color={activeTab === tab.value ? "#FFFFFF" : theme.colors.textMuted} />
      ) : tab.value === "rules" ? (
        <ShieldCheck size={15} color={activeTab === tab.value ? "#FFFFFF" : theme.colors.textMuted} />
      ) : (
        <Settings size={15} color={activeTab === tab.value ? "#FFFFFF" : theme.colors.textMuted} />
      ),
  }));
  const rules = Array.isArray(community.data.rules)
    ? (community.data.rules as string[])
    : [];
  const memberRows = members.data ?? [];
  const postRows = posts.data ?? [];
  const latestPost = postRows[0];
  const postsToday = Math.max(1, Math.min(9, postRows.length || 3));
  const weeklyActivity = Math.max(12, (community.data.online_count ?? 4) * 3);

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <View pointerEvents="none" style={styles.backgroundArt}>
        <View style={[styles.nebulaOne, { backgroundColor: `${theme.colors.primary}18` }]} />
        <View style={[styles.nebulaTwo, { backgroundColor: `${theme.colors.accent}12` }]} />
        <View style={[styles.nebulaThree, { backgroundColor: `${theme.colors.secondary}10` }]} />
        <View style={[styles.spaceDust, { borderColor: `${theme.colors.secondary}20` }]} />
      </View>
      <FlatList
        data={activeTab === "posts" ? postRows : []}
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
                    icon={<Flame size={15} color={theme.colors.accent} />}
                    label={`${postsToday} posts nuevos hoy`}
                  />
                  <SignalPill
                    icon={<Radio size={15} color={theme.colors.success} />}
                    label={`${weeklyActivity}% actividad semanal`}
                  />
                  <SignalPill
                    icon={<Star size={15} color={theme.colors.secondary} />}
                    label="Mision semanal activa"
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
                    title="Publicar"
                    variant="secondary"
                    icon={<Plus size={17} color={theme.colors.text} />}
                    onPress={() =>
                      router.push({
                        pathname: "/create",
                        params: { communityId: community.data.id },
                      })
                    }
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

            <View style={styles.liveGrid}>
              <ActivityCard
                icon={<Flame size={18} color={theme.colors.accent} />}
                title="Mision activa"
                value="Lanza un eco y comparte tu mejor teoria."
              />
              <ActivityCard
                icon={<CalendarDays size={18} color={theme.colors.secondary} />}
                title="Evento proximo"
                value="Quedada comunitaria este viernes."
              />
              <ActivityCard
                icon={<ShieldCheck size={18} color={theme.colors.success} />}
                title="Regla destacada"
                value={(rules[0] ?? "Respeta a otras personas.").replace(/\.$/, "")}
              />
            </View>

            {activeTab !== "posts" ? (
              <CommunityTabContent
                tab={activeTab}
                members={memberRows}
                rules={rules}
                onOpenChat={handleChat}
                communityId={community.data.id}
              />
            ) : (
              <View style={styles.feedHeader}>
                <View>
                  <Text style={[styles.feedTitle, { color: theme.colors.text }]}>
                    Ecos recientes
                  </Text>
                  <Text style={[styles.feedSubtitle, { color: theme.colors.textMuted }]}>
                    {latestPost
                      ? `Ultimo eco ${formatRelativeDate(latestPost.created_at)}`
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
            )}
          </View>
        }
        ListEmptyComponent={
          activeTab === "posts" ? (
            posts.isLoading ? (
              <LoadingState label="Cargando publicaciones..." />
            ) : (
              <AlienEmptyState
                title="Esta Orbita esta en silencio"
                message="Publica una pregunta, historia o recomendacion para activar la conversacion."
                action={
                  <Button
                    title="Crear primer eco"
                    onPress={() =>
                      router.push({
                        pathname: "/create",
                        params: { communityId: community.data.id },
                      })
                    }
                  />
                }
              />
            )
          ) : null
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              router.push({ pathname: "/post/[id]", params: { id: item.id } })
            }
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
    </ScreenContainer>
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
      <Text style={[styles.signalPillText, { color: theme.colors.text }]}>
        {label}
      </Text>
    </View>
  );
}

function ActivityCard({
  icon,
  title,
  value,
}: {
  icon: ReactNode;
  title: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.activityCard,
        {
          backgroundColor: "rgba(18,20,39,0.74)",
          borderColor: `${theme.colors.border}CC`,
        },
      ]}
    >
      <View style={[styles.activityIcon, { backgroundColor: `${theme.colors.secondary}12` }]}>
        {icon}
      </View>
      <View style={styles.activityCopy}>
        <Text style={[styles.activityTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        <Text style={[styles.activityValue, { color: theme.colors.textMuted }]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

function CommunityTabContent({
  tab,
  members,
  rules,
  onOpenChat,
  communityId,
}: {
  tab: CommunityTab;
  members: CommunityMemberWithProfile[];
  rules: string[];
  onOpenChat: () => void;
  communityId: string;
}) {
  const theme = useTheme();

  if (tab === "chats") {
    return (
      <GradientCard contentStyle={styles.tabPanel}>
        <View style={styles.panelTitleRow}>
          <MessageSquare size={18} color={theme.colors.secondary} />
          <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
            Sala general
          </Text>
        </View>
        <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
          Canal comunitario preparado para mensajes Realtime. Mas canales pueden llegar despues.
        </Text>
        <Button title="Entrar al chat" onPress={onOpenChat} />
      </GradientCard>
    );
  }

  if (tab === "members") {
    return (
      <View style={styles.membersList}>
        {members.map((member) => {
          const name = member.profile?.display_name ?? member.profile?.username ?? "Usuario";
          return (
            <Pressable
              key={member.user_id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${name}`}
              onPress={() =>
                router.push({
                  pathname: "/profile/[id]",
                  params: { id: member.user_id, communityId },
                })
              }
              style={({ pressed }) => [
                styles.memberRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Avatar uri={member.profile?.avatar_url} label={name} size={44} />
              <View style={styles.memberCopy}>
                <Text style={[styles.memberName, { color: theme.colors.text }]}>{name}</Text>
                <Text style={[styles.memberMeta, { color: theme.colors.textFaint }]}>
                  Unido {formatRelativeDate(member.joined_at)}
                </Text>
              </View>
              <RoleBadge role={member.role} />
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (tab === "rules") {
    return (
      <GradientCard contentStyle={styles.tabPanel}>
        <View style={styles.panelTitleRow}>
          <ShieldCheck size={18} color={theme.colors.success} />
          <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Normas</Text>
        </View>
        {(rules.length ? rules : ["Respeta a otras personas.", "Evita spam."]).map((rule) => (
          <Text key={rule} style={[styles.rule, { color: theme.colors.textMuted }]}>
            {rule}
          </Text>
        ))}
      </GradientCard>
    );
  }

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
  liveGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  activityCard: {
    flexGrow: 1,
    flexBasis: 220,
    minHeight: 78,
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  activityCopy: {
    flex: 1,
    minWidth: 0,
  },
  activityTitle: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  activityValue: {
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "700",
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
  membersList: {
    gap: 10,
  },
  memberRow: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberCopy: {
    flex: 1,
    minWidth: 0,
  },
  memberName: {
    fontSize: typography.body,
    fontWeight: "900",
  },
  memberMeta: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  rule: {
    fontSize: typography.body,
    lineHeight: 21,
  },
});
