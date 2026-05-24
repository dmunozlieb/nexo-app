import type { PostWithMeta, ReactionType } from "../../../types/domain";

export function createEmptyReactionCounts(): Record<ReactionType, number> {
  return {
    inspire: 0,
    relate: 0,
    curious: 0,
    support: 0,
  };
}

export function mapPostRow(row: unknown, userId?: string | null): PostWithMeta {
  const source = row as Record<string, unknown>;
  const reactions = ((source.reactions ??
    source.post_reactions ??
    []) as Array<{ reaction: ReactionType; user_id?: string }>);
  const savedPosts = (source.saved_posts ?? []) as Array<{ user_id: string }>;
  const counts = createEmptyReactionCounts();

  for (const reaction of reactions) {
    counts[reaction.reaction] = (counts[reaction.reaction] ?? 0) + 1;
  }

  const userReactions = reactions
    .filter((reaction) => reaction.user_id === userId)
    .map((reaction) => reaction.reaction);

  return {
    ...(source as unknown as PostWithMeta),
    author: (source.author ?? null) as PostWithMeta["author"],
    community: (source.community ?? null) as PostWithMeta["community"],
    media_urls: Array.isArray(source.media_urls) ? (source.media_urls as string[]) : [],
    reaction_counts: counts,
    user_reactions: userReactions,
    is_saved: userId
      ? savedPosts.some((savedPost) => savedPost.user_id === userId)
      : false,
  };
}
