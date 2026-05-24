import { StyleSheet, Text, View } from "react-native";
import { Radio } from "lucide-react-native";
import { Avatar } from "../ui/Avatar";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityMemberWithProfile } from "../../types/domain";

type OnlineUsersBarProps = {
  members: CommunityMemberWithProfile[];
  onlineCount?: number | undefined;
};

export function OnlineUsersBar({ members, onlineCount }: OnlineUsersBarProps) {
  const theme = useTheme();
  const shown = members.slice(0, 6);
  const count = onlineCount ?? Math.max(1, Math.ceil(members.length * 0.45));

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: theme.colors.elevated, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.copy}>
        <Radio size={16} color={theme.colors.success} />
        <Text style={[styles.text, { color: theme.colors.text }]}>
          {count} online ahora
        </Text>
      </View>
      <View style={styles.avatars}>
        {shown.map((member, index) => (
          <View key={member.user_id} style={{ marginLeft: index === 0 ? 0 : -9 }}>
            <Avatar
              uri={member.profile?.avatar_url}
              label={member.profile?.display_name ?? member.profile?.username}
              size={30}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  text: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
});
