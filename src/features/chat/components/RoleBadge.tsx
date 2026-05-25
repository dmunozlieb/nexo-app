import { StyleSheet, Text, View } from "react-native";
import { Crown, Shield, ShieldCheck, UserX } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ChatRole } from "../../../types/domain";

type RoleBadgeProps = {
  role: ChatRole;
  variant?: "compact" | "full";
};

const ROLE_LABEL: Record<ChatRole, string> = {
  admin: "Admin",
  co_admin: "Co-admin",
  member: "Miembro",
  banned: "Baneado",
};

export function RoleBadge({ role, variant = "compact" }: RoleBadgeProps) {
  const theme = useTheme();

  if (role === "member") {
    return null;
  }

  const { backgroundColor, borderColor, color, Icon } = (() => {
    switch (role) {
      case "admin":
        return {
          backgroundColor: "rgba(255,196,80,0.14)",
          borderColor: "rgba(255,196,80,0.55)",
          color: "#FFC450",
          Icon: Crown,
        };
      case "co_admin":
        return {
          backgroundColor: `${theme.colors.secondary}22`,
          borderColor: `${theme.colors.secondary}66`,
          color: theme.colors.secondary,
          Icon: ShieldCheck,
        };
      case "banned":
        return {
          backgroundColor: `${theme.colors.error}1A`,
          borderColor: `${theme.colors.error}66`,
          color: theme.colors.error,
          Icon: UserX,
        };
      default:
        return {
          backgroundColor: "transparent",
          borderColor: "transparent",
          color: theme.colors.textMuted,
          Icon: Shield,
        };
    }
  })();

  return (
    <View
      style={[
        styles.pill,
        variant === "full" ? styles.pillFull : styles.pillCompact,
        { backgroundColor, borderColor },
      ]}
    >
      <Icon size={variant === "full" ? 12 : 10} color={color} />
      {variant === "full" ? (
        <Text style={[styles.text, { color }]}>{ROLE_LABEL[role]}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.pill,
  },
  pillCompact: {
    width: 18,
    height: 18,
    justifyContent: "center",
  },
  pillFull: {
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
});
