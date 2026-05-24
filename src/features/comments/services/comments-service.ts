import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoCreateComment,
  demoListComments,
} from "../../../services/demo-service";
import type { CommentWithAuthor } from "../../../types/domain";
import type { CommentInput } from "../../../utils/validation";
import { sanitizePlainText } from "../../../utils/sanitize";

export async function listComments(postId: string) {
  if (env.demoMode) {
    return demoListComments(postId);
  }

  const { data, error } = await supabase
    .from("comments")
    .select("*, author:profiles(*)")
    .eq("post_id", postId)
    .eq("status", "published")
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  const comments = (data ?? []) as unknown as CommentWithAuthor[];
  const byParent = new Map<string | null, CommentWithAuthor[]>();

  for (const comment of comments) {
    const key = comment.parent_id ?? null;
    const siblings = byParent.get(key) ?? [];
    siblings.push({ ...comment, replies: [] });
    byParent.set(key, siblings);
  }

  const roots = byParent.get(null) ?? [];

  return roots.map((comment) => ({
    ...comment,
    replies: byParent.get(comment.id) ?? [],
  }));
}

export async function createComment({
  postId,
  authorId,
  input,
}: {
  postId: string;
  authorId: string;
  input: CommentInput;
}) {
  if (env.demoMode) {
    return demoCreateComment({ postId, authorId, input });
  }

  const { data, error } = await supabase
    .from("comments")
    .insert({
      post_id: postId,
      author_id: authorId,
      parent_id: input.parentId ?? null,
      body: sanitizePlainText(input.body),
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
