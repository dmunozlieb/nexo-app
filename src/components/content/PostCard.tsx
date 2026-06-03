import { useRef, type ReactNode } from "react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  BarChart3,
  Bookmark,
  BookOpen,
  Calendar,
  Flag,
  HelpCircle,
  Megaphone,
  MessageCircle,
  Palette,
  Sparkles,
  Star,
  type LucideIcon,
} from "lucide-react-native";
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
import { radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { PostType, PostWithMeta, ReactionType } from "../../types/domain";
import { formatCompactNumber, formatRelativeDate } from "../../utils/format";
import { Avatar } from "../ui/Avatar";

type PostCardProps = {
  post: PostWithMeta;
  onPress?: () => void;
  onReact: (reaction: ReactionType) => void;
  onSave?: () => void;
  onReport?: () => void;
  compact?: boolean;
};

// Cada tipo de senal estrena su propio glifo, igual que en el diseno de
// referencia (Debate -> megafono, Recomendacion -> estrella, etc.).
const TYPE_ICONS: Record<PostType, LucideIcon> = {
  debate: Megaphone,
  help: HelpCircle,
  fanart: Palette,
  poll: BarChart3,
  story: BookOpen,
  recommendation: Star,
  event: Calendar,
};

// El boton de Ecos colapsa las reacciones en un unico gesto. "inspire" actua
// como el Eco canonico que se alterna al pulsar.
const ECO_REACTION: ReactionType = "inspire";

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
  const TypeIcon = TYPE_ICONS[post.type] ?? Sparkles;
  const authorName = post.author?.display_name ?? post.author?.username ?? "Usuario";
  const orbitaName = post.community?.name ?? "Orbita";
  // Cap de altura para que una imagen unica no se dispare a ancho completo en
  // desktop/tablet; en mobile el aspect ratio ya la mantiene contenida.
  const mediaMaxHeight = width >= 1100 ? 420 : width >= 768 ? 360 : undefined;

  const ecoCount = Object.values(post.reaction_counts).reduce(
    (total, count) => total + count,
    0,
  );
  const ecoed = post.user_reactions.includes(ECO_REACTION);

  const content = (
    <>
      <View style={styles.header}>
        <Avatar uri={post.author?.avatar_url} label={authorName} size={40} />
        <View style={styles.headerCopy}>
          <Text style={[styles.author, { color: theme.colors.text }]} numberOfLines={1}>
            {authorName}
          </Text>
          <View style={styles.sub}>
            <Text style={[styles.subOrbita, { color: type.color }]} numberOfLines={1}>
              {orbitaName}
            </Text>
            <Text style={[styles.subDot, { color: theme.colors.textFaint }]}>·</Text>
            <Text style={[styles.subTime, { color: theme.colors.textFaint }]} numberOfLines={1}>
              {formatRelativeDate(post.created_at)}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.typeBadge,
            {
              backgroundColor: `${type.color}24`,
              borderColor: `${type.color}57`,
            },
          ]}
        >
          <TypeIcon size={13} color={type.color} />
          <Text style={[styles.typeText, { color: type.color }]}>{type.label}</Text>
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
    <View style={[styles.card, { borderColor: "rgba(255,255,255,0.09)" }]}>
      <LinearGradient
        colors={["rgba(24,32,68,0.42)", "rgba(13,18,48,0.5)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.cardWash}
      />
      <LinearGradient
        colors={[type.color, "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.rail}
      />
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={post.title ?? "Abrir publicacion"}
          onPress={onPress}
          style={({ pressed }) => [styles.contentButton, { opacity: pressed ? 0.85 : 1 }]}
        >
          {content}
        </Pressable>
      ) : (
        <View style={styles.contentButton}>{content}</View>
      )}

      <View style={[styles.footer, { borderTopColor: "rgba(255,255,255,0.07)" }]}>
        <EcoButton
          count={ecoCount}
          active={ecoed}
          accent={theme.colors.featured}
          onPress={() => onReact(ECO_REACTION)}
        />
        <View style={styles.actions}>
          <IconAction
            label="Comentar"
            icon={<MessageCircle size={17} color={theme.colors.textFaint} />}
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
                  color={post.is_saved ? theme.colors.secondary : theme.colors.textFaint}
                  fill={post.is_saved ? theme.colors.secondary : "transparent"}
                />
              }
              onPress={onSave}
            />
          ) : null}
          {onReport ? (
            <IconAction
              label="Reportar"
              faint
              icon={<Flag size={16} color={theme.colors.textFaint} />}
              onPress={onReport}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

type EcoButtonProps = {
  count: number;
  active: boolean;
  accent: string;
  onPress: () => void;
};

function EcoButton({ count, active, accent, onPress }: EcoButtonProps) {
  const theme = useTheme();
  const reducedMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  function handlePress() {
    onPress();

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

  const tint = active ? accent : theme.colors.textMuted;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Dar un Eco"
      accessibilityState={{ selected: active }}
      onPress={handlePress}
      style={({ pressed }) => [
        styles.ecoBtn,
        {
          backgroundColor: active ? `${accent}24` : "rgba(255,255,255,0.04)",
          borderColor: active ? `${accent}61` : "rgba(255,255,255,0.1)",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>
        <Sparkles size={16} color={active ? accent : theme.colors.textFaint} />
      </Animated.View>
      <Text style={[styles.ecoCount, { color: tint }]}>{formatCompactNumber(count)}</Text>
      <Text
        style={[
          styles.ecoWord,
          { color: active ? accent : theme.colors.textFaint },
        ]}
      >
        Ecos
      </Text>
    </Pressable>
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
  faint?: boolean;
};

function IconAction({ label, icon, onPress, active = false, accent, faint = false }: IconActionProps) {
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
      style={({ pressed, hovered }) => [
        styles.iconAction,
        {
          backgroundColor:
            active && accent
              ? `${accent}1F`
              : hovered
                ? "rgba(255,255,255,0.07)"
                : "transparent",
          opacity: pressed ? 0.7 : faint ? 0.7 : 1,
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale }] }}>{icon}</Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    // Card opaca para que el fondo cosmico no se transparente a traves del post.
    backgroundColor: "#0E1330",
    paddingTop: 18,
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 13,
    overflow: "hidden",
  },
  cardWash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  rail: {
    position: "absolute",
    top: 14,
    bottom: 14,
    left: 0,
    width: 3,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  contentButton: {
    gap: 7,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 7,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  author: {
    fontSize: 14.5,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  sub: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },
  subOrbita: {
    flexShrink: 1,
    fontSize: 12.5,
    fontWeight: "600",
  },
  subDot: {
    fontSize: 12.5,
    opacity: 0.6,
  },
  subTime: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  typeBadge: {
    minHeight: 26,
    borderRadius: radius.pill,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
  },
  typeText: {
    fontSize: 12,
    fontWeight: "700",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 23,
  },
  body: {
    fontSize: 15,
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
    fontSize: 20,
    fontWeight: "900",
  },
  reason: {
    flex: 1,
    fontSize: 13,
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
    marginTop: 6,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 3,
    paddingTop: 13,
    borderTopWidth: 1,
  },
  ecoBtn: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  ecoCount: {
    fontSize: 14,
    fontWeight: "700",
  },
  ecoWord: {
    fontSize: 14,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  iconAction: {
    height: 36,
    minWidth: 36,
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});
