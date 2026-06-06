import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Globe, History, Lock, Timer, Trash2 } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { TextInput } from "../../../components/ui/TextInput";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ChatVisibility } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { formatRelativeDate } from "../../../utils/format";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  useChatAuditLog,
  useChatDetails,
  useDeleteChatMutation,
  useUpdateChatMutation,
} from "../hooks/useChat";

const SLOW_MODE_OPTIONS = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1min", value: 60 },
];

const AUDIT_LABELS: Record<string, string> = {
  chat_created: "Chat creado",
  chat_updated: "Ajustes actualizados",
  chat_deleted: "Chat eliminado",
  role_granted: "Rol concedido",
  role_revoked: "Rol retirado",
  admin_transferred: "Admin transferido",
  member_kicked: "Miembro expulsado",
  member_banned: "Miembro baneado",
  member_unbanned: "Miembro desbaneado",
  message_pinned: "Mensaje fijado",
  message_unpinned: "Mensaje desfijado",
  slow_mode_changed: "Modo lento cambiado",
};

export function ChatSettingsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const conversationId = id ?? "";
  const theme = useTheme();
  const auth = useAuth();
  const userId = auth.session?.user.id;

  const details = useChatDetails(conversationId, userId);
  const audit = useChatAuditLog(conversationId);
  const update = useUpdateChatMutation(conversationId);
  const conversation = details.data?.conversation ?? null;
  const community = conversation?.community_id ?? undefined;
  const remove = useDeleteChatMutation(community);

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<ChatVisibility | null>(null);
  const [slowMode, setSlowMode] = useState<number | null>(null);

  if (details.isLoading) {
    return <LoadingState label="Cargando ajustes..." />;
  }
  if (details.isError || !conversation) {
    return (
      <ErrorState
        message={getErrorMessage(details.error)}
        onRetry={() => void details.refetch()}
      />
    );
  }

  const role = details.data?.current_user_role ?? null;
  const isAdmin = role === "admin";
  const nameValue = name ?? conversation.name ?? "";
  const descValue = description ?? conversation.description ?? "";
  const visibilityValue = visibility ?? conversation.visibility;
  const slowValue = slowMode ?? conversation.slow_mode_seconds;

  async function handleSave() {
    const trimmed = nameValue.trim();
    if (trimmed.length < 2 || trimmed.length > 50) {
      Alert.alert("Nombre invalido", "Entre 2 y 50 caracteres.");
      return;
    }
    try {
      await update.mutateAsync({
        name: trimmed,
        description: descValue.trim() || null,
        visibility: visibilityValue,
        slowModeSeconds: slowValue,
      });
      Alert.alert("Guardado", "Ajustes actualizados.");
    } catch (error) {
      Alert.alert("No se pudo guardar", getErrorMessage(error));
    }
  }

  function handleDelete() {
    Alert.alert("Eliminar chat", "Esta accion no se puede deshacer.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await remove.mutateAsync(conversationId);
            router.replace("/(tabs)/chat");
          } catch (error) {
            Alert.alert("No se pudo eliminar", getErrorMessage(error));
          }
        },
      },
    ]);
  }

  return (
    <ScreenContainer scroll contentStyle={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backButton,
            { borderColor: theme.colors.border, opacity: pressed ? 0.78 : 1 },
          ]}
        >
          <ArrowLeft size={17} color={theme.colors.text} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Ajustes del chat
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Nombre"
          value={nameValue}
          onChangeText={setName}
          maxLength={50}
        />
        <TextInput
          label="Descripcion"
          value={descValue}
          onChangeText={setDescription}
          multiline
          maxLength={400}
          style={styles.bioInput}
        />

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
            Visibilidad
          </Text>
          <View style={styles.row}>
            <Chip
              active={visibilityValue === "public"}
              icon={<Globe size={14} color={theme.colors.text} />}
              label="Publica"
              onPress={() => setVisibility("public")}
            />
            <Chip
              active={visibilityValue === "invite_only"}
              icon={<Lock size={14} color={theme.colors.text} />}
              label="Invitacion"
              onPress={() => setVisibility("invite_only")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Timer size={14} color={theme.colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
              Modo lento
            </Text>
          </View>
          <View style={styles.row}>
            {SLOW_MODE_OPTIONS.map((option) => (
              <Chip
                key={option.value}
                active={slowValue === option.value}
                label={option.label}
                onPress={() => setSlowMode(option.value)}
              />
            ))}
          </View>
        </View>

        <Button title="Guardar cambios" loading={update.isPending} onPress={handleSave} />

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <History size={14} color={theme.colors.textMuted} />
            <Text style={[styles.sectionTitle, { color: theme.colors.textMuted }]}>
              Historial de moderacion
            </Text>
          </View>
          <View
            style={[
              styles.audit,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            {(audit.data ?? []).length === 0 ? (
              <Text style={[styles.auditEmpty, { color: theme.colors.textFaint }]}>
                Sin acciones registradas.
              </Text>
            ) : (
              (audit.data ?? []).map((entry) => (
                <View key={entry.id} style={styles.auditRow}>
                  <View style={[styles.auditDot, { backgroundColor: theme.colors.primary }]} />
                  <Text style={[styles.auditText, { color: theme.colors.text }]}>
                    {AUDIT_LABELS[entry.action] ?? entry.action}
                  </Text>
                  <Text style={[styles.auditWhen, { color: theme.colors.textFaint }]}>
                    {formatRelativeDate(entry.created_at)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        {isAdmin && !conversation.is_default ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Eliminar chat"
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.danger,
              { borderColor: `${theme.colors.error}66`, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <Trash2 size={16} color={theme.colors.error} />
            <Text style={[styles.dangerText, { color: theme.colors.error }]}>
              Eliminar chat
            </Text>
          </Pressable>
        ) : null}
      </View>
    </ScreenContainer>
  );
}

function Chip({
  active,
  icon,
  label,
  onPress,
}: {
  active: boolean;
  icon?: React.ReactNode;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        {
          borderColor: active ? theme.colors.secondary : theme.colors.border,
          backgroundColor: active ? `${theme.colors.primary}24` : "transparent",
          opacity: pressed ? 0.82 : 1,
        },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.chipText,
          { color: active ? "#FFFFFF" : theme.colors.textMuted },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { gap: 18, paddingTop: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  backButton: {
    width: 42, height: 42, borderRadius: radius.md, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: typography.h2, fontWeight: "900" },
  form: { gap: 14 },
  bioInput: { minHeight: 90, textAlignVertical: "top" },
  section: { gap: 8 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: typography.small, fontWeight: "800" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center", gap: 6, minHeight: 38,
    borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 12,
    justifyContent: "center",
  },
  chipText: { fontSize: typography.small, fontWeight: "800" },
  audit: { borderWidth: 1, borderRadius: radius.md, padding: 12, gap: 10 },
  auditEmpty: { fontSize: typography.small, fontWeight: "600" },
  auditRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  auditDot: { width: 6, height: 6, borderRadius: 3 },
  auditText: { flex: 1, fontSize: typography.small, fontWeight: "700" },
  auditWhen: { fontSize: typography.tiny, fontWeight: "700" },
  danger: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderRadius: radius.md, paddingVertical: 12,
    backgroundColor: "rgba(255,107,107,0.06)",
  },
  dangerText: { fontSize: typography.small, fontWeight: "800" },
});
