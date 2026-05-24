import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import { demoListFeed } from "../../../services/demo-service";
import type { PostWithMeta } from "../../../types/domain";
import { mapPostRow } from "../../posts/services/post-mapper";

export type FeedMode = "for-you" | "following" | "trending";

const PAGE_SIZE = 12;

export async function listFeed({
  mode,
  userId,
  pageParam = 0,
}: {
  mode: FeedMode;
  userId?: string | null | undefined;
  pageParam?: number;
}) {
  if (env.demoMode) {
    return demoListFeed({ mode, userId, pageParam });
  }

  const from = pageParam * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("posts")
    .select(
      "*, author:profiles(*), community:communities(*), reactions:post_reactions(reaction,user_id), saved_posts(user_id)",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .range(from, to);

  if (mode === "following" && userId) {
    const { data: follows, error } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", userId);

    if (error) {
      throw error;
    }

    const followingIds = (follows ?? []).map((follow) => follow.following_id);

    if (followingIds.length === 0) {
      return { posts: [] as PostWithMeta[], nextPage: null };
    }

    query = query.in("author_id", followingIds);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  const posts = (data ?? []).map((row) => {
    const post = mapPostRow(row, userId);
    post.recommendation_reason = getRecommendationReason(mode, post);
    return post;
  });

  if (mode === "trending") {
    posts.sort(
      (a, b) =>
        Object.values(b.reaction_counts).reduce((sum, count) => sum + count, 0) -
        Object.values(a.reaction_counts).reduce((sum, count) => sum + count, 0),
    );
  }

  return {
    posts,
    nextPage: posts.length === PAGE_SIZE ? pageParam + 1 : null,
  };
}

function getRecommendationReason(mode: FeedMode, post: PostWithMeta) {
  if (mode === "following") {
    return "Aparece porque sigues a este perfil.";
  }

  if (mode === "trending") {
    return "Aparece por actividad reciente en Ecos.";
  }

  if (post.community?.category) {
    return `Aparece por tu actividad en ${post.community.category}.`;
  }

  return "Aparece por actividad reciente en tus Orbitas.";
}
