import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRight, Flame, Users } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { CommunityBanner } from "../../../components/content/CommunityBanner";
import { OnlineIndicator } from "../../../components/content/OnlineIndicator";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";
import { formatCompactNumber, formatRelativeDate } from "../../../utils/format";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { SignalChips } from "../../../components/content/SignalChips";
import { BREAKPOINTS } from "../constants";
import { onlineOf } from "../helpers";

type FeaturedHeroProps = {
  community: CommunityWithMeta;
  onOpen: (community: CommunityWithMeta) => void;
};

export function FeaturedHero({ community, onOpen }: FeaturedHeroProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const wide = width >= BREAKPOINTS.tablet;

  const minHeight = wide ? 320 : 360;
  const pad = wide ? 28 : 18;
  const titleSize = width >= BREAKPOINTS.desktop ? 36 : wide ? 32 : 26;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir orbita destacada ${community.name}`}
      onPress={() => onOpen(community)}
      style={({ hovered, pressed }) => [
        styles.card,
        hoverTransition,
        pointerStyle,
        {
          borderColor: hovered ? theme.colors.secondary : theme.colors.border,
          transform: [{ translateY: hovered ? -2 : 0 }],
          opacity: pressed ? 0.97 : 1,
        },
      ]}
    >
      <View style={StyleSheet.absoluteFill}>
        <CommunityBanner
          uri={community.banner_url}
          name={community.name}
          category={community.category}
        />
      </View>
      <LinearGradient
        colors={["rgba(7,11,26,0.15)", "rgba(7,11,26,0.55)", "rgba(7,11,26,0.94)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.body, { minHeight, padding: pad }]}>
        <View style={[styles.tag, { backgroundColor: theme.colors.featured }]}>
          <Flame size={13} color="#0a0a14" />
          <Text style={styles.tagText}>Orbita destacada</Text>
        </View>

        <View style={styles.identityRow}>
          <View style={styles.avatarWrap}>
            <Avatar uri={community.avatar_url} label={community.name} size={60} />
          </View>
          <View style={styles.identityCopy}>
            <Text style={[styles.name, { fontSize: titleSize }]} numberOfLines={2}>
              {community.name}
            </Text>
            <Text style={[styles.category, { color: theme.colors.secondary }]} numberOfLines={1}>
              {community.category ?? "General"} · orbita publica
            </Text>
          </View>
        </View>

        <Text style={[styles.description, { color: theme.colors.text }]} numberOfLines={3}>
          {community.description ?? "Comunidad preparada para nuevos ecos."}
        </Text>

        <SignalChips community={community} limit={4} />

        <View style={[styles.foot, wide ? styles.footWide : null]}>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Users size={14} color={theme.colors.textFaint} />
              <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
                {formatCompactNumber(community.member_count)} miembros
              </Text>
            </View>
            <OnlineIndicator count={onlineOf(community)} solid />
            <Text style={[styles.metaText, { color: theme.colors.textFaint }]}>
              Senal {formatRelativeDate(community.updated_at)}
            </Text>
          </View>
          <View style={styles.cta}>
            <LinearGradient
              colors={[theme.colors.primary, theme.colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.ctaInner}>
              <Text style={styles.ctaText}>Entrar a la orbita</Text>
              <ArrowRight size={17} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  body: {
    flex: 1,
    gap: 14,
    justifyContent: "flex-end",
  },
  tag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  tagText: {
    fontSize: typography.tiny,
    fontWeight: "900",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    color: "#0a0a14",
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.18)",
    overflow: "hidden",
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    color: "#FFFFFF",
    fontWeight: "900",
    letterSpacing: -0.4,
    lineHeight: 38,
  },
  category: {
    fontSize: typography.small,
    fontWeight: "800",
    marginTop: 3,
  },
  description: {
    fontSize: typography.body,
    lineHeight: 22,
    opacity: 0.86,
    maxWidth: 540,
  },
  foot: {
    gap: 14,
  },
  footWide: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metaText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  cta: {
    alignSelf: "flex-start",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  ctaInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    zIndex: 1,
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "800",
  },
});
