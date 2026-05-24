import { useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius, typography } from "../../theme/tokens";
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
  const iconColor = active ? "#FFFFFF" : theme.colors.textMuted;
  const size = layout === "bottom" ? 22 : 19;
  const scale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, layout === "bottom" ? 1.08 : 1.02],
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
        layout === "bottom" ? styles.bottom : styles.sidebar,
        {
          backgroundColor:
            layout === "sidebar" && interactive && !active
              ? `${theme.colors.elevated}AA`
              : "transparent",
          borderColor:
            layout === "sidebar"
              ? active
                ? theme.colors.secondary
                : interactive
                  ? theme.colors.primary
                  : "transparent"
              : "transparent",
          opacity: pressed ? 0.78 : 1,
        },
      ]}
    >
      {active ? (
        <LinearGradient
          colors={[`${theme.colors.primary}D9`, `${theme.colors.secondary}5C`]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.activeGlow,
            layout === "bottom" ? styles.bottomGlow : styles.sidebarGlow,
          ]}
        />
      ) : null}
      <Animated.View
        style={[
          layout === "bottom" ? styles.bottomIconWrap : styles.sidebarIconWrap,
          { transform: [{ scale }] },
        ]}
      >
        {active ? <View style={styles.orbitRing} /> : null}
        {item.icon({ size, color: iconColor })}
      </Animated.View>
      <Text
        style={[
          layout === "bottom" ? styles.bottomLabel : styles.sidebarLabel,
          { color: active ? "#FFFFFF" : theme.colors.textMuted },
        ]}
        numberOfLines={1}
      >
        {item.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: "relative",
    overflow: "hidden",
  },
  bottom: {
    width: 58,
    minHeight: 58,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  sidebar: {
    minHeight: 46,
    borderWidth: 1,
    borderRadius: radius.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  activeGlow: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  bottomGlow: {
    borderRadius: radius.lg,
    opacity: 0.56,
  },
  sidebarGlow: {
    borderRadius: radius.md,
    opacity: 0.48,
  },
  bottomIconWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarIconWrap: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  orbitRing: {
    position: "absolute",
    width: 28,
    height: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.74)",
    transform: [{ rotate: "-24deg" }],
  },
  bottomLabel: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  sidebarLabel: {
    flex: 1,
    fontSize: typography.body,
    fontWeight: "900",
  },
});
