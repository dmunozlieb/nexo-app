import { useState } from "react";
import { Alert, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { ImagePlus, X } from "lucide-react-native";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { pickImage, uploadBase64Image } from "../../../services/storage-service";
import { getErrorMessage } from "../../../utils/errors";
import {
  CHAT_BACKGROUNDS,
  presetValue,
  resolveBackground,
} from "../utils/backgrounds";

type BackgroundPickerProps = {
  visible: boolean;
  current: string | null;
  conversationId: string;
  userId: string;
  onClose: () => void;
  onSelect: (value: string | null) => void;
  saving?: boolean;
};

export function BackgroundPicker({
  visible,
  current,
  conversationId,
  userId,
  onClose,
  onSelect,
  saving,
}: BackgroundPickerProps) {
  const theme = useTheme();
  const [uploading, setUploading] = useState(false);
  const resolved = resolveBackground(current);

  async function handleUpload() {
    try {
      setUploading(true);
      const asset = await pickImage();
      if (!asset?.base64) return;
      const url = await uploadBase64Image({
        bucket: "avatars",
        path: `${userId}/chats/${conversationId}/background-${Date.now()}.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      onSelect(url);
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Fondo del chat</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={onClose}>
              <X size={18} color={theme.colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.grid}>
            {CHAT_BACKGROUNDS.map((preset) => {
              const active =
                resolved.kind === "preset" &&
                resolved.gradient[0] === preset.gradient[0] &&
                resolved.gradient[1] === preset.gradient[1];
              return (
                <Pressable
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityLabel={preset.label}
                  accessibilityState={{ selected: active }}
                  onPress={() => onSelect(presetValue(preset.id))}
                  style={[styles.swatch, active ? { borderColor: theme.colors.primary, borderWidth: 2 } : null]}
                >
                  <LinearGradient
                    colors={preset.gradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </Pressable>
              );
            })}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sin fondo"
              accessibilityState={{ selected: resolved.kind === "none" }}
              onPress={() => onSelect(null)}
              style={[
                styles.swatch,
                styles.none,
                { borderColor: resolved.kind === "none" ? theme.colors.primary : theme.colors.border },
              ]}
            >
              <Text style={[styles.noneText, { color: theme.colors.textMuted }]}>Ninguno</Text>
            </Pressable>
          </View>

          {resolved.kind === "image" ? (
            <View style={styles.preview}>
              <Image source={{ uri: resolved.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <Text style={styles.previewLabel}>Imagen subida</Text>
            </View>
          ) : null}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Subir imagen"
            onPress={handleUpload}
            disabled={uploading || saving}
            style={({ pressed }) => [
              styles.upload,
              { borderColor: theme.colors.border, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <ImagePlus size={16} color={theme.colors.textMuted} />
            <Text style={[styles.uploadText, { color: theme.colors.textMuted }]}>
              {uploading ? "Subiendo..." : "Subir imagen"}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  sheet: { width: "100%", maxWidth: 380, borderRadius: radius.lg, borderWidth: 1, padding: 16, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: typography.h3, fontWeight: "900" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: { width: 88, height: 60, borderRadius: radius.md, overflow: "hidden", borderWidth: 1, borderColor: "transparent" },
  none: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)" },
  noneText: { fontSize: typography.tiny, fontWeight: "800" },
  preview: { height: 80, borderRadius: radius.md, overflow: "hidden", justifyContent: "flex-end" },
  previewLabel: { color: "#fff", fontSize: typography.tiny, fontWeight: "800", padding: 8 },
  upload: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    borderWidth: 1, borderStyle: "dashed", borderRadius: radius.md, paddingVertical: 12,
  },
  uploadText: { fontSize: typography.small, fontWeight: "800" },
});
