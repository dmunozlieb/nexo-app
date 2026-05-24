import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, Flag, MessageCircle, Sparkles } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { POST_TYPES } from "../../constants/post";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { PostWithMeta, ReactionType } from "../../types/domain";
import { formatRelativeDate } from "../../utils/format";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { ReactionBar } from "./ReactionBar";

type PostCardProps = {
  post: PostWithMeta;
  onPress?: () => void;
  onReact: (reaction: ReactionType) => void;
  onSave?: () => void;
  onReport?: () => void;
  compact?: boolean;
};

export function PostCard({
  post,
  onPress,
  onReact,
  onSave,
  onReport,
  compact = false,
}: PostCardProps) {
  const theme = useTheme();
  const type = POST_TYPES.find((item) => item.value === post.type) ?? POST_TYPES[0]!;
  const authorName = post.author?.display_name ?? post.author?.username ?? "Usuario";
  const media = post.media_urls[0];

  const content = (
    <>
      <View style={styles.header}>
        <Avatar uri={post.author?.avatar_url} label={authorName} size={38} />
        <View style={styles.headerCopy}>
          <Text style={[styles.author, { color: theme.colors.text }]} numberOfLines={1}>
            {authorName}
          </Text>
          <Text style={[styles.meta, { color: theme.colors.textFaint }]} numberOfLines={1}>
            {post.community?.name ?? "Orbita"} - {formatRelativeDate(post.created_at)}
          </Text>
        </View>
        <View style={[styles.energyBadge, { backgroundColor: `${type.color}22` }]}>
          <Sparkles size={13} color={type.color} />
          <Text style={[styles.energyText, { color: type.color }]}>{type.label}</Text>
        </View>
      </View>

      {post.title ? (
        <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
          {post.title}
        </Text>
      ) : null}
      {post.body ? (
        <Text
          style={[styles.body, { color: theme.colors.textMuted }]}
          numberOfLines={compact ? 3 : 5}
        >
          {post.body}
        </Text>
      ) : null}
      {media ? <Image source={{ uri: media }} style={styles.media} contentFit="cover" /> : null}

      {post.recommendation_reason ? (
        <View
          style={[
            styles.reasonBox,
            {
              backgroundColor: "rgba(255,255,255,0.045)",
              borderColor: `${theme.colors.secondary}22`,
            },
          ]}
        >
          <Sparkles size={14} color={theme.colors.secondary} />
          <Text style={[styles.reason, { color: theme.colors.textMuted }]}>
            {post.recommendation_reason}
          </Text>
        </View>
      ) : null}
    </>
  );

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: "rgba(18,20,39,0.78)",
          borderColor: `${type.color}38`,
          shadowColor: type.color,
        },
      ]}
    >
      <LinearGradient
        colors={[`${type.color}16`, "rgba(255,255,255,0.015)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardWash}
      />
      <View style={[styles.accentLine, { backgroundColor: type.color }]} />
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.title ?? "Abrir publicacion"}
          onPress={onPress}
          style={({ pressed }) => [styles.contentButton, { opacity: pressed ? 0.82 : 1 }]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.contentButton}>{content}</View>
      )}

      <ReactionBar
        counts={post.reaction_counts}
        active={post.user_reactions}
        onToggle={onReact}
      />

      <View style={styles.actions}>
        <Button
          title="Comentar"
          variant="ghost"
          size="sm"
          icon={<MessageCircle size={16} color={theme.colors.textMuted} />}
          onPress={onPress}
        />
        {onSave ? (
          <Button
            title={post.is_saved ? "Guardado" : "Guardar"}
            variant={post.is_saved ? "secondary" : "ghost"}
            size="sm"
            icon={<Bookmark size={16} color={theme.colors.textMuted} />}
            onPress={onSave}
          />
        ) : null}
        {onReport ? (
          <Button
            title="Reportar"
            variant="ghost"
            size="sm"
            icon={<Flag size={16} color={theme.colors.textMuted} />}
            onPress={onReport}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 14,
    gap: 13,
    overflow: "hidden",
    shadowOpacity: 0.2,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  cardWash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  accentLine: {
    position: "absolute",
    top: 16,
    bottom: 16,
    left: 0,
    width: 3,
    borderTopRightRadius: 999,
    borderBottomRightRadius: 999,
  },
  contentButton: {
    gap: 13,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  author: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  meta: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  energyBadge: {
    minHeight: 28,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  energyText: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "900",
    lineHeight: 23,
  },
  body: {
    fontSize: typography.body,
    lineHeight: 23,
  },
  media: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  reason: {
    flex: 1,
    fontSize: typography.small,
    fontWeight: "700",
  },
  reasonBox: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
});
