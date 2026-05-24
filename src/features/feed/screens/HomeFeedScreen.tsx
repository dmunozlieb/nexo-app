import { useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import {
  Bell,
  Compass,
  Flame,
  Orbit,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { CommunityCard } from "../../../components/content/CommunityCard";
import { PostCard } from "../../../components/content/PostCard";
import { ReportModal } from "../../../components/content/ReportModal";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TagPill } from "../../../components/ui/TagPill";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { PostWithMeta, ReactionType } from "../../../types/domain";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCommunities } from "../../communities/hooks/useCommunities";
import { useCreateReportMutation } from "../../moderation/hooks/useModeration";
import {
  useToggleReactionMutation,
  useToggleSavedPostMutation,
} from "../../posts/hooks/usePosts";
import { useFeed } from "../hooks/useFeed";
import type { FeedMode } from "../services/feed-service";

const FEED_TABS: Array<{ label: string; value: FeedMode }> = [
  { label: "Para ti", value: "for-you" },
  { label: "Siguiendo", value: "following" },
  { label: "Tendencias", value: "trending" },
];

export function HomeFeedScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const [mode, setMode] = useState<FeedMode>("for-you");
  const [reportPost, setReportPost] = useState<PostWithMeta | null>(null);
  const feed = useFeed(mode, auth.session?.user.id);
  const communities = useCommunities();
  const reaction = useToggleReactionMutation(auth.session?.user.id);
  const save = useToggleSavedPostMutation(auth.session?.user.id);
  const report = useCreateReportMutation(auth.session?.user.id);

  const posts = useMemo(
    () => feed.data?.pages.flatMap((page) => page.posts) ?? [],
    [feed.data],
  );
  const activeCommunities = useMemo(
    () => new Set(posts.map((post) => post.community_id)).size,
    [posts],
  );
  const totalEcos = useMemo(
    () =>
      posts.reduce(
        (sum, post) =>
          sum +
          Object.values(post.reaction_counts).reduce(
            (count, value) => count + value,
            0,
          ),
        0,
      ),
    [posts],
  );
  const displayName =
    auth.profile?.display_name ?? auth.profile?.username ?? auth.session?.user.email ?? "Nexo";

  function handleOpenPost(post: PostWithMeta) {
    router.push({ pathname: "/post/[id]", params: { id: post.id } });
  }

  function handleReact(post: PostWithMeta, nextReaction: ReactionType) {
    reaction.mutate({ post, reaction: nextReaction });
  }

  if (feed.isLoading) {
    return <LoadingState label="Sincronizando tu feed..." />;
  }

  if (feed.isError) {
    return (
      <ErrorState
        title="El feed no respondio"
        message="Puede que falte configurar Supabase o que no tengas conexion."
        onRetry={() => void feed.refetch()}
      />
    );
  }

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <View style={styles.profileBlock}>
          <Avatar uri={auth.profile?.avatar_url} label={displayName} size={42} />
          <View style={styles.profileCopy}>
            <Text style={[styles.kicker, { color: theme.colors.secondary }]}>Nexo</Text>
            <Text style={[styles.profileName, { color: theme.colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
          </View>
        </View>
        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            onPress={() => router.push("/discover")}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Search size={18} color={theme.colors.text} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Bell size={18} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      <View
        style={[
          styles.hero,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <LinearGradient
          colors={[
            `${theme.colors.primary}EE`,
            `${theme.colors.secondary}CC`,
            `${theme.colors.accent}BB`,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroGlow}
        />
        <View style={styles.heroContent}>
          <View style={styles.heroCopy}>
            <View style={styles.heroEyebrow}>
              <Sparkles size={15} color="#FFFFFF" />
              <Text style={styles.heroEyebrowText}>Mision activa</Text>
            </View>
            <Text style={styles.heroTitle}>Dale energia a tu orbita</Text>
            <Text style={styles.heroText}>
              Comparte un eco, reacciona con intencion y descubre conversaciones nuevas.
            </Text>
          </View>
          <Button
            title="Crear Orbita"
            size="sm"
            variant="secondary"
            icon={<Orbit size={17} color={theme.colors.text} />}
            style={styles.heroButton}
            onPress={() => router.push("/community/create")}
          />
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Compass size={16} color="#FFFFFF" />
            <Text style={styles.statValue}>{activeCommunities}</Text>
            <Text style={styles.statLabel}>Orbitas</Text>
          </View>
          <View style={styles.statItem}>
            <Flame size={16} color="#FFFFFF" />
            <Text style={styles.statValue}>{totalEcos}</Text>
            <Text style={styles.statLabel}>Ecos</Text>
          </View>
          <View style={styles.statItem}>
            <ShieldCheck size={16} color="#FFFFFF" />
            <Text style={styles.statValue}>UGC</Text>
            <Text style={styles.statLabel}>Seguro</Text>
          </View>
        </View>
      </View>

      <View style={styles.communitySection}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Orbitas populares
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.textFaint }]}>
              Comunidades activas para explorar.
            </Text>
          </View>
          <Button
            title="Nueva"
            size="sm"
            variant="secondary"
            icon={<Plus size={16} color={theme.colors.text} />}
            onPress={() => router.push("/community/create")}
          />
        </View>
        <FlatList
          horizontal
          data={communities.data ?? []}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.communityRail}
          ListEmptyComponent={
            communities.isLoading ? null : (
              <View
                style={[
                  styles.communityEmpty,
                  { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                  Todavia no hay Orbitas activas
                </Text>
                <Text style={[styles.emptyCopy, { color: theme.colors.textMuted }]}>
                  Crea la primera comunidad y empieza a reunir gente.
                </Text>
                <Button
                  title="Crear comunidad"
                  size="sm"
                  onPress={() => router.push("/community/create")}
                />
              </View>
            )
          }
          renderItem={({ item }) => (
            <View style={styles.communityCardWrap}>
              <CommunityCard
                community={item}
                onPress={() =>
                  router.push({ pathname: "/community/[id]", params: { id: item.id } })
                }
              />
            </View>
          )}
        />
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Feed inteligente
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textFaint }]}>
            Cada post muestra por que aparece.
          </Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {FEED_TABS.map((tab) => (
          <TagPill
            key={tab.value}
            label={tab.label}
            selected={mode === tab.value}
            onPress={() => setMode(tab.value)}
          />
        ))}
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={theme.colors.secondary}
            refreshing={feed.isRefetching}
            onRefresh={() => void feed.refetch()}
          />
        }
        onEndReached={() => {
          if (feed.hasNextPage && !feed.isFetchingNextPage) {
            void feed.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.65}
        ListEmptyComponent={
          <EmptyState
            icon={<Orbit size={36} color={theme.colors.secondary} />}
            title="Aun no hay ecos"
            message="Unete a una Orbita o publica el primer hilo de la semana."
          />
        }
        ListFooterComponent={
          feed.isFetchingNextPage ? <LoadingState label="Cargando mas ecos..." /> : null
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
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    paddingTop: 8,
    paddingBottom: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileBlock: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  profileCopy: {
    flex: 1,
    minWidth: 0,
  },
  kicker: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  profileName: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  topActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: 16,
  },
  heroGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    opacity: 0.72,
  },
  heroContent: {
    padding: 16,
    gap: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-end",
  },
  heroCopy: {
    flex: 1,
    minWidth: 240,
    gap: 8,
  },
  heroEyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(9,10,18,0.34)",
  },
  heroEyebrowText: {
    color: "#FFFFFF",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: typography.title,
    fontWeight: "900",
    lineHeight: 32,
  },
  heroText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 560,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  statsRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(9,10,18,0.28)",
  },
  statItem: {
    flex: 1,
    minHeight: 64,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  statValue: {
    color: "#FFFFFF",
    fontSize: typography.h3,
    fontWeight: "900",
  },
  statLabel: {
    color: "rgba(255,255,255,0.72)",
    fontSize: typography.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    gap: 12,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  sectionSubtitle: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  tabs: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 12,
  },
  communitySection: {
    gap: 2,
    paddingBottom: 14,
  },
  communityRail: {
    gap: 12,
    paddingRight: 12,
  },
  communityCardWrap: {
    width: 292,
  },
  communityEmpty: {
    width: 320,
    minHeight: 150,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 14,
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  emptyCopy: {
    fontSize: typography.small,
    lineHeight: 19,
  },
  list: {
    gap: 12,
    paddingBottom: 28,
  },
});
