import type { ReactNode } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { Compass, Plus, Radio, Search, Sparkles, Users } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { OnlineIndicator } from "../../../components/content/OnlineIndicator";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { formatCompactNumber } from "../../../utils/format";

type ExploreHeroProps = {
  query: string;
  onQuery: (value: string) => void;
  communityCount: number;
  memberCount: number;
  onlineCount: number;
  onCreate: () => void;
};

export function ExploreHero({
  query,
  onQuery,
  communityCount,
  memberCount,
  onlineCount,
  onCreate,
}: ExploreHeroProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const stack = width < 720;

  return (
    <View style={[styles.hero, { borderColor: `${theme.colors.secondary}2E` }]}>
      <View style={[styles.topRow, stack ? styles.topRowStack : null]}>
        <View style={styles.copy}>
          <View style={styles.kicker}>
            <Compass size={14} color={theme.colors.secondary} />
            <Text style={[styles.kickerText, { color: theme.colors.secondary }]}>
              Explorar orbitas
            </Text>
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Encuentra tu proximo circulo
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Comunidades vivas para descubrir, crear y conectar con gente que vibra en tu misma orbita.
          </Text>
        </View>
        <Button
          title="Crear Orbita"
          size="sm"
          icon={<Plus size={16} color="#FFFFFF" />}
          onPress={onCreate}
          style={stack ? styles.createStack : styles.create}
        />
      </View>

      <TextInput
        accessibilityLabel="Buscar Orbitas"
        value={query}
        onChangeText={onQuery}
        placeholder="Buscar por nombre, categoria o descripcion"
        icon={<Search size={18} color={theme.colors.textFaint} />}
      />

      <View style={styles.stats}>
        <Stat
          icon={<Radio size={14} color={theme.colors.secondary} />}
          value={formatCompactNumber(communityCount)}
          label="activas"
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Stat
          icon={<Users size={14} color={theme.colors.accent} />}
          value={formatCompactNumber(memberCount)}
          label="miembros"
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <View style={styles.stat}>
          <OnlineIndicator count={onlineCount} solid />
        </View>
        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
        <Stat
          icon={<Sparkles size={14} color={theme.colors.aurora} />}
          value="Live"
          label="ahora"
        />
      </View>
    </View>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: ReactNode;
  value: string;
  label: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.stat}>
      {icon}
      <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.colors.textFaint }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 16,
    gap: 14,
    backgroundColor: "rgba(13,18,48,0.62)",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
  },
  topRowStack: {
    flexDirection: "column",
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  kicker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  kickerText: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
    lineHeight: 29,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
    maxWidth: 640,
  },
  create: {
    alignSelf: "flex-start",
  },
  createStack: {
    alignSelf: "stretch",
  },
  stats: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 10,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statValue: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  statLabel: {
    fontSize: typography.tiny,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  divider: {
    width: 1,
    height: 16,
  },
});
