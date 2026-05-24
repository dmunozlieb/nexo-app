import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import type { PostWithMeta, ReactionType } from "../../../types/domain";
import type { PostFormInput } from "../../../utils/validation";
import {
  createPost,
  getPost,
  toggleReaction,
  toggleSavedPost,
} from "../services/posts-service";

export function usePost(postId?: string, userId?: string | null) {
  return useQuery({
    queryKey: ["post", postId, userId],
    queryFn: () => getPost(postId ?? "", userId),
    enabled: Boolean(postId),
  });
}

export function useCreatePostMutation(authorId?: string) {
  return useMutation({
    mutationFn: (input: PostFormInput) => createPost(input, authorId ?? ""),
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({
        queryKey: ["community-posts", post.community_id],
      });
    },
  });
}

export function useToggleReactionMutation(userId?: string) {
  return useMutation({
    mutationFn: ({
      post,
      reaction,
    }: {
      post: PostWithMeta;
      reaction: ReactionType;
    }) => toggleReaction({ post, userId: userId ?? "", reaction }),
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ["post", variables.post.id] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      await queryClient.invalidateQueries({
        queryKey: ["community-posts", variables.post.community_id],
      });
    },
  });
}

export function useToggleSavedPostMutation(userId?: string) {
  return useMutation({
    mutationFn: (post: PostWithMeta) =>
      toggleSavedPost({
        postId: post.id,
        userId: userId ?? "",
        isSaved: post.is_saved,
      }),
    onSuccess: async (_data, post) => {
      await queryClient.invalidateQueries({ queryKey: ["post", post.id] });
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}
