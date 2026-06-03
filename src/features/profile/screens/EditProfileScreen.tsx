import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Camera, Image as ImageIcon, Save, Trash2 } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { pickImage, uploadBase64Image } from "../../../services/storage-service";
import { typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import { profileSchema, type ProfileInput } from "../../../utils/validation";
import { useAuth } from "../../auth/hooks/useAuth";
import { useUpdateProfileMutation } from "../hooks/useProfile";

export function EditProfileScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const updateProfile = useUpdateProfileMutation(auth.session?.user.id);
  const [uploading, setUploading] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: "",
      displayName: "",
      bio: "",
      avatarUrl: null,
      bannerUrl: null,
    },
  });

  const avatarUrl = form.watch("avatarUrl");
  const bannerUrl = form.watch("bannerUrl");
  const displayName = form.watch("displayName");

  useEffect(() => {
    if (auth.profile) {
      form.reset({
        username: auth.profile.username,
        displayName: auth.profile.display_name ?? "",
        bio: auth.profile.bio ?? "",
        avatarUrl: auth.profile.avatar_url,
        bannerUrl: auth.profile.banner_url,
      });
    }
  }, [auth.profile, form]);

  async function handlePickAvatar() {
    try {
      if (!auth.session?.user.id) {
        return;
      }

      setUploading(true);
      const asset = await pickImage();

      if (!asset?.base64) {
        return;
      }

      const url = await uploadBase64Image({
        bucket: "avatars",
        path: `${auth.session.user.id}/avatar.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      form.setValue("avatarUrl", url, { shouldValidate: true });
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handlePickBackground() {
    try {
      if (!auth.session?.user.id) {
        return;
      }

      setUploadingBg(true);
      const asset = await pickImage({ aspect: [9, 16] });

      if (!asset?.base64) {
        return;
      }

      const url = await uploadBase64Image({
        bucket: "banners",
        path: `${auth.session.user.id}/background.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      form.setValue("bannerUrl", url, { shouldValidate: true });
    } catch (error) {
      Alert.alert("No se pudo subir", getErrorMessage(error));
    } finally {
      setUploadingBg(false);
    }
  }

  async function handleSubmit(input: ProfileInput) {
    try {
      await updateProfile.mutateAsync(input);
      await auth.refreshProfile();
      router.back();
    } catch (error) {
      Alert.alert("No se pudo guardar", getErrorMessage(error));
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text }]}>Editar perfil</Text>
          <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
            Mantiene tu identidad publica clara y dentro de los limites de seguridad.
          </Text>
        </View>
        <View style={styles.avatarRow}>
          <Avatar uri={avatarUrl} label={displayName} size={78} />
          <Button
            title="Avatar"
            variant="secondary"
            icon={<Camera size={18} color={theme.colors.text} />}
            loading={uploading}
            onPress={handlePickAvatar}
          />
        </View>

        <View style={styles.bgSection}>
          <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>
            Fondo del perfil
          </Text>
          <Text style={[styles.sectionHint, { color: theme.colors.textMuted }]}>
            La imagen que elijas se aplica como fondo de tu perfil. Si no eliges
            ninguna, se usa el fondo cósmico por defecto.
          </Text>
          <View
            style={[
              styles.bgPreview,
              { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
            ]}
          >
            {bannerUrl ? (
              <Image
                source={{ uri: bannerUrl }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <View style={styles.bgEmpty}>
                <ImageIcon size={24} color={theme.colors.textFaint} />
                <Text style={[styles.bgEmptyText, { color: theme.colors.textFaint }]}>
                  Sin fondo · se usa el cósmico
                </Text>
              </View>
            )}
          </View>
          <View style={styles.bgActions}>
            <Button
              title={bannerUrl ? "Cambiar fondo" : "Elegir fondo"}
              variant="secondary"
              icon={<ImageIcon size={18} color={theme.colors.text} />}
              loading={uploadingBg}
              onPress={handlePickBackground}
            />
            {bannerUrl ? (
              <Button
                title="Quitar"
                variant="ghost"
                icon={<Trash2 size={18} color={theme.colors.text} />}
                onPress={() => form.setValue("bannerUrl", null, { shouldValidate: true })}
              />
            ) : null}
          </View>
        </View>
        <Controller
          control={form.control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextInput
              label="Nombre visible"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="username"
          render={({ field, fieldState }) => (
            <TextInput
              label="Username"
              autoCapitalize="none"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <TextInput
              label="Bio"
              multiline
              maxLength={160}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              style={styles.bioInput}
            />
          )}
        />
        <Button
          title="Guardar cambios"
          size="lg"
          loading={updateProfile.isPending}
          icon={<Save size={18} color="#FFFFFF" />}
          onPress={form.handleSubmit(handleSubmit)}
        />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingTop: 8,
    paddingBottom: 28,
  },
  header: {
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
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bgSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: typography.h3,
    fontWeight: "800",
  },
  sectionHint: {
    fontSize: typography.small,
    lineHeight: 18,
  },
  bgPreview: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
  },
  bgEmpty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  bgEmptyText: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  bgActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  bioInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
});
