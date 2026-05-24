import { StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Compass, Plus, Radio, Sparkles, Users } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { OnlineIndicator } from "../../../components/content/OnlineIndicator";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { formatCompactNumber } from "../../../utils/format";

type ExploreHeroProps = {
  communityCount: number;
  memberCount: number;
  onlineCount: number;
  selectedCategory?: string | undefined;
  onCreate: () => void;
};

export function ExploreHero({
  communityCount,
  memberCount,
  onlineCount,
  selectedCategory,
  onCreate,
}: ExploreHeroProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.hero,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <LinearGradient
        colors={[
          `${theme.colors.primary}E8`,
          `${theme.colors.secondary}B8`,
          `${theme.colors.accent}AA`,
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.orbitLine} />
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}>
          <Compass size={24} color="#FFFFFF" />
        </View>
        <View style={styles.heroCopy}>
          <View style={styles.kickerRow}>
            <Sparkles size={14} color="#FFFFFF" />
            <Text style={styles.heroKicker}>Explorar orbitas</Text>
          </View>
          <Text style={styles.heroTitle}>Encuentra tu proximo circulo</Text>
        </View>
      </View>
      <Text style={styles.heroText}>
        Comunidades vivas para descubrir, crear y conectar con personas que vibran en tu misma orbita.
      </Text>
      <View style={styles.heroAction}>
        <Button
          title="Crear Orbita"
          size="sm"
          variant="secondary"
          icon={<Plus size={16} color={theme.colors.text} />}
          style={styles.heroButton}
          onPress={onCreate}
        />
      </View>
      <View style={styles.heroStats}>
        <View style={styles.heroStat}>
          <Radio size={15} color="#FFFFFF" />
          <Text style={styles.heroStatValue}>{formatCompactNumber(communityCount)}</Text>
          <Text style={styles.heroStatLabel}>activas</Text>
        </View>
        <View style={styles.heroStat}>
          <Users size={15} color="#FFFFFF" />
          <Text style={styles.heroStatValue}>{formatCompactNumber(memberCount)}</Text>
          <Text style={styles.heroStatLabel}>miembros</Text>
        </View>
        <View style={styles.heroStat}>
          <OnlineIndicator count={onlineCount} />
        </View>
        <View style={styles.heroStat}>
          <Sparkles size={15} color="#FFFFFF" />
          <Text style={styles.heroStatValue}>{selectedCategory ?? "Todas"}</Text>
          <Text style={styles.heroStatLabel}>categoria</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  orbitLine: {
    position: "absolute",
    width: "72%",
    height: 112,
    right: "-16%",
    top: 28,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    transform: [{ rotate: "-15deg" }],
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    paddingBottom: 10,
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(9,10,18,0.30)",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroKicker: {
    color: "rgba(255,255,255,0.78)",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: typography.h1,
    fontWeight: "900",
    lineHeight: 29,
  },
  heroText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 720,
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  heroAction: {
    paddingHorizontal: 18,
    paddingBottom: 18,
  },
  heroButton: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.24)",
  },
  heroStats: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(9,10,18,0.30)",
  },
  heroStat: {
    flex: 1,
    minWidth: 132,
    minHeight: 62,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  heroStatValue: {
    color: "#FFFFFF",
    fontSize: typography.small,
    fontWeight: "900",
  },
  heroStatLabel: {
    color: "rgba(255,255,255,0.70)",
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
});
