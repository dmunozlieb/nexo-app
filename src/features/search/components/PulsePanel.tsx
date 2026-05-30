import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Grid3x3, Radio, Signal } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";
import { formatCompactNumber } from "../../../utils/format";
import { hoverTransition } from "../../../utils/web-style";
import { categoryIcon } from "../categoryMeta";
import { onlineOf } from "../helpers";

const pointerStyle = { cursor: "pointer" } as unknown as ViewStyle;

// Panel flotante: se mantiene visible al hacer scroll por la columna principal.
// position: sticky es exclusivo de react-native-web (el panel solo se ve en desktop).
const stickyStyle: ViewStyle | null =
  Platform.OS === "web"
    ? ({ position: "sticky", top: 18, alignSelf: "flex-start" } as unknown as ViewStyle)
    : null;

type PulsePanelProps = {
  data: CommunityWithMeta[];
  liveList: CommunityWithMeta[];
  categories: string[];
  onOpenCommunity: (community: CommunityWithMeta) => void;
  onSelectCategory: (category: string) => void;
};

export function PulsePanel({
  data,
  liveList,
  categories,
  onOpenCommunity,
  onSelectCategory,
}: PulsePanelProps) {
  const theme = useTheme();
  const totalOnline = data.reduce((sum, community) => sum + onlineOf(community), 0);
  const liveChats = data.filter((community) => community.active_chat).length;

  return (
    <View style={[styles.root, stickyStyle]}>
      <View style={[styles.card, { borderColor: theme.colors.border }]}>
        <View style={styles.cardHead}>
          <Radio size={16} color={theme.colors.aurora} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Pulso ahora</Text>
        </View>
        <Text style={[styles.big, { color: theme.colors.aurora }]}>
          {formatCompactNumber(totalOnline)}{" "}
          <Text style={[styles.bigUnit, { color: theme.colors.textFaint }]}>viajeros online</Text>
        </Text>
        <Text style={[styles.sub, { color: theme.colors.textFaint }]}>
          en {data.length} orbitas activas · {liveChats} con chat en vivo
        </Text>
      </View>

      <View style={[styles.card, { borderColor: theme.colors.border }]}>
        <View style={styles.cardHead}>
          <Signal size={16} color={theme.colors.secondary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Vivas ahora mismo</Text>
        </View>
        {liveList.slice(0, 4).map((community) => (
          <Pressable
            key={community.id}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${community.name}`}
            onPress={() => onOpenCommunity(community)}
            style={({ pressed, hovered }) => [
              styles.mini,
              hoverTransition,
              Platform.OS === "web" ? pointerStyle : null,
              { opacity: pressed ? 0.8 : 1, backgroundColor: hovered ? theme.colors.elevated : "transparent" },
            ]}
          >
            <Avatar uri={community.avatar_url} label={community.name} size={34} />
            <View style={styles.miniCopy}>
              <Text style={[styles.miniName, { color: theme.colors.text }]} numberOfLines={1}>
                {community.name}
              </Text>
              <Text style={[styles.miniMeta, { color: theme.colors.textFaint }]} numberOfLines={1}>
                {formatCompactNumber(onlineOf(community))} online · {community.category ?? "General"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View style={[styles.card, { borderColor: theme.colors.border }]}>
        <View style={styles.cardHead}>
          <Grid3x3 size={15} color={theme.colors.secondary} />
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Explora por mundo</Text>
        </View>
        <View style={styles.cats}>
          {categories.map((category) => {
            const Icon = categoryIcon(category);
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={category}
                onPress={() => onSelectCategory(category)}
                style={({ pressed, hovered }) => [
                  styles.cat,
                  hoverTransition,
                  Platform.OS === "web" ? pointerStyle : null,
                  {
                    borderColor: hovered ? theme.colors.secondary : theme.colors.border,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Icon size={13} color={theme.colors.secondary} />
                <Text style={[styles.catText, { color: theme.colors.textMuted }]}>{category}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 300,
    gap: 14,
  },
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(13,18,48,0.62)",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: typography.body,
    fontWeight: "900",
  },
  big: {
    fontSize: 30,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  bigUnit: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  sub: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  mini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 6,
    borderRadius: radius.md,
  },
  miniCopy: {
    flex: 1,
    minWidth: 0,
  },
  miniName: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  miniMeta: {
    fontSize: typography.tiny,
    fontWeight: "700",
    marginTop: 2,
  },
  cats: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  cat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: "rgba(7,11,26,0.4)",
  },
  catText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
});
