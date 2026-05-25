import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Bell, Search } from "lucide-react-native";
import type { Profile } from "../../types/domain";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { NexoMascot } from "../brand/NexoMascot";
import { Avatar } from "../ui/Avatar";

export const APP_TOP_BAR_HEIGHT = 68;

function getTimeBasedGreeting() {
  const hour = new Date().getHours();

  if (hour < 6) return "Aun explorando";
  if (hour < 12) return "Buenos dias";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

type AppTopBarProps = {
  profile: Profile | null;
  onOpenSearch?: () => void;
  onOpenNotifications?: () => void;
  onOpenProfile?: () => void;
};

export function AppTopBar({
  profile,
  onOpenSearch,
  onOpenNotifications,
  onOpenProfile,
}: AppTopBarProps) {
  const theme = useTheme();
  const displayName = profile?.display_name ?? profile?.username ?? "viajero";

  return (
    <View
      style={[
        styles.root,
        {
          borderColor: theme.colors.border,
          height: APP_TOP_BAR_HEIGHT,
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
      <View style={styles.row}>
        <View style={styles.greetingWrap}>
          <View style={styles.mascotWrap}>
            <NexoMascot size={48} animated />
          </View>
          <View style={styles.greetingBlock}>
            <Text style={[styles.greetingEyebrow, { color: theme.colors.textFaint }]}>
              {getTimeBasedGreeting()}
            </Text>
            <Text style={[styles.greetingTitle, { color: theme.colors.text }]} numberOfLines={1}>
              Hola {displayName}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Buscar"
            onPress={onOpenSearch}
            style={({ pressed, hovered }) => [
              styles.iconButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: hovered
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.03)",
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Search size={17} color={theme.colors.textMuted} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Notificaciones"
            onPress={onOpenNotifications}
            style={({ pressed, hovered }) => [
              styles.iconButton,
              {
                borderColor: theme.colors.border,
                backgroundColor: hovered
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(255,255,255,0.03)",
                opacity: pressed ? 0.72 : 1,
              },
            ]}
          >
            <Bell size={17} color={theme.colors.textMuted} />
            <View
              style={[
                styles.notifDot,
                { backgroundColor: theme.colors.accent },
              ]}
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Mi perfil"
            onPress={onOpenProfile}
            style={({ pressed }) => [
              styles.avatarButton,
              {
                borderColor: theme.colors.border,
                opacity: pressed ? 0.78 : 1,
              },
            ]}
          >
            <Avatar
              uri={profile?.avatar_url}
              label={profile?.display_name ?? profile?.username ?? "Nexo"}
              size={34}
            />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    borderBottomWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(7,11,26,0.62)",
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
    backgroundColor: "rgba(7,11,26,0.4)",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    gap: 16,
  },
  greetingWrap: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mascotWrap: {
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBlock: {
    minWidth: 0,
    flex: 1,
    gap: 1,
  },
  greetingEyebrow: {
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  greetingTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 7,
    height: 7,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(7,11,26,0.9)",
  },
  avatarButton: {
    borderWidth: 1,
    borderRadius: radius.pill,
    padding: 2,
  },
});
