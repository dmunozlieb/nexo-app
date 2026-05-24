import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Camera, Save } from "lucide-react-native";
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
  bioInput: {
    minHeight: 92,
    textAlignVertical: "top",
  },
});
