import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoCreatePost,
  demoGetPost,
  demoToggleReaction,
  demoToggleSavedPost,
} from "../../../services/demo-service";
import type { PostWithMeta, ReactionType } from "../../../types/domain";
import type { PostFormInput } from "../../../utils/validation";
import { sanitizePlainText } from "../../../utils/sanitize";
import { mapPostRow } from "./post-mapper";

export async function createPost(input: PostFormInput, authorId: string) {
  if (env.demoMode) {
    return demoCreatePost(input, authorId);
  }

  const { data, error } = await supabase
    .from("posts")
    .insert({
      community_id: input.communityId,
      author_id: authorId,
      type: input.type,
      title: input.title ? sanitizePlainText(input.title) : null,
      body: sanitizePlainText(input.body),
      media_urls: input.mediaUrls,
      status: "published",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getPost(postId: string, userId?: string | null) {
  if (env.demoMode) {
    return demoGetPost(postId, userId);
  }

  const { data, error } = await supabase
    .from("posts")
    .select(
      "*, author:profiles(*), community:communities(*), reactions:post_reactions(reaction,user_id), saved_posts(user_id)",
    )
    .eq("id", postId)
    .single();

  if (error) {
    throw error;
  }

  return mapPostRow(data, userId);
}

export async function toggleReaction({
  post,
  userId,
  reaction,
}: {
  post: PostWithMeta;
  userId: string;
  reaction: ReactionType;
}) {
  if (env.demoMode) {
    return demoToggleReaction({ post, userId, reaction });
  }

  const active = post.user_reactions.includes(reaction);

  if (active) {
    const { error } = await supabase
      .from("post_reactions")
      .delete()
      .eq("post_id", post.id)
      .eq("user_id", userId)
      .eq("reaction", reaction);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("post_reactions").insert({
    post_id: post.id,
    user_id: userId,
    reaction,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}

export async function toggleSavedPost({
  postId,
  userId,
  isSaved,
}: {
  postId: string;
  userId: string;
  isSaved: boolean;
}) {
  if (env.demoMode) {
    return demoToggleSavedPost({ postId, userId, isSaved });
  }

  if (isSaved) {
    const { error } = await supabase
      .from("saved_posts")
      .delete()
      .eq("post_id", postId)
      .eq("user_id", userId);

    if (error) {
      throw error;
    }

    return;
  }

  const { error } = await supabase.from("saved_posts").insert({
    post_id: postId,
    user_id: userId,
    created_at: new Date().toISOString(),
  });

  if (error) {
    throw error;
  }
}
