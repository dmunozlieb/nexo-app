import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Avatar } from "../../../components/ui/Avatar";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { AccentPair } from "../utils/profile-accent";

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
      <View style={styles.banner}>
        {bannerUrl ? (
          <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <LinearGradient
            colors={[`${accent[0]}66`, `${accent[1]}33`, "rgba(7,11,26,0.6)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>
      <View style={styles.body}>
        <LinearGradient
          colors={accent as unknown as readonly [string, string]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.avatarRing, { borderColor: theme.colors.background }]}
        >
          <View style={[styles.avatarInner, { backgroundColor: theme.colors.background }]}>
            <Avatar uri={avatarUrl} label={displayName || username} size={54} />
          </View>
        </LinearGradient>
        <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
          {displayName || "Tu nombre"}
        </Text>
        <Text style={[styles.handle, { color: accent[0] }]} numberOfLines={1}>
          @{username || "username"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "#0F1330",
  },
  banner: {
    height: 84,
  },
  body: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  avatarRing: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -32,
    borderWidth: 3,
  },
  avatarInner: {
    borderRadius: radius.pill,
    padding: 2,
  },
  name: {
    fontSize: typography.h3,
    fontWeight: "900",
    marginTop: 10,
  },
  handle: {
    fontSize: typography.small,
    fontWeight: "700",
    marginTop: 2,
  },
});
