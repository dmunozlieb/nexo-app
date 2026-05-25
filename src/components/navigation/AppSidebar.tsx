import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronRight, Settings } from "lucide-react-native";
import { Avatar } from "../ui/Avatar";
import { NexoMark } from "../ui/NexoMark";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta, Profile } from "../../types/domain";
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
  profile: Profile | null;
  onSelect: (item: NavItemConfig) => void;
  onOpenCommunity: (community: CommunityWithMeta) => void;
  onOpenProfile?: () => void;
};

export function AppSidebar({
  items,
  activeRouteName,
  topInset,
  bottomInset,
  communities,
  loadingCommunities,
  profile,
  onSelect,
  onOpenCommunity,
  onOpenProfile,
}: AppSidebarProps) {
  const theme = useTheme();
  const displayName = profile?.display_name ?? profile?.username ?? "viajero";
  const handleLabel = profile?.username ? `@${profile.username}` : "Nexo";

  return (
    <View
      style={[
        styles.root,
        {
          width: APP_SIDEBAR_WIDTH,
          paddingTop: topInset + 18,
          paddingBottom: Math.max(bottomInset, 14),
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
        colors={["rgba(124,92,255,0.12)", "rgba(0,212,255,0.06)", "rgba(255,79,216,0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.backdrop}
      />

      <View style={styles.brand}>
        <NexoMark size={40} />
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
        <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>Tus Orbitas</Text>
        <View style={[styles.countPill, { backgroundColor: "rgba(255,255,255,0.06)" }]}>
          <Text style={[styles.countText, { color: theme.colors.textMuted }]}>
            {communities.length}
          </Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.communities}
      >
        {communities.slice(0, 10).map((community) => {
          const online = community.online_count ?? 0;
          const isLive = online > 0;

          return (
            <Pressable
              key={community.id}
              accessibilityRole="button"
              accessibilityLabel={`Abrir Orbita ${community.name}`}
              onPress={() => onOpenCommunity(community)}
              style={({ pressed, hovered }) => [
                styles.communityRow,
                {
                  backgroundColor: hovered
                    ? "rgba(255,255,255,0.06)"
                    : "transparent",
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <View style={styles.communityAvatarWrap}>
                <Avatar uri={community.avatar_url} label={community.name} size={32} />
                {isLive ? (
                  <View
                    style={[
                      styles.communityLiveDot,
                      { backgroundColor: theme.colors.success },
                    ]}
                  />
                ) : null}
              </View>
              <View style={styles.communityCopy}>
                <Text
                  style={[styles.communityName, { color: theme.colors.text }]}
                  numberOfLines={1}
                >
                  {community.name}
                </Text>
                <Text
                  style={[styles.communityMetaText, { color: theme.colors.textFaint }]}
                  numberOfLines={1}
                >
                  {formatCompactNumber(community.member_count)} miembros
                  {isLive ? ` - ${formatCompactNumber(online)} online` : ""}
                </Text>
              </View>
            </Pressable>
          );
        })}
        {!loadingCommunities && communities.length === 0 ? (
          <View style={[styles.empty, { borderColor: theme.colors.border }]}>
            <Text style={[styles.emptyText, { color: theme.colors.textFaint }]}>
              Ninguna Orbita todavia
            </Text>
          </View>
        ) : null}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Abrir mi perfil"
        onPress={onOpenProfile}
        style={({ pressed, hovered }) => [
          styles.profileFooter,
          {
            borderColor: theme.colors.border,
            backgroundColor: hovered
              ? "rgba(255,255,255,0.06)"
              : "rgba(7,11,26,0.42)",
            opacity: pressed ? 0.82 : 1,
          },
        ]}
      >
        <Avatar
          uri={profile?.avatar_url}
          label={displayName}
          size={36}
        />
        <View style={styles.profileFooterCopy}>
          <Text
            style={[styles.profileFooterName, { color: theme.colors.text }]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text
            style={[styles.profileFooterHandle, { color: theme.colors.textFaint }]}
            numberOfLines={1}
          >
            {handleLabel}
          </Text>
        </View>
        <Settings size={15} color={theme.colors.textFaint} />
        <ChevronRight size={14} color={theme.colors.textFaint} />
      </Pressable>
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
    fontWeight: "700",
    letterSpacing: 0.2,
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
    fontWeight: "700",
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
    gap: 2,
    paddingBottom: 12,
  },
  communityRow: {
    minHeight: 48,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  communityAvatarWrap: {
    position: "relative",
  },
  communityLiveDot: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#070B1A",
  },
  communityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  communityName: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  communityMetaText: {
    fontSize: typography.tiny,
    fontWeight: "700",
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
  profileFooter: {
    marginTop: 10,
    minHeight: 56,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  profileFooterCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileFooterName: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  profileFooterHandle: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
