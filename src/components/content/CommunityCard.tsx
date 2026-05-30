import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { ChevronRight, Hash, Lock, Users } from "lucide-react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { hoverTransition, pointerStyle } from "../../utils/web-style";
import type { CommunityWithMeta } from "../../types/domain";
import { formatCompactNumber, formatRelativeDate } from "../../utils/format";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";
import { CommunityBanner } from "./CommunityBanner";
import { OnlineIndicator } from "./OnlineIndicator";

type CommunityCardProps = {
  community: CommunityWithMeta;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function CommunityCard({ community, onPress, style }: CommunityCardProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPrivate = community.visibility === "private";
  const interactive = hovered || focused;
  const onlineCount = community.online_count ?? Math.max(1, Math.ceil(community.member_count * 0.35));
  const fallbackDescription =
    "Comparte ideas, debates y contenido con personas de tu misma orbita.";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir Orbita ${community.name}`}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        hoverTransition,
        pointerStyle,
        {
          backgroundColor: theme.colors.surface,
          borderColor: interactive ? theme.colors.secondary : theme.colors.border,
          opacity: pressed ? 0.92 : 1,
          shadowColor: interactive ? theme.colors.secondary : "#000000",
          shadowOpacity: interactive ? 0.22 : 0.08,
          shadowRadius: interactive ? 18 : 10,
          transform: [{ translateY: pressed ? 1 : interactive ? -2 : 0 }, { scale: pressed ? 0.985 : 1 }],
        },
        style,
      ]}
    >
      <View style={styles.banner}>
        <CommunityBanner
          uri={community.banner_url}
          name={community.name}
          category={community.category}
        />
      </View>
      <View style={styles.body}>
        <View style={[styles.avatarLift, { backgroundColor: theme.colors.surface }]}>
          <Avatar uri={community.avatar_url} label={community.name} size={54} />
        </View>
        <View style={styles.copy}>
          <View style={styles.titleRow}>
            {isPrivate ? (
              <Lock size={16} color={theme.colors.warning} />
            ) : (
              <Hash size={16} color={theme.colors.secondary} />
            )}
            <Text
              style={[
                styles.title,
                { color: interactive ? "#FFFFFF" : theme.colors.text },
              ]}
              numberOfLines={1}
            >
              {community.name}
            </Text>
            <ChevronRight
              size={18}
              color={interactive ? theme.colors.secondary : theme.colors.textFaint}
            />
          </View>
          <Text
            style={[styles.description, { color: theme.colors.textMuted }]}
            numberOfLines={2}
          >
            {community.description ?? fallbackDescription}
          </Text>
          <View style={styles.meta}>
            <Users size={14} color={theme.colors.textFaint} />
            <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
              {formatCompactNumber(community.member_count)} miembros
            </Text>
            <OnlineIndicator count={onlineCount} compact />
            {community.category ? <Badge label={community.category} tone="secondary" /> : null}
          </View>
          <Text style={[styles.activity, { color: theme.colors.textFaint }]} numberOfLines={1}>
            Senal reciente {formatRelativeDate(community.updated_at)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
  },
  banner: {
    height: 138,
    width: "100%",
    justifyContent: "flex-start",
    overflow: "hidden",
  },
  body: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    paddingTop: 12,
  },
  avatarLift: {
    marginTop: -40,
    width: 66,
    height: 66,
    borderRadius: 33,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    flex: 1,
    fontSize: typography.h3,
    fontWeight: "900",
  },
  description: {
    fontSize: typography.small,
    lineHeight: 18,
    // Reserva 2 lineas siempre para que todas las tarjetas midan igual.
    minHeight: 36,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  activity: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
