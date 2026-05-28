import { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import { PostCard } from "../../../components/content/PostCard";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import type { PostWithMeta, ReactionType } from "../../../types/domain";

type FeaturedSignalsProps = {
  posts: PostWithMeta[];
  onOpenPost: (post: PostWithMeta) => void;
  onReact: (post: PostWithMeta, reaction: ReactionType) => void;
  onSave: (post: PostWithMeta) => void;
  onReport: (post: PostWithMeta) => void;
};

function ecoTotal(post: PostWithMeta) {
  return Object.values(post.reaction_counts).reduce(
    (sum, count) => sum + count,
    0,
  );
}

export function FeaturedSignals({
  posts,
  onOpenPost,
  onReact,
  onSave,
  onReport,
}: FeaturedSignalsProps) {
  // TODO: incluir Senales fijadas por mods (post_pins) cuando exista backend.
  const featured = useMemo(
    () =>
      [...posts]
        .filter((post) => ecoTotal(post) > 0)
        .sort((a, b) => ecoTotal(b) - ecoTotal(a))
        .slice(0, 5),
    [posts],
  );

  if (featured.length === 0) {
    return (
      <AlienEmptyState
        title="Aun no hay senales destacadas"
        message="Cuando una senal recoja Ecos, brillara aqui. Lanza la primera y empieza el movimiento."
      />
    );
  }

  return (
    <View style={styles.list}>
      {featured.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          onPress={() => onOpenPost(post)}
          onReact={(reaction) => onReact(post, reaction)}
          onSave={() => onSave(post)}
          onReport={() => onReport(post)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 14,
  },
});
