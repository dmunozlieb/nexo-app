import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { ChevronRight } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ProfileLink } from "../../../types/domain";
import type { AccentPair } from "../utils/profile-accent";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { BRAND_COLORS, linkPresentation } from "../utils/link-presentation";
import { BrandIcon } from "./BrandIcon";

export function ProfileLinks({
  links,
  accent,
}: {
  links: ProfileLink[];
  accent: AccentPair;
}) {
  const theme = useTheme();
  if (!links.length) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <Text style={[styles.eyebrow, { color: theme.colors.text }]}>ENLACES</Text>
      <View style={styles.rows}>
        {links.map((link, index) => {
          const { platform, domain } = linkPresentation(link.url);
          // generic usa el acento; el resto su color de marca.
          const brand = platform === "generic" ? accent[0] : BRAND_COLORS[platform];
          return (
            <Pressable
              key={`${link.url}-${index}`}
              accessibilityRole="link"
              accessibilityLabel={`${link.label} (${domain})`}
              onPress={() => void WebBrowser.openBrowserAsync(link.url)}
              style={({ pressed, hovered }) => [
                styles.row,
                hoverTransition,
                pointerStyle,
                {
                  borderColor: hovered ? `${brand}99` : `${brand}40`,
                  backgroundColor: `${brand}14`,
                  transform: [{ scale: pressed ? 0.97 : hovered ? 1.02 : 1 }],
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${brand}26` }]}>
                <BrandIcon platform={platform} size={18} color={brand} />
              </View>
              <View style={styles.texts}>
                <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>
                  {link.label}
                </Text>
                <Text style={[styles.domain, { color: theme.colors.textMuted }]} numberOfLines={1}>
                  {domain}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textMuted} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 16,
  },
  eyebrow: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rows: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  iconBox: {
    width: 30,
    height: 30,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  texts: {
    flex: 1,
    minWidth: 0,
  },
  label: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  domain: {
    fontSize: typography.tiny,
    fontWeight: "600",
    marginTop: 1,
  },
});
