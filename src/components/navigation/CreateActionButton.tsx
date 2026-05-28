import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Plus } from "lucide-react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { NavItemLayout } from "./NavItem";

type CreateActionButtonProps = {
  active: boolean;
  layout: NavItemLayout;
  onPress: () => void;
};

export function CreateActionButton({
  active,
  layout,
  onPress,
}: CreateActionButtonProps) {
  const theme = useTheme();
  const [hovered, setHovered] = useState(false);
  const motion = useRef(new Animated.Value(active ? 1 : 0)).current;
  const scale = motion.interpolate({
    inputRange: [0, 1],
    outputRange: [1, layout === "bottom" ? 1.045 : 1.07],
  });

  useEffect(() => {
    Animated.spring(motion, {
      toValue: active ? 1 : 0,
      tension: 150,
      friction: 16,
      useNativeDriver: true,
    }).start();
  }, [active, motion]);

  if (layout === "sidebar") {
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Crear Orbita"
        accessibilityState={{ selected: active }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.sidebarButton,
          {
            backgroundColor:
              hovered || active
                ? theme.colors.surface
                : "rgba(255,255,255,0.04)",
            opacity: pressed ? 0.82 : 1,
            borderColor: active
              ? theme.colors.secondary
              : "rgba(255,255,255,0.14)",
          },
        ]}
      >
        <View style={styles.sidebarContent}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sidebarIcon}
          >
            <Plus size={18} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.sidebarText}>Crear Orbita</Text>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel="Crear Orbita"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bottomButton,
        { opacity: pressed ? 0.84 : 1 },
      ]}
    >
      <Animated.View style={[styles.bottomMotion, { transform: [{ scale }] }]}>
        <View style={styles.bottomHalo} />
        <LinearGradient
          colors={[
            theme.colors.primary,
            theme.colors.secondary,
            theme.colors.accent,
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomCircle}
        >
          <Plus size={19} color="#FFFFFF" strokeWidth={3} />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomButton: {
    width: 52,
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomMotion: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomHalo: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(24,215,255,0.10)",
    shadowColor: "#18D7FF",
    shadowOpacity: 0.36,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  bottomCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.34)",
  },
  sidebarButton: {
    minHeight: 44,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
  },
  sidebarContent: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
  },
  sidebarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
