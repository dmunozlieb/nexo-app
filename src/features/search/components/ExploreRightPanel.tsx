import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { ChevronRight, Radio, Sparkles, Users } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { Badge } from "../../../components/ui/Badge";
import { OnlineIndicator } from "../../../components/content/OnlineIndicator";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { CommunityWithMeta } from "../../../types/domain";
import { formatCompactNumber } from "../../../utils/format";

type ExploreRightPanelProps = {
  popular: CommunityWithMeta[];
  online: CommunityWithMeta[];
  newest: CommunityWithMeta[];
  onOpenCommunity: (community: CommunityWithMeta) => void;
};

export function ExploreRightPanel({
  popular,
  online,
  newest,
  onOpenCommunity,
}: ExploreRightPanelProps) {
  const theme = useTheme();

  return (
    <View style={styles.root}>
      <Panel
        title="Populares ahora"
        icon={<Sparkles size={16} color={theme.colors.secondary} />}
      >
        {popular.slice(0, 3).map((community) => (
          <CommunityMiniRow
            key={community.id}
            community={community}
            metric={`${formatCompactNumber(community.member_count)} miembros`}
            onPress={() => onOpenCommunity(community)}
          />
        ))}
      </Panel>

      <Panel
        title="Mas activas"
        icon={<Radio size={16} color={theme.colors.success} />}
      >
        {online.slice(0, 3).map((community) => (
          <CommunityMiniRow
            key={community.id}
            community={community}
            metric={`${formatCompactNumber(community.online_count ?? 1)} online`}
            onPress={() => onOpenCommunity(community)}
          />
        ))}
      </Panel>

      <Panel title="Nuevas orbitas" icon={<Users size={16} color={theme.colors.accent} />}>
        {newest.slice(0, 3).map((community) => (
          <CommunityMiniRow
            key={community.id}
            community={community}
            metric={community.category ?? "General"}
            onPress={() => onOpenCommunity(community)}
          />
        ))}
      </Panel>

      <View
        style={[
          styles.recommendation,
          { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.recommendationKicker, { color: theme.colors.secondary }]}>
          Recomendacion de Nexo
        </Text>
        <Text style={[styles.recommendationTitle, { color: theme.colors.text }]}>
          Sigue senales con actividad real
        </Text>
        <Text style={[styles.recommendationCopy, { color: theme.colors.textMuted }]}>
          Prioriza orbitas con miembros online, posts recientes y una descripcion clara.
        </Text>
      </View>
    </View>
  );
}

function Panel({
  title,
  icon,
  children,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      <View style={styles.panelHeader}>
        {icon}
        <Text style={[styles.panelTitle, { color: theme.colors.text }]}>{title}</Text>
      </View>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function CommunityMiniRow({
  community,
  metric,
  onPress,
}: {
  community: CommunityWithMeta;
  metric: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir Orbita ${community.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: pressed ? theme.colors.elevated : "transparent",
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      <Avatar uri={community.avatar_url} label={community.name} size={34} />
      <View style={styles.rowCopy}>
        <Text style={[styles.rowTitle, { color: theme.colors.text }]} numberOfLines={1}>
          {community.name}
        </Text>
        <View style={styles.rowMeta}>
          <Text style={[styles.rowMetric, { color: theme.colors.textFaint }]} numberOfLines={1}>
            {metric}
          </Text>
          <OnlineIndicator count={community.online_count ?? 1} compact />
        </View>
      </View>
      {community.category ? <Badge label={community.category} tone="secondary" /> : null}
      <ChevronRight size={15} color={theme.colors.textFaint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: 320,
    gap: 12,
  },
  panel: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  panelTitle: {
    fontSize: typography.small,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  panelBody: {
    gap: 5,
  },
  row: {
    minHeight: 54,
    borderRadius: radius.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 8,
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  rowTitle: {
    fontSize: typography.small,
    fontWeight: "900",
  },
  rowMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rowMetric: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  recommendation: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 14,
    gap: 7,
  },
  recommendationKicker: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  recommendationTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  recommendationCopy: {
    fontSize: typography.small,
    lineHeight: 19,
  },
});
