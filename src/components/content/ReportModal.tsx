import { useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { REPORT_REASONS, type ReportReason } from "../../constants/moderation";
import { typography } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";
import { BottomSheet } from "../ui/BottomSheet";
import { Button } from "../ui/Button";
import { TagPill } from "../ui/TagPill";
import { TextInput } from "../ui/TextInput";

type ReportModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmitReport: (reason: ReportReason, details?: string) => Promise<void>;
};

export function ReportModal({
  visible,
  onClose,
  onSubmitReport,
}: ReportModalProps) {
  const theme = useTheme();
  const [reason, setReason] = useState<ReportReason>("Acoso");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    try {
      setSubmitting(true);
      await onSubmitReport(reason, details.trim() || undefined);
      setDetails("");
      onClose();
    } catch (error) {
      Alert.alert(
        "No se pudo enviar",
        error instanceof Error ? error.message : "Intentalo de nuevo.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Reportar contenido</Text>
        <Text style={[styles.copy, { color: theme.colors.textMuted }]}>
          El reporte sera visible para moderadores de la Orbita o para el equipo de seguridad.
        </Text>
      </View>
      <View style={styles.reasons}>
        {REPORT_REASONS.map((item) => (
          <TagPill
            key={item}
            label={item}
            selected={item === reason}
            onPress={() => setReason(item)}
          />
        ))}
      </View>
      <TextInput
        label="Detalles opcionales"
        multiline
        value={details}
        onChangeText={setDetails}
        maxLength={1000}
        placeholder="Anade contexto util para moderacion."
        style={styles.detailsInput}
      />
      <View style={styles.actions}>
        <Button title="Cancelar" variant="ghost" onPress={onClose} />
        <Button title="Enviar reporte" loading={submitting} onPress={handleSubmit} />
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: 6,
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  copy: {
    fontSize: typography.small,
    lineHeight: 18,
  },
  reasons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  detailsInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
});
