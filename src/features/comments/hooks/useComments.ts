import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient } from "../../../lib/query-client";
import type { CommentInput } from "../../../utils/validation";
import { createComment, listComments } from "../services/comments-service";

export function useComments(postId?: string) {
  return useQuery({
    queryKey: ["comments", postId],
    queryFn: () => listComments(postId ?? ""),
    enabled: Boolean(postId),
  });
}

export function useCreateCommentMutation(postId: string, authorId?: string) {
  return useMutation({
    mutationFn: (input: CommentInput) =>
      createComment({
        postId,
        authorId: authorId ?? "",
        input,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["comments", postId] });
    },
  });
}
