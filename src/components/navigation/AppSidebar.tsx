import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Radio, Users } from "lucide-react-native";
import { Avatar } from "../ui/Avatar";
import { NexoMark } from "../ui/NexoMark";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta } from "../../types/domain";
import { formatCompactNumber } from "../../utils/format";
import { CreateActionButton } from "./CreateActionButton";
import { NavItem, type NavItemConfig } from "./NavItem";

export const APP_SIDEBAR_WIDTH = 286;

type AppSidebarProps = {
  items: NavItemConfig[];
  activeRouteName: string;
  topInset: number;
  bottomInset: number;
  communities: CommunityWithMeta[];
  loadingCommunities?: boolean;
  onSelect: (item: NavItemConfig) => void;
  onOpenCommunity: (community: CommunityWithMeta) => void;
};

export function AppSidebar({
  items,
  activeRouteName,
  topInset,
  bottomInset,
  communities,
  loadingCommunities,
  onSelect,
  onOpenCommunity,
}: AppSidebarProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.root,
        {
          width: APP_SIDEBAR_WIDTH,
          paddingTop: topInset + 16,
          paddingBottom: Math.max(bottomInset, 16),
          borderColor: theme.colors.border,
        },
      ]}
    >
      <BlurView
        intensity={74}
        tint="dark"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={styles.blur}
      />
      <LinearGradient
        colors={["rgba(124,92,255,0.14)", "rgba(0,212,255,0.08)", "rgba(255,79,216,0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
      />

      <View style={styles.brand}>
        <NexoMark size={42} />
        <View style={styles.brandCopy}>
          <Text style={[styles.brandName, { color: theme.colors.text }]}>Nexo</Text>
          <Text style={[styles.brandMeta, { color: theme.colors.textFaint }]}>
            orbita social
          </Text>
        </View>
      </View>

      <View style={styles.navList}>
        {items.map((item) =>
          item.create ? (
            <CreateActionButton
              key={item.routeName}
              layout="sidebar"
              active={activeRouteName === item.routeName}
              onPress={() => onSelect(item)}
            />
          ) : (
            <NavItem
              key={item.routeName}
              item={item}
              layout="sidebar"
              active={activeRouteName === item.routeName}
              onPress={() => onSelect(item)}
            />
          ),
        )}
      </View>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Tus Orbitas</Text>
        <View style={[styles.countPill, { backgroundColor: theme.colors.elevated }]}>
          <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
            {communities.length}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.communities}
      >
        {communities.slice(0, 10).map((community) => (
          <Pressable
            key={community.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir Orbita ${community.name}`}
            onPress={() => onOpenCommunity(community)}
            style={({ pressed }) => [
              styles.communityRow,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Avatar uri={community.avatar_url} label={community.name} size={34} />
            <View style={styles.communityCopy}>
              <Text style={[styles.communityName, { color: theme.colors.text }]} numberOfLines={1}>
                {community.name}
              </Text>
              <View style={styles.communityMeta}>
                <Users size={12} color={theme.colors.textFaint} />
                <Text style={[styles.communityMetaText, { color: theme.colors.textFaint }]}>
                  {formatCompactNumber(community.member_count)}
                </Text>
                <Radio size={12} color={theme.colors.success} />
                <Text style={[styles.communityMetaText, { color: theme.colors.textFaint }]}>
                  {formatCompactNumber(community.online_count ?? 1)}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
        {!loadingCommunities && communities.length === 0 ? (
          <View style={[styles.empty, { borderColor: theme.colors.border }]}>
            <Text style={[styles.emptyText, { color: theme.colors.textFaint }]}>
              Ninguna Orbita todavia
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    borderRightWidth: 1,
    paddingHorizontal: 14,
    backgroundColor: "rgba(9,10,18,0.76)",
    overflow: "hidden",
  },
  blur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 22,
  },
  brandCopy: {
    flex: 1,
  },
  brandName: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  brandMeta: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  navList: {
    gap: 8,
    paddingBottom: 22,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  countPill: {
    minWidth: 28,
    minHeight: 24,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  countText: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  communities: {
    gap: 8,
    paddingBottom: 12,
  },
  communityRow: {
    minHeight: 58,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
  },
  communityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  communityName: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  communityMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  communityMetaText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  empty: {
    minHeight: 58,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
});
