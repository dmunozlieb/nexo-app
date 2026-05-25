import { useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { ArrowLeft, Camera, Globe, Image as ImageIcon, Lock, Timer } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { TextInput } from "../../../components/ui/TextInput";
import { pickImage, uploadBase64Image } from "../../../services/storage-service";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { ChatVisibility } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateChatMutation } from "../hooks/useChat";

const SLOW_MODE_OPTIONS: { label: string; value: number }[] = [
  { label: "Off", value: 0 },
  { label: "5s", value: 5 },
  { label: "15s", value: 15 },
  { label: "30s", value: 30 },
  { label: "1min", value: 60 },
];

export function CreateChatScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const params = useLocalSearchParams<{ communityId?: string }>();
  const communityId = params.communityId ?? "";
  const createMutation = useCreateChatMutation(auth.session?.user.id);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<ChatVisibility>("public");
  const [slowMode, setSlowMode] = useState(0);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const [errors, setErrors] = useState<{ name?: string }>({});

  const userId = auth.session?.user.id ?? "";

  async function handlePickImage(target: "avatar" | "banner") {
    try {
      setUploading(target);
      const asset = await pickImage();
      if (!asset?.base64) return;
      const url = await uploadBase64Image({
        bucket: "avatars",
        path: `${userId}/chats/${communityId}/${target}-${Date.now()}.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      if (target === "avatar") setAvatarUrl(url);
      else setBannerUrl(url);
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploading(null);
    }
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setErrors({ name: "Elige un nombre de al menos 2 caracteres." });
      return;
    }
    if (trimmed.length > 50) {
      setErrors({ name: "Maximo 50 caracteres." });
      return;
    }
    setErrors({});

    try {
      const chat = await createMutation.mutateAsync({
        communityId,
        name: trimmed,
        description: description.trim() || null,
        avatarUrl,
        bannerUrl,
        visibility,
        slowModeSeconds: slowMode,
      });
      router.replace({
        pathname: "/chat/[id]",
        params: { id: chat.id },
      });
    } catch (error) {
      Alert.alert("No se pudo crear", getErrorMessage(error));
    }
  }

  if (!communityId) {
    return (
      <ScreenContainer>
        <Text style={{ color: theme.colors.error, padding: 16 }}>
          Falta el parametro communityId.
        </Text>
      </ScreenContainer>
    );
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
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Crear nuevo chat
          </Text>
          <Text
            style={[styles.subtitle, { color: theme.colors.textMuted }]}
          >
            Una sala nueva dentro de esta Orbita. Tu seras admin.
          </Text>
        </View>
      </View>

      <View style={styles.bannerWrap}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir banner"
          onPress={() => handlePickImage("banner")}
          style={({ pressed }) => [
            styles.banner,
            {
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              opacity: pressed ? 0.86 : 1,
            },
            bannerUrl ? null : styles.bannerEmpty,
          ]}
        >
          {bannerUrl ? (
            <>
              <Image
                source={{ uri: bannerUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={160}
              />
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { backgroundColor: "rgba(7,11,26,0.32)" },
                ]}
              />
              <View style={styles.bannerEditHint}>
                <ImageIcon size={14} color="#FFFFFF" />
                <Text style={styles.bannerEditHintText}>
                  {uploading === "banner" ? "Subiendo..." : "Cambiar banner"}
                </Text>
              </View>
            </>
          ) : (
            <>
              <ImageIcon size={22} color={theme.colors.textFaint} />
              <Text
                style={[styles.bannerHelper, { color: theme.colors.textFaint }]}
              >
                {uploading === "banner" ? "Subiendo..." : "Anadir banner (opcional)"}
              </Text>
            </>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir avatar"
          onPress={() => handlePickImage("avatar")}
          style={styles.avatarPicker}
        >
          <View
            style={[
              styles.avatarRing,
              { borderColor: theme.colors.background },
            ]}
          >
            <Avatar
              uri={avatarUrl}
              label={name || "Chat"}
              size={68}
            />
          </View>
          <View
            style={[
              styles.cameraBadge,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
              },
            ]}
          >
            <Camera size={13} color="#FFFFFF" />
          </View>
        </Pressable>
      </View>

      <View style={styles.form}>
        <TextInput
          label="Nombre del chat"
          placeholder="Ej. Critica de fanart"
          value={name}
          onChangeText={setName}
          error={errors.name}
          maxLength={50}
        />
        <TextInput
          label="Descripcion / normas (opcional)"
          placeholder="Cuenta de que va el chat y las normas basicas."
          value={description}
          onChangeText={setDescription}
          multiline
          maxLength={400}
          style={styles.bioInput}
        />

        <View style={styles.section}>
          <Text
            style={[styles.sectionTitle, { color: theme.colors.textMuted }]}
          >
            Visibilidad
          </Text>
          <View style={styles.visibilityRow}>
            <VisibilityOption
              active={visibility === "public"}
              icon={<Globe size={15} color={theme.colors.text} />}
              label="Publica"
              hint="Cualquiera de la Orbita puede entrar"
              onPress={() => setVisibility("public")}
            />
            <VisibilityOption
              active={visibility === "invite_only"}
              icon={<Lock size={15} color={theme.colors.text} />}
              label="Solo con invitacion"
              hint="Solo gente que el admin admita"
              onPress={() => setVisibility("invite_only")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Timer size={14} color={theme.colors.textMuted} />
            <Text
              style={[styles.sectionTitle, { color: theme.colors.textMuted }]}
            >
              Modo lento (anti-spam)
            </Text>
          </View>
          <View style={styles.slowRow}>
            {SLOW_MODE_OPTIONS.map((option) => {
              const active = slowMode === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => setSlowMode(option.value)}
                  style={({ pressed }) => [
                    styles.slowChip,
                    {
                      borderColor: active
                        ? theme.colors.secondary
                        : theme.colors.border,
                      backgroundColor: active
                        ? `${theme.colors.primary}24`
                        : "transparent",
                      opacity: pressed ? 0.82 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.slowChipText,
                      {
                        color: active ? "#FFFFFF" : theme.colors.textMuted,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <Button
        title="Crear chat"
        size="lg"
        loading={createMutation.isPending}
        onPress={handleCreate}
      />
    </ScreenContainer>
  );
}

function VisibilityOption({
  active,
  icon,
  label,
  hint,
  onPress,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  hint: string;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.visibilityOption,
        {
          borderColor: active ? theme.colors.secondary : theme.colors.border,
          backgroundColor: active
            ? `${theme.colors.primary}24`
            : theme.colors.surface,
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <View style={styles.visibilityHeader}>
        {icon}
        <Text
          style={[
            styles.visibilityLabel,
            { color: theme.colors.text },
          ]}
        >
          {label}
        </Text>
      </View>
      <Text
        style={[styles.visibilityHint, { color: theme.colors.textMuted }]}
      >
        {hint}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    gap: 2,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.small,
  },
  bannerWrap: {
    position: "relative",
    alignItems: "center",
    paddingBottom: 36,
  },
  banner: {
    width: "100%",
    height: 140,
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  bannerEmpty: {
    borderStyle: "dashed",
  },
  bannerEditHint: {
    position: "absolute",
    bottom: 10,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(7,11,26,0.6)",
  },
  bannerEditHintText: {
    color: "#FFFFFF",
    fontSize: typography.tiny,
    fontWeight: "800",
  },
  bannerHelper: {
    fontSize: typography.small,
    fontWeight: "700",
  },
  avatarPicker: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
  },
  avatarRing: {
    borderRadius: 999,
    borderWidth: 4,
    padding: 0,
  },
  cameraBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    gap: 14,
  },
  bioInput: {
    minHeight: 90,
    textAlignVertical: "top",
  },
  section: {
    gap: 8,
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
  visibilityRow: {
    flexDirection: "row",
    gap: 10,
  },
  visibilityOption: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: 12,
    gap: 4,
  },
  visibilityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  visibilityLabel: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  visibilityHint: {
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  slowRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  slowChip: {
    minWidth: 56,
    minHeight: 38,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  slowChipText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
});
