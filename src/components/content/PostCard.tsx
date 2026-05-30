import { useRef, type ReactNode } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Bookmark, Flag, MessageCircle, Sparkles } from "lucide-react-native";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { POST_TYPES } from "../../constants/post";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { PostWithMeta, ReactionType } from "../../types/domain";
import { formatRelativeDate } from "../../utils/format";
import { Avatar } from "../ui/Avatar";
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
  const { width } = useWindowDimensions();
  const type = POST_TYPES.find((item) => item.value === post.type) ?? POST_TYPES[0]!;
  const authorName = post.author?.display_name ?? post.author?.username ?? "Usuario";
  // Cap de altura para que una imagen unica no se dispare a ancho completo en
  // desktop/tablet; en mobile el aspect ratio ya la mantiene contenida.
  const mediaMaxHeight = width >= 1100 ? 420 : width >= 768 ? 360 : undefined;

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
      <PostMedia urls={post.media_urls} maxHeight={mediaMaxHeight} />

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
        <IconAction
          label="Comentar"
          icon={<MessageCircle size={17} color={theme.colors.textMuted} />}
          onPress={onPress}
        />
        {onSave ? (
          <IconAction
            label={post.is_saved ? "Guardado" : "Guardar"}
            active={post.is_saved}
            accent={theme.colors.secondary}
            icon={
              <Bookmark
                size={17}
                color={post.is_saved ? theme.colors.secondary : theme.colors.textMuted}
                fill={post.is_saved ? theme.colors.secondary : "transparent"}
              />
            }
            onPress={onSave}
          />
        ) : null}
        {onReport ? (
          <>
            <View style={styles.actionsSpacer} />
            <IconAction
              label="Reportar"
              icon={<Flag size={17} color={theme.colors.textFaint} />}
              onPress={onReport}
            />
          </>
        ) : null}
      </View>
    </View>
  );
}

type PostMediaProps = {
  urls: string[];
  maxHeight?: number | undefined;
};

function PostMedia({ urls, maxHeight }: PostMediaProps) {
  if (urls.length === 0) {
    return null;
  }

  if (urls.length === 1) {
    return (
      <Image
        source={{ uri: urls[0]! }}
        style={[styles.mediaSingle, maxHeight ? { maxHeight } : null]}
        contentFit="cover"
      />
    );
  }

  if (urls.length === 2) {
    return (
      <View style={styles.mediaRow}>
        {urls.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.mediaHalf} contentFit="cover" />
        ))}
      </View>
    );
  }

  if (urls.length === 3) {
    return (
      <View style={styles.mediaCol}>
        <Image
          source={{ uri: urls[0]! }}
          style={[styles.mediaWide, maxHeight ? { maxHeight } : null]}
          contentFit="cover"
        />
        <View style={styles.mediaRow}>
          {urls.slice(1, 3).map((uri, index) => (
            <Image key={index} source={{ uri }} style={styles.mediaHalf} contentFit="cover" />
          ))}
        </View>
      </View>
    );
  }

  // 4 o mas: grid 2x2; la cuarta celda muestra "+N" si hay extra.
  const visible = urls.slice(0, 4);
  const extra = urls.length - 4;

  return (
    <View style={styles.mediaGrid}>
      {visible.map((uri, index) => (
        <View key={index} style={styles.mediaCell}>
          <Image source={{ uri }} style={styles.mediaFill} contentFit="cover" />
          {index === 3 && extra > 0 ? (
            <View style={styles.mediaMore}>
              <Text style={styles.mediaMoreText}>+{extra}</Text>
            </View>
          ) : null}
        </View>
      ))}
    </View>
  );
}

type IconActionProps = {
  label: string;
  icon: ReactNode;
  onPress?: (() => void) | undefined;
  active?: boolean;
  accent?: string;
};

function IconAction({ label, icon, onPress, active = false, accent }: IconActionProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    onPress?.();

    if (reducedMotion) {
      return;
    }

    scale.stopAnimation();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.3, duration: 110, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 4, tension: 140, useNativeDriver: true }),
    ]).start();
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.iconAction,
        {
          backgroundColor: active && accent ? `${accent}24` : theme.colors.surface,
          borderColor: active && accent ? accent : theme.colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{icon}</Animated.View>
    </Pressable>
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
  mediaSingle: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mediaWide: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mediaCol: {
    gap: 6,
  },
  mediaRow: {
    flexDirection: "row",
    gap: 6,
  },
  mediaHalf: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 6,
  },
  mediaCell: {
    width: "49%",
    aspectRatio: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  mediaFill: {
    width: "100%",
    height: "100%",
  },
  mediaMore: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,11,26,0.62)",
  },
  mediaMoreText: {
    color: "#FFFFFF",
    fontSize: typography.h2,
    fontWeight: "900",
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
    gap: 8,
  },
  actionsSpacer: {
    flex: 1,
  },
  iconAction: {
    minHeight: 38,
    minWidth: 44,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
