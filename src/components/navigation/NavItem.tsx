import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

export type NavItemLayout = "bottom" | "sidebar";

export type NavItemConfig = {
  routeName: string;
  label: string;
  href: string;
  icon: (props: { size: number; color: string }) => ReactNode;
  create?: boolean;
};

type NavItemProps = {
  item: NavItemConfig;
  active: boolean;
  layout: NavItemLayout;
  onPress: () => void;
};

export function NavItem({ item, active, layout, onPress }: NavItemProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const motion = useRef(new Animated.Value(active ? 1 : 0)).current;
  const interactive = hovered || focused;
  const isSidebar = layout === "sidebar";
  const iconColor = active
    ? "#FFFFFF"
    : isSidebar
      ? theme.colors.textMuted
      : theme.colors.textFaint;
  const size = isSidebar ? 18 : 20;
  const scale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, isSidebar ? 1.0 : 1.08],
  });

  useEffect(() => {
    Animated.timing(motion, {
      toValue: active ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [active, motion]);

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={item.label}
      accessibilityState={{ selected: active }}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isSidebar ? styles.sidebar : styles.bottom,
        isSidebar
          ? {
              backgroundColor: active
                ? "rgba(123,92,255,0.16)"
                : interactive
                  ? "rgba(255,255,255,0.05)"
                  : "transparent",
              borderColor: active
                ? "rgba(123,92,255,0.35)"
                : "transparent",
              opacity: pressed ? 0.82 : 1,
            }
          : { opacity: pressed ? 0.78 : 1 },
      ]}
    >
      {active && isSidebar ? (
        <View
          style={[styles.sidebarIndicator, { backgroundColor: theme.colors.primary }]}
        />
      ) : null}
      <Animated.View
        style={[
          isSidebar ? styles.sidebarIconWrap : styles.bottomIconWrap,
          { transform: [{ scale }] },
        ]}
      >
        {item.icon({ size, color: iconColor })}
      </Animated.View>
      <Text
        style={[
          isSidebar ? styles.sidebarLabel : styles.bottomLabel,
          {
            color: active
              ? "#FFFFFF"
              : isSidebar
                ? theme.colors.textMuted
                : theme.colors.textFaint,
            fontWeight: active ? "600" : "500",
          },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
      {!isSidebar && active ? (
        <View
          style={[styles.bottomActiveDot, { backgroundColor: theme.colors.primary }]}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "relative",
    overflow: "hidden",
  },
  bottom: {
    width: 56,
    minHeight: 58,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  sidebar: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: radius.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  sidebarIndicator: {
    position: "absolute",
    left: 0,
    top: "50%",
    marginTop: -10,
    width: 3,
    height: 20,
    borderTopRightRadius: 3,
    borderBottomRightRadius: 3,
  },
  bottomActiveDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    shadowColor: "#7B5CFF",
    shadowOpacity: 0.8,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  bottomIconWrap: {
    width: 27,
    height: 27,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarIconWrap: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomLabel: {
    fontSize: 10,
    fontWeight: "500",
  },
  sidebarLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
