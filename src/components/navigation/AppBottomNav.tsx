import { StyleSheet, View } from "react-native";
import { BlurView } from "expo-blur";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { CreateActionButton } from "./CreateActionButton";
import { NavItem, type NavItemConfig } from "./NavItem";

type AppBottomNavProps = {
  items: NavItemConfig[];
  activeRouteName: string;
  bottomInset: number;
  onSelect: (item: NavItemConfig) => void;
};

export function AppBottomNav({
  items,
  activeRouteName,
  bottomInset,
  onSelect,
}: AppBottomNavProps) {
  const theme = useTheme();
  const createItem = items.find((item) => item.create);
  const regularItems = items.filter((item) => !item.create);
  const leadingItems = regularItems.slice(0, 2);
  const trailingItems = regularItems.slice(2);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: Math.max(bottomInset, 10) }]}
    >
      <View
        style={[
          styles.shell,
          {
            borderColor: theme.colors.border,
            shadowColor: theme.colors.secondary,
          },
        ]}
      >
        <BlurView
          intensity={82}
          tint="dark"
          blurMethod="dimezisBlurViewSdk31Plus"
          style={styles.blur}
        >
          <View style={styles.tint} />
          <View style={styles.row}>
            {leadingItems.map((item) => (
              <NavItem
                key={item.routeName}
                item={item}
                layout="bottom"
                active={activeRouteName === item.routeName}
                onPress={() => onSelect(item)}
              />
            ))}
            {createItem ? (
              <CreateActionButton
                layout="bottom"
                active={activeRouteName === createItem.routeName}
                onPress={() => onSelect(createItem)}
              />
            ) : null}
            {trailingItems.map((item) => (
              <NavItem
                key={item.routeName}
                item={item}
                layout="bottom"
                active={activeRouteName === item.routeName}
                onPress={() => onSelect(item)}
              />
            ))}
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "absolute",
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: 12,
  },
  shell: {
    width: "100%",
    maxWidth: 430,
    minHeight: 74,
    borderWidth: 1,
    borderRadius: 32,
    overflow: "hidden",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  blur: {
    minHeight: 74,
    justifyContent: "center",
  },
  tint: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(9,10,18,0.72)",
    borderRadius: radius.pill,
  },
  row: {
    minHeight: 74,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
});
