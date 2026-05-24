import { useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Info,
  MessageSquare,
  Plus,
  Radio,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { OnlineUsersBar } from "../../../components/community/OnlineUsersBar";
import { RoleBadge } from "../../../components/community/RoleBadge";
import { PostCard } from "../../../components/content/PostCard";
import { ReportModal } from "../../../components/content/ReportModal";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { GradientCard } from "../../../components/ui/GradientCard";
import { LoadingState } from "../../../components/ui/LoadingState";
import { SectionTabs } from "../../../components/ui/SectionTabs";
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

type CommunityTab = "posts" | "chats" | "members" | "rules" | "info";

const TABS: Array<{ label: string; value: CommunityTab }> = [
  { label: "Posts", value: "posts" },
  { label: "Chats", value: "chats" },
  { label: "Miembros", value: "members" },
  { label: "Normas", value: "rules" },
  { label: "Info", value: "info" },
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
  const rules = Array.isArray(community.data.rules)
    ? (community.data.rules as string[])
    : [];
  const memberRows = members.data ?? [];

  return (
    <ScreenContainer>
      <FlatList
        data={activeTab === "posts" ? posts.data ?? [] : []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.hero,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
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
              <View style={styles.bannerOverlay} />
              <View style={styles.heroBody}>
                <View style={styles.identityRow}>
                  <View style={[styles.avatarLift, { backgroundColor: theme.colors.surface }]}>
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
                      {role ? <RoleBadge role={role} /> : null}
                    </View>
                  </View>
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

            {canViewModTools(role) ? (
              <GradientCard contentStyle={styles.modPanel}>
                <View style={styles.panelTitleRow}>
                  <Settings size={18} color={theme.colors.secondary} />
                  <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
                    Herramientas de comunidad
                  </Text>
                </View>
                <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
                  Puedes revisar reportes, ocultar contenido y ayudar a mantener sana esta Orbita.
                </Text>
                <Button
                  title="Abrir moderacion"
                  variant="secondary"
                  size="sm"
                  onPress={() => router.push("/moderation")}
                />
              </GradientCard>
            ) : null}

            <SectionTabs tabs={TABS} value={activeTab} onChange={setActiveTab} />

            {activeTab !== "posts" ? (
              <CommunityTabContent
                tab={activeTab}
                members={memberRows}
                rules={rules}
                onOpenChat={handleChat}
                communityId={community.data.id}
              />
            ) : (
              <Text style={[styles.feedTitle, { color: theme.colors.text }]}>
                Ecos recientes
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          activeTab === "posts" ? (
            posts.isLoading ? (
              <LoadingState label="Cargando publicaciones..." />
            ) : (
              <EmptyState
                icon={<NexoMascot size={110} />}
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
        <Info size={18} color={theme.colors.secondary} />
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>Info</Text>
      </View>
      <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
        Las Orbitas tienen feed propio, sala general, miembros con roles y normas visibles.
        Esta estructura permite crecer hacia canales, perfiles por comunidad y misiones.
      </Text>
      <View style={styles.liveHint}>
        <Radio size={15} color={theme.colors.success} />
        <Text style={[styles.memberMeta, { color: theme.colors.textFaint }]}>
          Actividad aproximada con presencia inicial.
        </Text>
      </View>
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
    gap: 12,
  },
  hero: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  bannerImage: {
    height: 168,
    width: "100%",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    right: 0,
    left: 0,
    height: 168,
    backgroundColor: "rgba(9,10,18,0.28)",
  },
  heroBody: {
    padding: 14,
    gap: 12,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    marginTop: -48,
  },
  avatarLift: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
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
  modPanel: {
    gap: 10,
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
  liveHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
