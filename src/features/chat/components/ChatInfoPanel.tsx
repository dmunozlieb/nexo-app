import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import {
  ArrowUpRight,
  Crown,
  LogOut,
  Shield,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type {
  ChatRole,
  ConversationMemberWithProfile,
  Conversation,
} from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import {
  useBanMemberMutation,
  useDemoteFromCoAdminMutation,
  useKickMemberMutation,
  useLeaveChatMutation,
  usePromoteToCoAdminMutation,
  useTransferAdminMutation,
} from "../hooks/useChat";
import { RoleBadge } from "./RoleBadge";

type ChatInfoPanelProps = {
  conversation: Conversation;
  members: ConversationMemberWithProfile[];
  currentUserId: string;
  currentUserRole: ChatRole | null;
  isCommunityModerator?: boolean;
  onClose: () => void;
};

const MAX_CO_ADMINS = 3;

export function ChatInfoPanel({
  conversation,
  members,
  currentUserId,
  currentUserRole,
  isCommunityModerator,
  onClose,
}: ChatInfoPanelProps) {
  const theme = useTheme();
  const promote = usePromoteToCoAdminMutation(conversation.id);
  const demote = useDemoteFromCoAdminMutation(conversation.id);
  const transfer = useTransferAdminMutation(conversation.id);
  const kick = useKickMemberMutation(conversation.id);
  const ban = useBanMemberMutation(conversation.id);
  const leave = useLeaveChatMutation(currentUserId);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const isAdmin = currentUserRole === "admin";
  const canModerate =
    isAdmin ||
    currentUserRole === "co_admin" ||
    Boolean(isCommunityModerator);
  const coAdminCount = members.filter((m) => m.role === "co_admin").length;
  const canPromoteMore = coAdminCount < MAX_CO_ADMINS;

  const sortedMembers = [...members].sort((a, b) => {
    const order: Record<ChatRole, number> = {
      admin: 0,
      co_admin: 1,
      member: 2,
      banned: 3,
    };
    return order[a.role] - order[b.role];
  });

  async function withBusy<T>(userId: string, fn: () => Promise<T>) {
    setBusyUserId(userId);
    try {
      await fn();
    } catch (error) {
      Alert.alert("Operacion fallida", getErrorMessage(error));
    } finally {
      setBusyUserId(null);
    }
  }

  function handlePromote(userId: string) {
    void withBusy(userId, () => promote.mutateAsync(userId));
  }

  function handleDemote(userId: string) {
    void withBusy(userId, () => demote.mutateAsync(userId));
  }

  function handleTransfer(userId: string, name: string) {
    Alert.alert(
      "Transferir admin",
      `${name} sera el nuevo admin del chat. Tu bajaras a co-admin (o miembro si no hay hueco). Esta accion no se puede deshacer facilmente.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Transferir",
          style: "destructive",
          onPress: () =>
            void withBusy(userId, () => transfer.mutateAsync(userId)),
        },
      ],
    );
  }

  function handleKick(userId: string, name: string) {
    Alert.alert(
      "Expulsar",
      `${name} sera expulsado del chat. Podra volver a unirse si el chat es publico.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Expulsar",
          style: "destructive",
          onPress: () =>
            void withBusy(userId, () => kick.mutateAsync(userId)),
        },
      ],
    );
  }

  function handleBan(userId: string, name: string) {
    Alert.alert(
      "Banear",
      `${name} no podra volver a unirse al chat hasta que se levante el baneo.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Banear",
          style: "destructive",
          onPress: () =>
            void withBusy(userId, () => ban.mutateAsync(userId)),
        },
      ],
    );
  }

  async function handleLeave() {
    Alert.alert(
      "Salir del chat",
      isAdmin
        ? "Eres admin. Transfiere el rol antes de salir o el chat quedara sin admin."
        : "Saldras de este chat. Si es publico podras volver a unirte.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Salir",
          style: "destructive",
          onPress: async () => {
            try {
              await leave.mutateAsync(conversation.id);
              router.replace("/chat");
            } catch (error) {
              Alert.alert("No se pudo salir", getErrorMessage(error));
            }
          },
        },
      ],
    );
  }

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.colors.background,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View
        style={[
          styles.header,
          { borderBottomColor: theme.colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Detalles del chat
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar panel"
          onPress={onClose}
          style={({ pressed }) => [
            styles.closeButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <X size={16} color={theme.colors.textMuted} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <Avatar
            uri={conversation.avatar_url}
            label={conversation.name ?? "Chat"}
            size={84}
          />
          <Text style={[styles.heroName, { color: theme.colors.text }]}>
            {conversation.name ?? "Conversacion"}
          </Text>
          {conversation.description ? (
            <Text
              style={[styles.heroDesc, { color: theme.colors.textMuted }]}
            >
              {conversation.description}
            </Text>
          ) : (
            <Text
              style={[styles.heroDesc, { color: theme.colors.textFaint }]}
            >
              Sin descripcion todavia.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <Users size={14} color={theme.colors.textMuted} />
              <Text
                style={[styles.sectionTitle, { color: theme.colors.textMuted }]}
              >
                Miembros · {members.length}
              </Text>
            </View>
            <Text
              style={[styles.sectionMeta, { color: theme.colors.textFaint }]}
            >
              {coAdminCount}/{MAX_CO_ADMINS} co-admins
            </Text>
          </View>

          <View style={styles.memberList}>
            {sortedMembers.map((member) => (
              <MemberRow
                key={member.user_id}
                member={member}
                isSelf={member.user_id === currentUserId}
                canModerate={canModerate}
                isAdminViewer={isAdmin}
                canPromoteMore={canPromoteMore}
                isBusy={busyUserId === member.user_id}
                onPromote={() => handlePromote(member.user_id)}
                onDemote={() => handleDemote(member.user_id)}
                onTransfer={() =>
                  handleTransfer(
                    member.user_id,
                    member.profile?.display_name ??
                      member.profile?.username ??
                      "ese usuario",
                  )
                }
                onKick={() =>
                  handleKick(
                    member.user_id,
                    member.profile?.display_name ??
                      member.profile?.username ??
                      "ese usuario",
                  )
                }
                onBan={() =>
                  handleBan(
                    member.user_id,
                    member.profile?.display_name ??
                      member.profile?.username ??
                      "ese usuario",
                  )
                }
              />
            ))}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Salir del chat"
          onPress={handleLeave}
          style={({ pressed }) => [
            styles.leaveButton,
            {
              borderColor: `${theme.colors.error}55`,
              backgroundColor: `${theme.colors.error}10`,
              opacity: pressed ? 0.78 : 1,
            },
          ]}
        >
          <LogOut size={15} color={theme.colors.error} />
          <Text style={[styles.leaveText, { color: theme.colors.error }]}>
            Salir del chat
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

type MemberRowProps = {
  member: ConversationMemberWithProfile;
  isSelf: boolean;
  canModerate: boolean;
  isAdminViewer: boolean;
  canPromoteMore: boolean;
  isBusy: boolean;
  onPromote: () => void;
  onDemote: () => void;
  onTransfer: () => void;
  onKick: () => void;
  onBan: () => void;
};

function MemberRow({
  member,
  isSelf,
  canModerate,
  isAdminViewer,
  canPromoteMore,
  isBusy,
  onPromote,
  onDemote,
  onTransfer,
  onKick,
  onBan,
}: MemberRowProps) {
  const theme = useTheme();
  const [actionsOpen, setActionsOpen] = useState(false);
  const name =
    member.profile?.display_name ?? member.profile?.username ?? "Usuario";

  const showActions =
    canModerate &&
    !isSelf &&
    member.role !== "admin" &&
    member.role !== "banned";

  return (
    <View
      style={[
        styles.memberRow,
        {
          borderColor: theme.colors.border,
          backgroundColor: "rgba(255,255,255,0.03)",
        },
      ]}
    >
      <View style={styles.memberMain}>
        <Avatar
          uri={member.profile?.avatar_url}
          label={name}
          size={36}
        />
        <View style={styles.memberCopy}>
          <View style={styles.memberNameRow}>
            <Text
              style={[styles.memberName, { color: theme.colors.text }]}
              numberOfLines={1}
            >
              {name}
            </Text>
            {isSelf ? (
              <Text
                style={[styles.youTag, { color: theme.colors.secondary }]}
              >
                Tu
              </Text>
            ) : null}
          </View>
          <View style={styles.memberMetaRow}>
            <RoleBadge role={member.role} variant="full" />
            {member.profile?.username ? (
              <Text
                style={[styles.memberHandle, { color: theme.colors.textFaint }]}
                numberOfLines={1}
              >
                @{member.profile.username}
              </Text>
            ) : null}
          </View>
        </View>
        {showActions ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Acciones"
            onPress={() => setActionsOpen((v) => !v)}
            style={({ pressed }) => [
              styles.memberToggle,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text
              style={[styles.memberToggleText, { color: theme.colors.textMuted }]}
            >
              {actionsOpen ? "Cerrar" : "Acciones"}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {showActions && actionsOpen ? (
        <View style={styles.actionsRow}>
          {isAdminViewer && member.role === "member" && canPromoteMore ? (
            <ActionLink
              label="Hacer co-admin"
              icon={<Shield size={13} color={theme.colors.secondary} />}
              color={theme.colors.secondary}
              disabled={isBusy}
              onPress={onPromote}
            />
          ) : null}
          {isAdminViewer && member.role === "co_admin" ? (
            <ActionLink
              label="Quitar co-admin"
              icon={<Shield size={13} color={theme.colors.textMuted} />}
              color={theme.colors.textMuted}
              disabled={isBusy}
              onPress={onDemote}
            />
          ) : null}
          {isAdminViewer ? (
            <ActionLink
              label="Transferir admin"
              icon={<Crown size={13} color="#FFC450" />}
              color="#FFC450"
              disabled={isBusy}
              onPress={onTransfer}
            />
          ) : null}
          <ActionLink
            label="Expulsar"
            icon={<UserMinus size={13} color={theme.colors.warning} />}
            color={theme.colors.warning}
            disabled={isBusy}
            onPress={onKick}
          />
          <ActionLink
            label="Banear"
            icon={<UserPlus size={13} color={theme.colors.error} />}
            color={theme.colors.error}
            disabled={isBusy}
            onPress={onBan}
          />
          <ActionLink
            label="Ver perfil"
            icon={<ArrowUpRight size={13} color={theme.colors.textMuted} />}
            color={theme.colors.textMuted}
            onPress={() =>
              router.push({
                pathname: "/profile/[id]" as never,
                params: { id: member.user_id },
              })
            }
          />
        </View>
      ) : null}
    </View>
  );
}

function ActionLink({
  label,
  icon,
  color,
  disabled,
  onPress,
}: {
  label: string;
  icon: React.ReactNode;
  color: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionLink,
        {
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}
    >
      {icon}
      <Text style={[styles.actionLinkText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
    maxWidth: 340,
    height: "100%",
    borderLeftWidth: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 16,
  },
  hero: {
    alignItems: "center",
    gap: 8,
  },
  heroName: {
    fontSize: typography.h2,
    fontWeight: "900",
    textAlign: "center",
  },
  heroDesc: {
    fontSize: typography.small,
    lineHeight: 19,
    textAlign: "center",
    fontWeight: "500",
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  sectionMeta: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  memberList: {
    gap: 6,
  },
  memberRow: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 10,
    gap: 8,
  },
  memberMain: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  memberCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberName: {
    fontSize: typography.small,
    fontWeight: "800",
    flexShrink: 1,
  },
  youTag: {
    fontSize: typography.tiny,
    fontWeight: "900",
  },
  memberMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  memberHandle: {
    fontSize: typography.tiny,
    fontWeight: "600",
    flexShrink: 1,
  },
  memberToggle: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  memberToggleText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  actionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  actionLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  actionLinkText: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  leaveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: 4,
  },
  leaveText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
});
