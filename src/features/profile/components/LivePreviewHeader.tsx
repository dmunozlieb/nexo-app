import { StyleSheet, View } from "react-native";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { AccentPair } from "../utils/profile-accent";
import { ProfileHero } from "./ProfileHero";

export function LivePreviewHeader({
  displayName,
  username,
  avatarUrl,
  bannerUrl,
  accent,
}: {
  displayName: string;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  accent: AccentPair;
}) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { borderColor: theme.colors.border }]}>
      <ProfileHero
        avatarUrl={avatarUrl}
        displayName={displayName}
        username={username}
        bannerUrl={bannerUrl}
        accent={accent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F1330",
    paddingBottom: 16,
  },
});
