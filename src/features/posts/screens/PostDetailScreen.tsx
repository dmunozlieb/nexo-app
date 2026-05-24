import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Flag, Reply } from "lucide-react-native";
import { PostCard } from "../../../components/content/PostCard";
import { ReportModal } from "../../../components/content/ReportModal";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TextInput } from "../../../components/ui/TextInput";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type {
  CommentWithAuthor,
  ReactionType,
  ReportTargetType,
} from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";
import { commentSchema, type CommentInput } from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useComments, useCreateCommentMutation } from "../../comments/hooks/useComments";
import { useCreateReportMutation } from "../../moderation/hooks/useModeration";
import {
  usePost,
  useToggleReactionMutation,
  useToggleSavedPostMutation,
} from "../hooks/usePosts";

type ReportTarget = {
  type: ReportTargetType;
  id: string;
};

export function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const post = usePost(id, auth.session?.user.id);
  const comments = useComments(id);
  const createComment = useCreateCommentMutation(id, auth.session?.user.id);
  const reaction = useToggleReactionMutation(auth.session?.user.id);
  const save = useToggleSavedPostMutation(auth.session?.user.id);
  const report = useCreateReportMutation(auth.session?.user.id);
  const [replyTo, setReplyTo] = useState<CommentWithAuthor | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);
  const form = useForm<CommentInput>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      body: "",
      parentId: null,
    },
  });

  async function handleComment(input: CommentInput) {
    try {
      await createComment.mutateAsync({
        ...input,
        parentId: replyTo?.id ?? null,
      });
      setReplyTo(null);
      form.reset({ body: "", parentId: null });
    } catch (error) {
      Alert.alert("No se pudo comentar", getErrorMessage(error));
    }
  }

  function handleReact(nextReaction: ReactionType) {
    if (post.data) {
      reaction.mutate({ post: post.data, reaction: nextReaction });
    }
  }

  if (post.isLoading) {
    return <LoadingState label="Cargando publicacion..." />;
  }

  if (post.isError || !post.data) {
    return <ErrorState onRetry={() => void post.refetch()} />;
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <PostCard
          post={post.data}
          onReact={handleReact}
          onSave={() => save.mutate(post.data)}
          onReport={() => setReportTarget({ type: "post", id: post.data.id })}
        />
        <View style={[styles.commentBox, { borderColor: theme.colors.border }]}>
          {replyTo ? (
            <Text style={[styles.replying, { color: theme.colors.secondary }]}>
              Respondiendo a {replyTo.author?.username ?? "comentario"}
            </Text>
          ) : null}
          <Controller
            control={form.control}
            name="body"
            render={({ field, fieldState }) => (
              <TextInput
                label="Comentario"
                multiline
                maxLength={1000}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Suma un eco a la conversacion."
                style={styles.commentInput}
              />
            )}
          />
          <View style={styles.commentActions}>
            {replyTo ? (
              <Button title="Cancelar" variant="ghost" onPress={() => setReplyTo(null)} />
            ) : null}
            <Button
              title="Comentar"
              loading={createComment.isPending}
              onPress={form.handleSubmit(handleComment)}
            />
          </View>
        </View>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Comentarios
          </Text>
        </View>
        {comments.isLoading ? (
          <LoadingState label="Leyendo comentarios..." />
        ) : (comments.data ?? []).length === 0 ? (
          <EmptyState
            title="Sin comentarios"
            message="Se la primera persona en aportar una respuesta."
          />
        ) : (
          (comments.data ?? []).map((comment) => (
            <CommentThread
              key={comment.id}
              comment={comment}
              onReply={setReplyTo}
              onReport={(commentId) =>
                setReportTarget({ type: "comment", id: commentId })
              }
            />
          ))
        )}
      </ScrollView>
      <ReportModal
        visible={Boolean(reportTarget)}
        onClose={() => setReportTarget(null)}
        onSubmitReport={(reason, details) =>
          report.mutateAsync({
            targetType: reportTarget?.type ?? "post",
            targetId: reportTarget?.id ?? "",
            reason,
            details,
          })
        }
      />
    </ScreenContainer>
  );
}

function CommentThread({
  comment,
  onReply,
  onReport,
}: {
  comment: CommentWithAuthor;
  onReply: (comment: CommentWithAuthor) => void;
  onReport: (commentId: string) => void;
}) {
  return (
    <View style={styles.thread}>
      <CommentItem comment={comment} onReply={onReply} onReport={onReport} />
      {(comment.replies ?? []).map((reply) => (
        <View key={reply.id} style={styles.reply}>
          <CommentItem comment={reply} onReply={onReply} onReport={onReport} />
        </View>
      ))}
    </View>
  );
}

function CommentItem({
  comment,
  onReply,
  onReport,
}: {
  comment: CommentWithAuthor;
  onReply: (comment: CommentWithAuthor) => void;
  onReport: (commentId: string) => void;
}) {
  const theme = useTheme();
  const authorName = comment.author?.display_name ?? comment.author?.username ?? "Usuario";

  return (
    <View
      style={[
        styles.comment,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <Avatar uri={comment.author?.avatar_url} label={authorName} size={34} />
      <View style={styles.commentBody}>
        <Text style={[styles.commentAuthor, { color: theme.colors.text }]}>
          {authorName}
        </Text>
        <Text style={[styles.commentMeta, { color: theme.colors.textFaint }]}>
          {formatRelativeDate(comment.created_at)}
        </Text>
        <Text style={[styles.commentText, { color: theme.colors.textMuted }]}>
          {comment.body}
        </Text>
        <View style={styles.inlineActions}>
          <Button
            title="Responder"
            variant="ghost"
            size="sm"
            icon={<Reply size={15} color={theme.colors.textMuted} />}
            onPress={() => onReply(comment)}
          />
          <Button
            title="Reportar"
            variant="ghost"
            size="sm"
            icon={<Flag size={15} color={theme.colors.textMuted} />}
            onPress={() => onReport(comment.id)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    paddingTop: 8,
    paddingBottom: 28,
  },
  commentBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  replying: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  commentInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  commentActions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  sectionHeader: {
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  thread: {
    gap: 8,
  },
  reply: {
    paddingLeft: 28,
  },
  comment: {
    flexDirection: "row",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
  },
  commentBody: {
    flex: 1,
    gap: 3,
  },
  commentAuthor: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  commentMeta: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  commentText: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  inlineActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingTop: 4,
  },
});
