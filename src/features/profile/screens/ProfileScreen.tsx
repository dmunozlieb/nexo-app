import { useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import {
  Bookmark,
  Flag,
  MessageSquare,
  Pencil,
  ShieldOff,
  UserPlus,
} from "lucide-react-native";
import { PostCard } from "../../../components/content/PostCard";
import { ReportModal } from "../../../components/content/ReportModal";
import { RoleBadge } from "../../../components/community/RoleBadge";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { PostWithMeta, ReactionType } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { formatRelativeDate } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDirectConversationMutation } from "../../chat/hooks/useChat";
import { useCommunityMembers } from "../../communities/hooks/useCommunities";
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
} from "../hooks/useProfile";

type ProfileScreenProps = {
  profileId?: string;
  communityId?: string | undefined;
};

export function ProfileScreen({ profileId, communityId }: ProfileScreenProps) {
  const theme = useTheme();
  const auth = useAuth();
  const viewedId = profileId ?? auth.session?.user.id;
  const isOwn = viewedId === auth.session?.user.id;
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
  const posts = communityId ? communityPosts : globalPosts;
  const follow = useFollowMutation(auth.session?.user.id);
  const block = useBlockProfileMutation(auth.session?.user.id);
  const directChat = useDirectConversationMutation(auth.session?.user.id);
  const reaction = useToggleReactionMutation(auth.session?.user.id);
  const save = useToggleSavedPostMutation(auth.session?.user.id);
  const report = useCreateReportMutation(auth.session?.user.id);
  const [reportTarget, setReportTarget] = useState<{ type: "profile" | "post"; id: string } | null>(
    null,
  );

  function handleReact(post: PostWithMeta, nextReaction: ReactionType) {
    reaction.mutate({ post, reaction: nextReaction });
  }

  async function handleBlock() {
    try {
      if (!viewedId) {
        return;
      }

      await block.mutateAsync(viewedId);
      Alert.alert("Usuario bloqueado", "La visibilidad se actualizara segun las politicas RLS.");
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
    return <LoadingState label="Cargando perfil..." />;
  }

  if (profile.isError || !profile.data) {
    return <ErrorState onRetry={() => void profile.refetch()} />;
  }

  const displayName = profile.data.display_name ?? profile.data.username;
  const communityMember = (members.data ?? []).find((member) => member.user_id === viewedId);

  return (
    <ScreenContainer>
      <FlatList
        data={posts.data ?? []}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View
              style={[
                styles.banner,
                {
                  backgroundColor: profile.data.banner_url
                    ? theme.colors.elevated
                    : theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            />
            <View style={styles.identityRow}>
              <Avatar uri={profile.data.avatar_url} label={displayName} size={78} />
              <View style={styles.identityCopy}>
                <Text style={[styles.name, { color: theme.colors.text }]}>{displayName}</Text>
                <Text style={[styles.username, { color: theme.colors.textMuted }]}>
                  @{profile.data.username}
                </Text>
              </View>
            </View>
            {profile.data.bio ? (
              <Text style={[styles.bio, { color: theme.colors.textMuted }]}>
                {profile.data.bio}
              </Text>
            ) : null}
            <View style={styles.badges}>
              <Badge label="Perfil publico" tone="secondary" />
              {communityId ? <RoleBadge role={communityMember?.role ?? "member"} /> : null}
              {communityMember?.joined_at ? (
                <Badge
                  label={`Unido ${formatRelativeDate(communityMember.joined_at)}`}
                  tone="neutral"
                />
              ) : null}
              {profile.data.is_banned ? <Badge label="Baneado" tone="danger" /> : null}
            </View>
            <View style={styles.actions}>
              {isOwn ? (
                <>
                  <Button
                    title="Editar"
                    variant="secondary"
                    icon={<Pencil size={17} color={theme.colors.text} />}
                    onPress={() => router.push("/settings/edit-profile")}
                  />
                  <Button
                    title="Ajustes"
                    variant="ghost"
                    icon={<Bookmark size={17} color={theme.colors.textMuted} />}
                    onPress={() => router.push("/settings")}
                  />
                </>
              ) : (
                <>
                  <Button
                    title="Seguir"
                    icon={<UserPlus size={17} color="#FFFFFF" />}
                    loading={follow.isPending}
                    onPress={() => viewedId && follow.mutate(viewedId)}
                  />
                  <Button
                    title="Mensaje"
                    variant="secondary"
                    icon={<MessageSquare size={17} color={theme.colors.text} />}
                    loading={directChat.isPending}
                    onPress={handleDirectChat}
                  />
                  <Button
                    title="Bloquear"
                    variant="danger"
                    icon={<ShieldOff size={17} color="#FFFFFF" />}
                    loading={block.isPending}
                    onPress={handleBlock}
                  />
                  <Button
                    title="Reportar"
                    variant="ghost"
                    icon={<Flag size={17} color={theme.colors.textMuted} />}
                    onPress={() =>
                      viewedId && setReportTarget({ type: "profile", id: viewedId })
                    }
                  />
                </>
              )}
            </View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              {communityId ? "Posts en esta Orbita" : "Publicaciones"}
            </Text>
          </View>
        }
        ListEmptyComponent={
          posts.isLoading ? (
            <LoadingState label="Cargando publicaciones..." />
          ) : (
            <EmptyState title="Sin publicaciones" message="No hay ecos publicados aqui." />
          )
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onPress={() =>
              router.push({ pathname: "/post/[id]", params: { id: item.id } })
            }
            onReact={(nextReaction) => handleReact(item, nextReaction)}
            onSave={() => save.mutate(item)}
            onReport={() => setReportTarget({ type: "post", id: item.id })}
          />
        )}
      />
      <ReportModal
        visible={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmitReport={(reason, details) =>
          report.mutateAsync({
            targetType: reportTarget?.type ?? "profile",
            targetId: reportTarget?.id ?? "",
            reason,
            details,
          })
        }
      />
    </ScreenContainer>
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
  banner: {
    height: 112,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: -42,
    paddingHorizontal: 12,
  },
  identityCopy: {
    flex: 1,
    paddingTop: 38,
  },
  name: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  username: {
    fontSize: typography.body,
    fontWeight: "700",
  },
  bio: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
});
