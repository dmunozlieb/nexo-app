import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { CheckCircle2, EyeOff, ShieldAlert, XCircle } from "lucide-react-native";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { ErrorState } from "../../../components/ui/ErrorState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ReportTargetType } from "../../../types/domain";
import { formatRelativeDate } from "../../../utils/format";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import {
  useHideContentMutation,
  useModerationQueue,
  useResolveReportMutation,
} from "../hooks/useModeration";

export function ModerationScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const queue = useModerationQueue();
  const resolve = useResolveReportMutation(auth.session?.user.id);
  const hide = useHideContentMutation();

  async function handleHide(type: ReportTargetType, id: string) {
    if (!["post", "comment", "message"].includes(type)) {
      Alert.alert("Accion no disponible", "Este tipo se gestiona desde herramientas de cuenta.");
      return;
    }

    try {
      await hide.mutateAsync({ type: type as "post" | "comment" | "message", id });
    } catch (error) {
      Alert.alert("No se pudo ocultar", getErrorMessage(error));
    }
  }

  if (queue.isLoading) {
    return <LoadingState label="Revisando reportes..." />;
  }

  if (queue.isError) {
    return <ErrorState onRetry={() => void queue.refetch()} />;
  }

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Moderacion</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          Cola de seguridad comunitaria con estados, ocultacion y resolucion.
        </Text>
      </View>
      <FlatList
        data={queue.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <EmptyState
            icon={<ShieldAlert size={36} color={theme.colors.success} />}
            title="Cola limpia"
            message="No hay reportes abiertos visibles para tu rol."
          />
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.report,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.reportHeader}>
              <Badge label={item.status} tone="warning" />
              <Badge label={item.target_type} tone="secondary" />
              <Text style={[styles.date, { color: theme.colors.textFaint }]}>
                {formatRelativeDate(item.created_at)}
              </Text>
            </View>
            <Text style={[styles.reason, { color: theme.colors.text }]}>
              {item.reason}
            </Text>
            {item.details ? (
              <Text style={[styles.details, { color: theme.colors.textMuted }]}>
                {item.details}
              </Text>
            ) : null}
            <Text style={[styles.target, { color: theme.colors.textFaint }]}>
              Target: {item.target_id}
            </Text>
            <View style={styles.actions}>
              <Button
                title="Ocultar"
                variant="secondary"
                loading={hide.isPending}
                icon={<EyeOff size={16} color={theme.colors.text} />}
                onPress={() => void handleHide(item.target_type, item.target_id)}
              />
              <Button
                title="Resolver"
                loading={resolve.isPending}
                icon={<CheckCircle2 size={16} color="#FFFFFF" />}
                onPress={() =>
                  resolve.mutate({ reportId: item.id, status: "resolved" })
                }
              />
              <Button
                title="Rechazar"
                variant="ghost"
                icon={<XCircle size={16} color={theme.colors.textMuted} />}
                onPress={() =>
                  resolve.mutate({ reportId: item.id, status: "rejected" })
                }
              />
            </View>
          </View>
        )}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 14,
    gap: 6,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  list: {
    gap: 12,
    paddingBottom: 28,
  },
  report: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 10,
  },
  reportHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  date: {
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  reason: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  details: {
    fontSize: typography.body,
    lineHeight: 21,
  },
  target: {
    fontSize: typography.tiny,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
