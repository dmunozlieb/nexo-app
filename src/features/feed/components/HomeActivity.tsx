import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  AtSign,
  Heart,
  MessageCircle,
  RefreshCcw,
  Shield,
  Sparkles,
} from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";

export type HomeActivityKind =
  | "eco"
  | "comment"
  | "mention"
  | "newPosts"
  | "role"
  | "chat";

export type HomeActivityItem = {
  id: string;
  kind: HomeActivityKind;
  text: string;
  time: string;
  community: CommunityWithMeta;
};

type ActivityState =
  | "ok"
  | "loading"
  | "emptyNoOrbitas"
  | "emptyNoActivity"
  | "error";

type ActivityProps = {
  items: HomeActivityItem[];
  state?: ActivityState;
  onPressItem: (item: HomeActivityItem) => void;
  onExplore?: () => void;
  onRetry?: () => void;
  onViewMore?: () => void;
};

const kindColor: Record<HomeActivityKind, string> = {
  eco: "#FF4FD8",
  comment: "#18D7FF",
  mention: "#7B5CFF",
  newPosts: "#22E6B9",
  role: "#FF7AA8",
  chat: "#18D7FF",
};

function ActivityIcon({
  kind,
  color,
  size = 11,
}: {
  kind: HomeActivityKind;
  color: string;
  size?: number;
}) {
  if (kind === "eco") {
    return <Heart size={size} color={color} />;
  }

  if (kind === "comment" || kind === "chat") {
    return <MessageCircle size={size} color={color} />;
  }

  if (kind === "mention") {
    return <AtSign size={size} color={color} />;
  }

  if (kind === "role") {
    return <Shield size={size} color={color} />;
  }

  return <Sparkles size={size} color={color} />;
}

export function ActivityColumn({
  items,
  state = "ok",
  onPressItem,
  onExplore,
  onRetry,
  onViewMore,
}: ActivityProps) {
  return (
    <View style={styles.column}>
      <ActivityHeader onViewMore={onViewMore} />

      {state === "loading" ? <ActivitySkeleton count={5} /> : null}
      {state === "error" ? <ActivityError onRetry={onRetry} /> : null}
      {state === "emptyNoOrbitas" ? (
        <ActivityEmpty
          title="Aun no hay actividad."
          subtitle="Unete a tu primera Orbita."
          ctaLabel="Explorar Orbitas"
          onPress={onExplore}
        />
      ) : null}
      {state === "emptyNoActivity" ? (
        <ActivityEmpty
          title="Todo en calma."
          subtitle="Toca un planeta y empieza a orbitar."
        />
      ) : null}

      {state === "ok" ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.columnList}
        >
          {items.map((item) => (
            <ActivityRow
              key={item.id}
              item={item}
              onPress={() => onPressItem(item)}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

export function ActivityStrip({
  items,
  state = "ok",
  onPressItem,
  onExplore,
  onRetry,
  onViewMore,
}: ActivityProps) {
  const isEmptyState = state !== "ok" && state !== "loading";

  return (
    <View style={styles.strip}>
      <ActivityHeader compact onViewMore={onViewMore} />

      {isEmptyState ? (
        <ActivityStripEmpty
          state={state}
          onExplore={onExplore}
          onRetry={onRetry}
        />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.stripList}
        >
          {state === "loading" ? <ActivityStripSkeleton /> : null}
          {state === "ok"
            ? items.map((item) => (
                <ActivityRow
                  key={item.id}
                  item={item}
                  compact
                  onPress={() => onPressItem(item)}
                />
              ))
            : null}
        </ScrollView>
      )}
    </View>
  );
}

function ActivityStripEmpty({
  state,
  onExplore,
  onRetry,
}: {
  state: ActivityState;
  onExplore?: (() => void) | undefined;
  onRetry?: (() => void) | undefined;
}) {
  const copy =
    state === "error"
      ? {
          title: "No hemos podido cargar la actividad.",
          subtitle: "Toca para reintentar.",
          onPress: onRetry,
        }
      : state === "emptyNoOrbitas"
        ? {
            title: "Aun no hay actividad.",
            subtitle: "Unete a tu primera Orbita.",
            onPress: onExplore,
          }
        : {
            title: "Todo en calma.",
            subtitle: "Toca un planeta y empieza a orbitar.",
            onPress: undefined,
          };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.title}
      disabled={!copy.onPress}
      onPress={copy.onPress}
      style={({ pressed }) => [
        styles.stripEmpty,
        { opacity: pressed && copy.onPress ? 0.82 : 1 },
      ]}
    >
      <NexoMascot size={48} animated />
      <View style={styles.stripEmptyCopy}>
        <Text style={styles.stripEmptyTitle}>{copy.title}</Text>
        <Text style={styles.stripEmptyText}>{copy.subtitle}</Text>
      </View>
    </Pressable>
  );
}

function ActivityHeader({
  compact = false,
  onViewMore,
}: {
  compact?: boolean;
  onViewMore?: (() => void) | undefined;
}) {
  const theme = useTheme();

  return (
    <View style={[styles.header, compact ? styles.headerCompact : null]}>
      <Text style={[styles.title, compact ? styles.titleCompact : null]}>
        Actividad reciente
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver mas actividad"
        disabled={!onViewMore}
        onPress={onViewMore}
        style={({ pressed }) => [
          styles.viewMore,
          { opacity: !onViewMore ? 0.44 : pressed ? 0.64 : 1 },
        ]}
      >
        <Text style={[styles.viewMoreText, { color: theme.colors.secondary }]}>
          Ver mas
        </Text>
      </Pressable>
    </View>
  );
}

function ActivityRow({
  item,
  compact = false,
  onPress,
}: {
  item: HomeActivityItem;
  compact?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  const color = kindColor[item.kind];
  const avatarSize = compact ? 32 : 36;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={item.text}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        compact ? styles.rowCompact : null,
        {
          backgroundColor: pressed
            ? "rgba(255,255,255,0.04)"
            : "rgba(255,255,255,0.025)",
          borderColor: "rgba(255,255,255,0.06)",
        },
      ]}
    >
      <View style={styles.avatarWrap}>
        <Avatar
          uri={item.community.avatar_url}
          label={item.community.name}
          size={avatarSize}
        />
        <View
          style={[
            styles.iconBadge,
            {
              borderColor: color,
              backgroundColor: theme.colors.surface,
            },
          ]}
        >
          <ActivityIcon kind={item.kind} color={color} size={10} />
        </View>
      </View>
      <View style={styles.copy}>
        <Text style={styles.rowText} numberOfLines={2}>
          {item.text}
        </Text>
        <Text style={styles.timeText} numberOfLines={1}>
          {item.time}
        </Text>
      </View>
    </Pressable>
  );
}

