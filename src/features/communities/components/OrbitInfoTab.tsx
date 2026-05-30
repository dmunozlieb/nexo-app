import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import {
  CalendarDays,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { GradientCard } from "../../../components/ui/GradientCard";
import { RoleBadge } from "../../../components/community/RoleBadge";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type {
  CommunityMemberWithProfile,
  CommunityRole,
  CommunityWithMeta,
} from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";
import {
  canEditCommunity,
  canManageRoles,
} from "../../../utils/community-permissions";

const MOD_ROLES: CommunityRole[] = ["owner", "admin", "mod", "helper"];

type OrbitInfoTabProps = {
  community: CommunityWithMeta;
  members: CommunityMemberWithProfile[];
  role: CommunityRole | null;
  onEditCommunity: () => void;
  onManageRoles: () => void;
};

export function OrbitInfoTab({
  community,
  members,
  role,
  onEditCommunity,
  onManageRoles,
}: OrbitInfoTabProps) {
  const theme = useTheme();
  const rules = Array.isArray(community.rules)
    ? (community.rules as string[])
    : [];
  const creator = useMemo(
    () => members.find((member) => member.role === "owner"),
    [members],
  );
  const modTeam = useMemo(
    () => members.filter((member) => MOD_ROLES.includes(member.role)),
    [members],
  );
  const creatorName =
    creator?.profile?.display_name ??
    creator?.profile?.username ??
    "Fundador desconocido";

  return (
    <View style={styles.root}>
      <GradientCard contentStyle={styles.panel}>
        <View style={styles.titleRow}>
          <Sparkles size={18} color={theme.colors.secondary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Sobre esta Orbita
          </Text>
        </View>
        <Text style={[styles.description, { color: theme.colors.textMuted }]}>
          {community.description ??
            "Una Orbita abierta a nuevos ecos, ideas y conversaciones."}
        </Text>
        <View style={styles.metaGrid}>
          <MetaRow
            icon={<Sparkles size={15} color={theme.colors.secondary} />}
            label="Categoria"
            value={community.category ?? "General"}
          />
          <MetaRow
            icon={<UserRound size={15} color={theme.colors.primary} />}
            label="Creada por"
            value={creatorName}
          />
          <MetaRow
            icon={<CalendarDays size={15} color={theme.colors.accent} />}
            label="Nacio"
            value={formatRelativeDate(community.created_at)}
          />
        </View>
      </GradientCard>

      <GradientCard contentStyle={styles.panel}>
        <View style={styles.titleRow}>
          <ShieldCheck size={18} color={theme.colors.success} />
          <Text style={[styles.title, { color: theme.colors.text }]}>Normas</Text>
        </View>
        {(rules.length
          ? rules
          : ["Respeta a otras personas.", "Evita spam."]
        ).map((rule) => (
          <Text key={rule} style={[styles.rule, { color: theme.colors.textMuted }]}>
            {rule}
          </Text>
        ))}
      </GradientCard>

      <GradientCard contentStyle={styles.panel}>
        <View style={styles.titleRow}>
          <ShieldCheck size={18} color={theme.colors.secondary} />
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Equipo de moderacion
          </Text>
        </View>
        {modTeam.length === 0 ? (
          <Text style={[styles.rule, { color: theme.colors.textFaint }]}>
            Sin equipo asignado todavia.
          </Text>
        ) : (
          <View style={styles.teamList}>
            {modTeam.map((member) => {
              const name =
                member.profile?.display_name ??
                member.profile?.username ??
                "Usuario";
              return (
                <View key={member.user_id} style={styles.teamRow}>
                  <Avatar
                    uri={member.profile?.avatar_url}
                    label={name}
                    size={36}
                  />
                  <Text
                    style={[styles.teamName, { color: theme.colors.text }]}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <RoleBadge role={member.role} />
                </View>
              );
            })}
          </View>
        )}
      </GradientCard>

      {canEditCommunity(role) ? (
        <GradientCard contentStyle={styles.panel}>
          <View style={styles.titleRow}>
            <Settings size={18} color={theme.colors.primary} />
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Acciones de admin
            </Text>
          </View>
          <View style={styles.actionRow}>
            <Button
              title="Editar Orbita"
              variant="secondary"
              size="sm"
              onPress={onEditCommunity}
            />
            {canManageRoles(role) ? (
              <Button
                title="Gestionar roles"
                variant="secondary"
                size="sm"
                onPress={onManageRoles}
              />
            ) : null}
          </View>
        </GradientCard>
      ) : null}
    </View>
  );
}

function MetaRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <View style={styles.metaRow}>
      <View
        style={[
          styles.metaIcon,
          { backgroundColor: `${theme.colors.secondary}12` },
        ]}
      >
        {icon}
      </View>
      <View style={styles.metaCopy}>
        <Text style={[styles.metaLabel, { color: theme.colors.textFaint }]}>
          {label}
        </Text>
        <Text style={[styles.metaValue, { color: theme.colors.text }]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 14,
  },
  panel: {
    gap: 12,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  description: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  metaGrid: {
    gap: 10,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  metaIcon: {
    width: 34,
    height: 34,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  metaCopy: {
    flex: 1,
    minWidth: 0,
  },
  metaLabel: {
    fontSize: typography.tiny,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: typography.body,
    fontWeight: "800",
  },
  rule: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  teamList: {
    gap: 10,
  },
  teamRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  teamName: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.body,
    fontWeight: "800",
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
});
