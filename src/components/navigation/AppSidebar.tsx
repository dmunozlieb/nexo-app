import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Settings } from "lucide-react-native";
import { Avatar } from "../ui/Avatar";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta, Profile } from "../../types/domain";
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
        intensity={70}
        tint="dark"
        blurMethod="dimezisBlurViewSdk31Plus"
        style={styles.blur}
      />
      <View style={styles.tint} />

      <View style={styles.brand}>
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.brandMark}
        >
          <Text style={styles.brandMarkText}>N</Text>
        </LinearGradient>
        <Text style={[styles.brandName, { color: theme.colors.text }]}>Nexo</Text>
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

      <View style={styles.sectionDivider} />
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.secondary }]}>
          Tus Orbitas
        </Text>
      </View>

      <ScrollView
        style={styles.communitiesScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.communities}
      >
        {communities.slice(0, 10).map((community) => {
          const isLive = (community.online_count ?? 0) > 0;

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
                    ? "rgba(255,255,255,0.05)"
                    : "transparent",
                  opacity: pressed ? 0.78 : 1,
                },
              ]}
            >
              <Avatar uri={community.avatar_url} label={community.name} size={28} />
              <Text
                style={[styles.communityName, { color: theme.colors.text }]}
                numberOfLines={1}
              >
                {community.name}
              </Text>
              {isLive ? (
                <View
                  style={[
                    styles.communityOnlineDot,
                    { backgroundColor: theme.colors.success },
                  ]}
                />
              ) : null}
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
        <Settings size={16} color={theme.colors.textFaint} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRightWidth: 1,
    paddingHorizontal: 14,
    backgroundColor: "rgba(26,34,68,0.55)",
    overflow: "hidden",
  },
  blur: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  tint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(26,34,68,0.28)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingBottom: 24,
  },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7B5CFF",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  brandMarkText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  brandName: {
    fontSize: typography.h3,
    fontWeight: "700",
  },
  navList: {
    gap: 6,
    paddingBottom: 4,
  },
  sectionDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 18,
  },
  sectionHeader: {
    paddingBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: typography.tiny,
    fontWeight: "600",
    letterSpacing: 0.6,
  },
  communitiesScroll: {
    flex: 1,
  },
  communities: {
    gap: 2,
    paddingBottom: 12,
  },
  communityRow: {
    minHeight: 40,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  communityName: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.small,
    fontWeight: "500",
  },
  communityOnlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowColor: "#22E6B9",
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
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
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  profileFooterCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileFooterName: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  profileFooterHandle: {
    fontSize: typography.tiny,
    fontWeight: "500",
  },
});
