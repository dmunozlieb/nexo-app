import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Radio, Sparkles } from "lucide-react-native";
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
        {
          backgroundColor: "rgba(18,20,39,0.72)",
          borderColor: `${theme.colors.secondary}33`,
          shadowColor: theme.colors.secondary,
        },
      ]}
    >
      <LinearGradient
        colors={[`${theme.colors.secondary}12`, `${theme.colors.accent}0B`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.wash}
      />
      <View style={styles.copy}>
        <View style={[styles.liveIcon, { backgroundColor: `${theme.colors.success}18` }]}>
          <View style={[styles.livePulse, { borderColor: `${theme.colors.success}55` }]} />
          <Radio size={15} color={theme.colors.success} />
        </View>
        <View>
          <Text style={[styles.text, { color: theme.colors.text }]}>
            {count} online ahora
          </Text>
          <Text style={[styles.subtext, { color: theme.colors.textFaint }]}>
            Ecos activos en esta Orbita
          </Text>
        </View>
      </View>
      <View style={styles.avatars}>
        {shown.map((member, index) => (
          <View
            key={member.user_id}
            style={[
              styles.avatarShell,
              {
                marginLeft: index === 0 ? 0 : -9,
                borderColor: theme.colors.background,
              },
            ]}
          >
            <Avatar
              uri={member.profile?.avatar_url}
              label={member.profile?.display_name ?? member.profile?.username}
              size={30}
            />
            {index < 3 ? (
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: theme.colors.success,
                    borderColor: theme.colors.background,
                  },
                ]}
              />
            ) : null}
          </View>
        ))}
        {members.length > shown.length ? (
          <View
            style={[
              styles.moreBubble,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Sparkles size={12} color={theme.colors.secondary} />
            <Text style={[styles.moreText, { color: theme.colors.text }]}>
              +{members.length - shown.length}
            </Text>
          </View>
        ) : null}
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
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    overflow: "hidden",
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  wash: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  copy: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  liveIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  livePulse: {
    position: "absolute",
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
  },
  text: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  subtext: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  avatars: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarShell: {
    borderWidth: 2,
    borderRadius: radius.pill,
  },
  onlineDot: {
    position: "absolute",
    right: -1,
    bottom: 1,
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 2,
  },
  moreBubble: {
    minHeight: 30,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginLeft: -6,
  },
  moreText: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
});
