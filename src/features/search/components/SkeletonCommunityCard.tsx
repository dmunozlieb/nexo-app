import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { radius } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";

export function SkeletonCommunityCard() {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <LinearGradient
        colors={[`${theme.colors.primary}30`, `${theme.colors.secondary}20`, `${theme.colors.accent}24`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.banner}
      />
      <View style={styles.body}>
        <View style={[styles.avatar, { backgroundColor: theme.colors.elevated }]} />
        <View style={styles.copy}>
          <View style={[styles.lineLarge, { backgroundColor: theme.colors.elevated }]} />
          <View style={[styles.line, { backgroundColor: theme.colors.elevated }]} />
          <View style={[styles.lineShort, { backgroundColor: theme.colors.elevated }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  banner: {
    height: 138,
  },
  body: {
    flexDirection: "row",
    gap: 12,
    padding: 12,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  copy: {
    flex: 1,
    gap: 9,
    paddingTop: 2,
  },
  lineLarge: {
    width: "54%",
    height: 16,
    borderRadius: radius.pill,
  },
  line: {
    width: "88%",
    height: 12,
    borderRadius: radius.pill,
  },
  lineShort: {
    width: "42%",
    height: 12,
    borderRadius: radius.pill,
  },
});
