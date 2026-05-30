import { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Avatar } from "../../../components/ui/Avatar";
import { AlienEmptyState } from "../../../components/ui/AlienEmptyState";
import { RoleBadge } from "../../../components/community/RoleBadge";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type {
  CommunityMemberWithProfile,
  CommunityRole,
} from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";

type MembersByRoleProps = {
  members: CommunityMemberWithProfile[];
  communityId: string;
};

type Section = {
  key: string;
  title: string;
  roles: CommunityRole[];
};

// TODO presencia: sin split Online/Desconectados hasta tener presencia real.
const SECTIONS: Section[] = [
  { key: "lead", title: "Owner y admins", roles: ["owner", "admin"] },
  { key: "mods", title: "Moderadores", roles: ["mod"] },
  { key: "helpers", title: "Ayudantes", roles: ["helper"] },
  { key: "members", title: "Miembros", roles: ["member"] },
];

export function MembersByRole({ members, communityId }: MembersByRoleProps) {
  const theme = useTheme();

  const grouped = useMemo(
    () =>
      SECTIONS.map((section) => ({
        ...section,
        rows: members.filter((member) => section.roles.includes(member.role)),
      })).filter((section) => section.rows.length > 0),
    [members],
  );

  if (members.length === 0) {
    return (
      <AlienEmptyState
        eyebrow="Miembros"
        title="La tripulacion aun no aterriza"
        message="En cuanto alguien se una a la Orbita, lo veras flotando por aqui con su rol."
        accent={theme.colors.success}
        mood="friendly"
        accessory="crew"
      />
    );
  }

  return (
    <View style={styles.root}>
      {grouped.map((section) => (
        <View key={section.key} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
              {section.title}
            </Text>
            <Text style={[styles.sectionCount, { color: theme.colors.textFaint }]}>
              {section.rows.length}
            </Text>
          </View>
          {section.rows.map((member) => {
            const name =
              member.profile?.display_name ??
              member.profile?.username ??
              "Usuario";

            return (
              <Pressable
                key={member.user_id}
                accessibilityRole="button"
                accessibilityLabel={`Abrir perfil de ${name}`}
                onPress={() =>
                  router.push({
                    pathname: "/profile/[id]",
                    params: { id: member.user_id, communityId },
                  })
                }
                style={({ pressed }) => [
                  styles.row,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.78 : 1,
                  },
                ]}
              >
                <Avatar
                  uri={member.profile?.avatar_url}
                  label={name}
                  size={44}
                />
                <View style={styles.copy}>
                  <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
                    {name}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.textFaint }]} numberOfLines={1}>
                    Unido {formatRelativeDate(member.joined_at)}
                  </Text>
                </View>
                <RoleBadge role={member.role} />
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: typography.tiny,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  sectionCount: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  row: {
    minHeight: 68,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: typography.body,
    fontWeight: "900",
  },
  meta: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
});