function ActivitySkeleton({ count }: { count: number }) {
  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={styles.skeletonRow} />
      ))}
    </View>
  );
}

function ActivityStripSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonCard} />
      ))}
    </>
  );
}

function ActivityEmpty({
  title,
  subtitle,
  ctaLabel,
  onPress,
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string | undefined;
  onPress?: (() => void) | undefined;
}) {
  return (
    <View style={styles.empty}>
      <NexoMascot size={72} animated />
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{subtitle}</Text>
      {ctaLabel ? (
        <Button
          title={ctaLabel}
          size="sm"
          gradient={["#7B5CFF", "#18D7FF"]}
          onPress={onPress}
          style={styles.emptyButton}
          textStyle={styles.emptyButtonText}
        />
      ) : null}
    </View>
  );
}

function ActivityError({ onRetry }: { onRetry?: (() => void) | undefined }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorTitle}>No hemos podido cargar la actividad.</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Reintentar actividad"
        onPress={onRetry}
        style={styles.retryButton}
      >
        <RefreshCcw size={12} color="#F6F7FB" />
        <Text style={styles.retryText}>Reintentar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    position: "relative",
    flex: 1,
    height: "100%",
    padding: 14,
    gap: 10,
  },
  header: {
    minHeight: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCompact: {
    minHeight: 20,
    paddingHorizontal: 4,
  },
  title: {
    color: "#F6F7FB",
    fontSize: typography.body,
    fontWeight: "700",
  },
  titleCompact: {
    fontSize: typography.small,
  },
  viewMore: {
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  viewMoreText: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  columnList: {
    gap: 8,
    paddingBottom: 4,
  },
  strip: {
    minHeight: 112,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 8,
    gap: 6,
  },
  stripList: {
    gap: 8,
    paddingRight: 12,
  },
  row: {
    minHeight: 64,
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  rowCompact: {
    width: 224,
    minHeight: 76,
    padding: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  iconBadge: {
    position: "absolute",
    right: -3,
    bottom: -3,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  rowText: {
    color: "#B9C1D9",
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "500",
  },
  timeText: {
    marginTop: 4,
    color: "#8490B4",
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  skeletonList: {
    gap: 8,
  },
  skeletonRow: {
    height: 64,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  skeletonCard: {
    width: 224,
    height: 76,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: radius.lg,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderStyle: "dashed",
    borderRadius: 20,
    padding: 24,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  emptyTitle: {
    color: "#F6F7FB",
    fontSize: typography.small,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: "rgba(185,193,217,0.78)",
    fontSize: typography.tiny,
    lineHeight: 16,
    textAlign: "center",
  },
  emptyButton: {
    marginTop: 4,
    minHeight: 34,
  },
  emptyButtonText: {
    fontSize: typography.tiny,
  },
  error: {
    borderWidth: 1,
    borderColor: "rgba(255,92,138,0.32)",
    borderRadius: 18,
    backgroundColor: "rgba(255,92,138,0.08)",
    padding: 14,
    gap: 12,
  },
  errorTitle: {
    color: "#F6F7FB",
    fontSize: typography.small,
    fontWeight: "700",
  },
  retryButton: {
    alignSelf: "flex-start",
    minHeight: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.pill,
    paddingHorizontal: 10,
  },
  retryText: {
    color: "#F6F7FB",
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  stripEmpty: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 16,
  },
  stripEmptyCopy: {
    alignItems: "center",
    maxWidth: 280,
  },
  stripEmptyTitle: {
    color: "#F6F7FB",
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center",
  },
  stripEmptyText: {
    marginTop: 2,
    color: "rgba(185,193,217,0.82)",
    fontSize: typography.tiny,
    lineHeight: 16,
    fontWeight: "500",
    textAlign: "center",
  },
});
