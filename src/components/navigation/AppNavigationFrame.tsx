import type { PropsWithChildren } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { router, usePathname, type Href } from "expo-router";
import {
  Compass,
  Home,
  MessageSquare,
  Plus,
  UserRound,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useJoinedCommunities } from "../../features/communities/hooks/useCommunities";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta } from "../../types/domain";
import { AppBottomNav } from "./AppBottomNav";
import { AppSidebar, APP_SIDEBAR_WIDTH } from "./AppSidebar";
import type { NavItemConfig } from "./NavItem";

const DESKTOP_WIDTH = 980;
const MOBILE_NAV_SPACE = 90;

const NAV_ITEMS: NavItemConfig[] = [
  {
    routeName: "home",
    label: "Inicio",
    href: "/home",
    icon: ({ size, color }) => <Home size={size} color={color} />,
  },
  {
    routeName: "discover",
    label: "Explorar",
    href: "/discover",
    icon: ({ size, color }) => <Compass size={size} color={color} />,
  },
  {
    routeName: "create",
    label: "Crear Orbita",
    href: "/community/create",
    icon: ({ size, color }) => <Plus size={size} color={color} />,
    create: true,
  },
  {
    routeName: "chat",
    label: "Chats",
    href: "/chat",
    icon: ({ size, color }) => <MessageSquare size={size} color={color} />,
  },
  {
    routeName: "profile",
    label: "Perfil",
    href: "/profile",
    icon: ({ size, color }) => <UserRound size={size} color={color} />,
  },
];

export function AppNavigationFrame({ children }: PropsWithChildren) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const theme = useTheme();
  const auth = useAuth();
  const joinedCommunities = useJoinedCommunities(auth.session?.user.id);
  const isDesktop = width >= DESKTOP_WIDTH;
  const activeRouteName = getActiveRouteName(pathname);

  function handleSelect(item: NavItemConfig) {
    if (activeRouteName === item.routeName && pathname === item.href) {
      return;
    }

    router.push(item.href as Href);
  }

  function handleOpenCommunity(community: CommunityWithMeta) {
    router.push({ pathname: "/community/[id]", params: { id: community.id } });
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      {isDesktop ? (
        <AppSidebar
          items={NAV_ITEMS}
          activeRouteName={activeRouteName}
          topInset={insets.top}
          bottomInset={insets.bottom}
          communities={joinedCommunities.data ?? []}
          loadingCommunities={joinedCommunities.isLoading}
          onSelect={handleSelect}
          onOpenCommunity={handleOpenCommunity}
        />
      ) : null}
      <View
        style={[
          styles.scene,
          isDesktop
            ? { marginLeft: APP_SIDEBAR_WIDTH }
            : { paddingBottom: MOBILE_NAV_SPACE },
        ]}
      >
        {children}
      </View>
      {!isDesktop ? (
        <AppBottomNav
          items={NAV_ITEMS}
          activeRouteName={activeRouteName}
          bottomInset={insets.bottom}
          onSelect={handleSelect}
        />
      ) : null}
    </View>
  );
}

function getActiveRouteName(pathname: string) {
  if (pathname.startsWith("/discover")) {
    return "discover";
  }

  if (
    pathname.startsWith("/create") ||
    pathname.startsWith("/community/create")
  ) {
    return "create";
  }

  if (pathname.startsWith("/chat")) {
    return "chat";
  }

  if (pathname.startsWith("/profile")) {
    return "profile";
  }

  return "home";
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scene: {
    flex: 1,
  },
});
