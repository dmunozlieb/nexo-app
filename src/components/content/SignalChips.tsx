import { StyleSheet, Text, View } from "react-native";
import { CalendarDays, Radio, Sparkles, Target } from "lucide-react-native";
import { radius, typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import type { CommunityWithMeta } from "../../types/domain";

type SignalKind = "live" | "event" | "mission" | "posts";

type Signal = {
  kind: SignalKind;
  label: string;
};

export function buildSignals(community: CommunityWithMeta): Signal[] {
  const out: Signal[] = [];
  if (community.active_chat) {
    out.push({ kind: "live", label: "Chat en vivo" });
  }
  if (community.event_today) {
    out.push({ kind: "event", label: "Evento hoy" });
  }
  if (community.mission_active) {
    out.push({ kind: "mission", label: "Mision activa" });
  }
  if (community.new_posts_count) {
    out.push({
      kind: "posts",
      label: `${community.new_posts_count} senales nuevas`,
    });
  }
  return out;
}

type SignalChipsProps = {
  community: CommunityWithMeta;
  limit?: number;
};

export function SignalChips({ community, limit = 3 }: SignalChipsProps) {
  const theme = useTheme();
  const signals = buildSignals(community).slice(0, limit);

  if (signals.length === 0) {
    return null;
  }

  const colorOf: Record<SignalKind, string> = {
    live: theme.colors.aurora,
    event: theme.colors.featured,
    mission: theme.colors.accent,
    posts: theme.colors.secondary,
  };

  const iconOf: Record<SignalKind, typeof Radio> = {
    live: Radio,
    event: CalendarDays,
    mission: Target,
    posts: Sparkles,
  };

  return (
    <View style={styles.row}>
      {signals.map((signal) => {
        const color = colorOf[signal.kind];
        const Icon = iconOf[signal.kind];
        return (
          <View
            key={signal.kind}
            style={[styles.chip, { borderColor: `${color}66` }]}
          >
            <Icon size={13} color={color} />
            <Text style={[styles.label, { color }]}>{signal.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: "rgba(7,11,26,0.5)",
  },
  label: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
});
