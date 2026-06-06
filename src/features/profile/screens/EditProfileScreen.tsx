import { useEffect, useMemo, useState } from "react";
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
import type { ProfileLink } from "../../../types/domain";
import { useAuth } from "../../auth/hooks/useAuth";
import { useUpdateProfileMutation } from "../hooks/useProfile";
import { AccentPicker } from "../components/AccentPicker";
import { LinksEditor } from "../components/LinksEditor";
import { LivePreviewHeader } from "../components/LivePreviewHeader";
import { resolveAccent } from "../utils/resolve-accent";

const USERNAME_COOLDOWN_DAYS = 90;

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
      accentColor: null,
      links: [],
    },
  });

  const avatarUrl = form.watch("avatarUrl");
  const bannerUrl = form.watch("bannerUrl");
  const displayName = form.watch("displayName");
  const username = form.watch("username");
  const accentColor = form.watch("accentColor");
  const links = form.watch("links") ?? [];

  const accent = resolveAccent({
    id: auth.session?.user.id ?? "",
    accent_color: accentColor ?? null,
  });

  const cooldownUntil = useMemo(() => {
    const changed = auth.profile?.username_changed_at;
    if (!changed) {
      return null;
    }
    const until = new Date(
      new Date(changed).getTime() + USERNAME_COOLDOWN_DAYS * 24 * 60 * 60 * 1000,
    );
    return until.getTime() > Date.now() ? until : null;
  }, [auth.profile?.username_changed_at]);

  useEffect(() => {
    if (auth.profile) {
      form.reset({
        username: auth.profile.username,
        displayName: auth.profile.display_name ?? "",
        bio: auth.profile.bio ?? "",
        avatarUrl: auth.profile.avatar_url,
        bannerUrl: auth.profile.banner_url,
        accentColor: auth.profile.accent_color ?? null,
        links: auth.profile.links ?? [],
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
            Asi te veran en tu perfil. Los cambios se aplican al guardar.
          </Text>
        </View>

        <LivePreviewHeader
          displayName={displayName}
          username={username}
          avatarUrl={avatarUrl ?? null}
          bannerUrl={bannerUrl ?? null}
          accent={accent}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Apariencia</Text>
        <View style={styles.avatarRow}>
          <Avatar uri={avatarUrl} label={displayName} size={64} />
          <Button
            title="Cambiar avatar"
            variant="secondary"
            icon={<Camera size={18} color={theme.colors.text} />}
            loading={uploading}
            onPress={handlePickAvatar}
          />
        </View>
        <View
          style={[
            styles.bgPreview,
            { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
          ]}
        >
          {bannerUrl ? (
            <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={styles.bgEmpty}>
              <ImageIcon size={24} color={theme.colors.textFaint} />
              <Text style={[styles.bgEmptyText, { color: theme.colors.textFaint }]}>
                Sin fondo · se usa el cosmico
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

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Identidad</Text>
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
              editable={!cooldownUntil}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
            />
          )}
        />
        {cooldownUntil ? (
          <Text style={[styles.hint, { color: theme.colors.warning }]}>
            Podras cambiar tu username el {cooldownUntil.toLocaleDateString()}.
          </Text>
        ) : null}
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <TextInput
              label="Bio"
              multiline
              maxLength={2000}
              value={field.value ?? ""}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              style={styles.bioInput}
            />
          )}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Color de acento</Text>
        <AccentPicker
          value={accentColor ?? null}
          onChange={(hex) => form.setValue("accentColor", hex, { shouldValidate: true })}
        />

        <Text style={[styles.sectionLabel, { color: theme.colors.text }]}>Enlaces</Text>
        <LinksEditor
          value={links as ProfileLink[]}
          onChange={(next) => form.setValue("links", next, { shouldValidate: true })}
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
  sectionLabel: {
    fontSize: typography.h3,
    fontWeight: "800",
    marginTop: 4,
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bgPreview: {
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
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
  },
  hint: {
    fontSize: typography.small,
    fontWeight: "600",
    marginTop: -8,
  },
  bioInput: {
    minHeight: 140,
    textAlignVertical: "top",
  },
});
