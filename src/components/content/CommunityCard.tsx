import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Hash, Lock, Radio, Signal, Users } from "lucide-react-native";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta } from "../../types/domain";
import { formatCompactNumber } from "../../utils/format";
import { Avatar } from "../ui/Avatar";
import { Badge } from "../ui/Badge";

type CommunityCardProps = {
  community: CommunityWithMeta;
  onPress?: () => void;
};

export function CommunityCard({ community, onPress }: CommunityCardProps) {
  const theme = useTheme();
  const isPrivate = community.visibility === "private";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir Orbita ${community.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <View style={styles.banner}>
        {community.banner_url ? (
          <Image
            source={{ uri: community.banner_url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        ) : (
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        <View style={styles.bannerOverlay}>
          <Radio size={15} color="#FFFFFF" />
          <Text style={styles.bannerText}>Orbita activa</Text>
        </View>
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
            <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={1}>
              {community.name}
            </Text>
          </View>
          <Text
            style={[styles.description, { color: theme.colors.textMuted }]}
            numberOfLines={2}
          >
            {community.description ?? "Una Orbita lista para nuevos ecos."}
          </Text>
          <View style={styles.meta}>
            <Users size={14} color={theme.colors.textFaint} />
            <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
              {formatCompactNumber(community.member_count)} miembros
            </Text>
            <Signal size={14} color={theme.colors.success} />
            <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
              {formatCompactNumber(community.online_count ?? 1)} online
            </Text>
            {community.category ? <Badge label={community.category} tone="secondary" /> : null}
          </View>
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
  },
  banner: {
    height: 92,
    width: "100%",
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bannerOverlay: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    margin: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(9,10,18,0.42)",
  },
  bannerText: {
    color: "#FFFFFF",
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  body: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
    paddingTop: 10,
  },
  avatarLift: {
    marginTop: -32,
    width: 62,
    height: 62,
    borderRadius: 31,
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
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaText: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
