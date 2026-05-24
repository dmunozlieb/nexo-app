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
    outputRange: [1, 1.07],
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
        accessibilityLabel="Crear"
        accessibilityState={{ selected: active }}
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.sidebarButton,
          {
            backgroundColor: hovered || active ? theme.colors.surface : "rgba(255,255,255,0.04)",
            opacity: pressed ? 0.82 : 1,
            borderColor: active ? theme.colors.secondary : "rgba(255,255,255,0.14)",
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
      accessibilityLabel="Crear"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.bottomButton, { opacity: pressed ? 0.84 : 1 }]}
    >
      <Animated.View style={[styles.bottomMotion, { transform: [{ scale }] }]}>
        <View style={styles.bottomHalo} />
        <LinearGradient
          colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bottomCircle}
        >
          <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        </LinearGradient>
      </Animated.View>
      <Text style={styles.bottomLabel}>Crear</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bottomButton: {
    width: 68,
    minHeight: 72,
    alignItems: "center",
    justifyContent: "flex-start",
    marginTop: -25,
  },
  bottomMotion: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomHalo: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,212,255,0.18)",
    shadowColor: "#00D4FF",
    shadowOpacity: 0.62,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  bottomCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
  },
  bottomLabel: {
    color: "#FFFFFF",
    fontSize: typography.tiny,
    fontWeight: "900",
    marginTop: 2,
  },
  sidebarButton: {
    minHeight: 50,
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
  },
  sidebarContent: {
    minHeight: 50,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 13,
  },
  sidebarIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarText: {
    color: "#FFFFFF",
    fontSize: typography.body,
    fontWeight: "900",
  },
});
