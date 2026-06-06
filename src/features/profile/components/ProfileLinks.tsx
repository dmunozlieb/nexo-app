import { Pressable, StyleSheet, Text, View } from "react-native";
import * as WebBrowser from "expo-web-browser";
import {
  AtSign,
  Briefcase,
  Camera,
  ChevronRight,
  Code,
  Gamepad,
  Globe,
  Link as LinkIcon,
  Music,
  Play,
} from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ProfileLink } from "../../../types/domain";
import type { AccentPair } from "../utils/profile-accent";
import { hoverTransition, pointerStyle } from "../../../utils/web-style";
import { linkPresentation, type LinkPlatform } from "../utils/link-presentation";

function platformIcon(platform: LinkPlatform, color: string) {
  const size = 16;
  switch (platform) {
    case "youtube":
      // lucide-react-native has no Youtube brand icon; Play is the closest semantic substitute
      return <Play size={size} color={color} />;
    case "twitch":
      // lucide-react-native has no Twitch brand icon; Gamepad reflects the gaming/streaming nature
      return <Gamepad size={size} color={color} />;
    case "twitter":
      // lucide-react-native has no Twitter brand icon; AtSign reflects the @-mention nature
      return <AtSign size={size} color={color} />;
    case "instagram":
      // lucide-react-native has no Instagram brand icon; Camera reflects the photo-sharing nature
      return <Camera size={size} color={color} />;
    case "github":
      // lucide-react-native has no Github brand icon; Code reflects the developer platform nature
      return <Code size={size} color={color} />;
    case "linkedin":
      // lucide-react-native has no Linkedin brand icon; Briefcase reflects the professional network nature
      return <Briefcase size={size} color={color} />;
    case "facebook":
      // lucide-react-native has no Facebook brand icon; Globe reflects the broad social network nature
      return <Globe size={size} color={color} />;
    case "tiktok":
      // lucide-react-native has no TikTok brand icon; Music reflects the music/video nature
      return <Music size={size} color={color} />;
    default:
      return <LinkIcon size={size} color={color} />;
  }
}

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
      <Text style={[styles.eyebrow, { color: theme.colors.textFaint }]}>ENLACES</Text>
      <View style={styles.rows}>
        {links.map((link, index) => {
          const { platform, domain } = linkPresentation(link.url);
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
                  borderColor: hovered ? `${accent[0]}70` : "rgba(255,255,255,0.10)",
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${accent[0]}1A` }]}>
                {platformIcon(platform, accent[0])}
              </View>
              <View style={styles.texts}>
                <Text style={[styles.label, { color: theme.colors.text }]} numberOfLines={1}>
                  {link.label}
                </Text>
                <Text style={[styles.domain, { color: theme.colors.textFaint }]} numberOfLines={1}>
                  {domain}
                </Text>
              </View>
              <ChevronRight size={16} color={theme.colors.textFaint} />
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
    backgroundColor: "#0A0F24",
  },
  iconBox: {
    width: 26,
    height: 26,
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
