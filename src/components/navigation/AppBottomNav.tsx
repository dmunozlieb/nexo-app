import { StyleSheet, View } from "react-native";
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
  const createItem = items.find((item) => item.create);
  const regularItems = items.filter((item) => !item.create);
  const leadingItems = regularItems.slice(0, 2);
  const trailingItems = regularItems.slice(2);

  return (
    <View
      pointerEvents="box-none"
      style={[styles.root, { paddingBottom: Math.max(bottomInset, 8) }]}
    >
      <View style={styles.shell}>
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
    paddingHorizontal: 12,
    paddingTop: 6,
  },
  shell: {
    width: "100%",
    // Topa antes para que en tablet la barra sea una pildora compacta centrada
    // en vez de estirar los iconos de borde a borde. En movil estrecho sigue
    // ocupando el ancho disponible.
    maxWidth: 480,
    minHeight: 46,
    justifyContent: "center",
  },
  row: {
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 12,
  },
});
