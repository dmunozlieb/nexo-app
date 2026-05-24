import { useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Camera, ImagePlus, Orbit, Sparkles, Trash2 } from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { GradientCard } from "../../../components/ui/GradientCard";
import { TagPill } from "../../../components/ui/TagPill";
import { TextInput } from "../../../components/ui/TextInput";
import {
  pickImage,
  uploadBase64Image,
  type PickImageOptions,
} from "../../../services/storage-service";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { Visibility } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import {
  createCommunitySchema,
  type CreateCommunityInput,
} from "../../../utils/validation";
import { useAuth } from "../../auth/hooks/useAuth";
import { useCreateCommunityMutation } from "../hooks/useCommunities";

const CATEGORIES = ["Arte", "Gaming", "Lectura", "Musica", "Cine", "Tecnologia"];
const VISIBILITY: Array<{ label: string; value: Visibility }> = [
  { label: "Publica", value: "public" },
  { label: "Privada", value: "private" },
  { label: "Oculta", value: "unlisted" },
];
const MAX_BANNER_IMAGE_BYTES = 8 * 1024 * 1024;

export function CreateCommunityScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const createCommunity = useCreateCommunityMutation(auth.session?.user.id);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const form = useForm<CreateCommunityInput>({
    resolver: zodResolver(createCommunitySchema),
    defaultValues: {
      name: "",
      category: "Arte",
      description: "",
      rulesText: "Respeta a otras personas.\nEvita spam.\nMarca spoilers o temas sensibles.",
      visibility: "public",
      avatarUrl: null,
      bannerUrl: null,
    },
  });

  const selectedCategory = form.watch("category");
  const selectedVisibility = form.watch("visibility");
  const avatarUrl = form.watch("avatarUrl");
  const bannerUrl = form.watch("bannerUrl");
  const namePreview = form.watch("name");
  const visibilityLabel =
    VISIBILITY.find((item) => item.value === selectedVisibility)?.label ?? "Publica";

  async function handlePickAsset(kind: "avatar" | "banner") {
    try {
      if (!auth.session?.user.id) {
        return;
      }

      const isAvatar = kind === "avatar";
      const setUploading = isAvatar ? setUploadingAvatar : setUploadingBanner;
      setUploading(true);

      const pickOptions: PickImageOptions = {
        aspect: isAvatar ? [1, 1] : [16, 9],
      };

      if (!isAvatar) {
        pickOptions.maxBytes = MAX_BANNER_IMAGE_BYTES;
      }

      const asset = await pickImage(pickOptions);

      if (!asset?.base64) {
        return;
      }

      const url = await uploadBase64Image({
        bucket: isAvatar ? "avatars" : "banners",
        path: `${auth.session.user.id}/communities/${Date.now()}-${kind}.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });

      form.setValue(isAvatar ? "avatarUrl" : "bannerUrl", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
    } catch (error) {
      Alert.alert("No se pudo subir la imagen", getErrorMessage(error));
    } finally {
      if (kind === "avatar") {
        setUploadingAvatar(false);
      } else {
        setUploadingBanner(false);
      }
    }
  }

  function clearAsset(kind: "avatar" | "banner") {
    form.setValue(kind === "avatar" ? "avatarUrl" : "bannerUrl", null, {
      shouldDirty: true,
      shouldValidate: true,
    });
  }

  async function handleSubmit(input: CreateCommunityInput) {
    try {
      const community = await createCommunity.mutateAsync(input);
      router.replace({ pathname: "/community/[id]", params: { id: community.id } });
    } catch (error) {
      Alert.alert("No se pudo crear la Orbita", getErrorMessage(error));
    }
  }

  return (
    <ScreenContainer>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <GradientCard contentStyle={styles.heroContent}>
          <View style={styles.heroCopy}>
            <View style={styles.eyebrow}>
              <Sparkles size={15} color={theme.colors.secondary} />
              <Text style={[styles.eyebrowText, { color: theme.colors.secondary }]}>
                Nueva Orbita
              </Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Reune gente alrededor de una idea
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Crea una comunidad con normas claras, chat propio y espacio para publicar.
            </Text>
          </View>
          <NexoMascot size={118} />
        </GradientCard>

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Identidad visual</Text>
          <View
            style={[
              styles.mediaEditor,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.bannerPreview}>
              {bannerUrl ? (
                <Image source={{ uri: bannerUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <LinearGradient
                  colors={[theme.colors.primary, theme.colors.secondary, theme.colors.accent]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View style={styles.bannerShade} />
            </View>
            <View style={styles.mediaBody}>
              <View style={styles.identityPreview}>
                <View style={[styles.avatarLift, { backgroundColor: theme.colors.surface }]}>
                  <Avatar uri={avatarUrl} label={namePreview || "Orbita"} size={74} />
                </View>
                <View style={styles.identityCopy}>
                  <Text style={[styles.previewName, { color: theme.colors.text }]} numberOfLines={1}>
                    {namePreview || "Tu nueva Orbita"}
                  </Text>
                  <Text style={[styles.previewMeta, { color: theme.colors.textMuted }]} numberOfLines={1}>
                    {selectedCategory} - {visibilityLabel}
                  </Text>
                </View>
              </View>
              <View style={styles.mediaActions}>
                <Button
                  title="Avatar"
                  variant="secondary"
                  size="sm"
                  loading={uploadingAvatar}
                  icon={<Camera size={16} color={theme.colors.text} />}
                  onPress={() => void handlePickAsset("avatar")}
                />
                {avatarUrl ? (
                  <Button
                    title="Quitar"
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} color={theme.colors.text} />}
                    onPress={() => clearAsset("avatar")}
                  />
                ) : null}
                <Button
                  title="Banner"
                  variant="secondary"
                  size="sm"
                  loading={uploadingBanner}
                  icon={<ImagePlus size={16} color={theme.colors.text} />}
                  onPress={() => void handlePickAsset("banner")}
                />
                {bannerUrl ? (
                  <Button
                    title="Quitar"
                    variant="ghost"
                    size="sm"
                    icon={<Trash2 size={16} color={theme.colors.text} />}
                    onPress={() => clearAsset("banner")}
                  />
                ) : null}
              </View>
            </View>
          </View>
        </View>

        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <TextInput
              label="Nombre"
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Ej. Exploradores de Indie Games"
              icon={<Orbit size={18} color={theme.colors.textFaint} />}
            />
          )}
        />

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Categoria</Text>
          <View style={styles.pills}>
            {CATEGORIES.map((category) => (
              <TagPill
                key={category}
                label={category}
                selected={selectedCategory === category}
                onPress={() =>
                  form.setValue("category", category, { shouldValidate: true })
                }
              />
            ))}
          </View>
          {form.formState.errors.category?.message ? (
            <Text style={[styles.error, { color: theme.colors.error }]}>
              {form.formState.errors.category.message}
            </Text>
          ) : null}
        </View>

        <Controller
          control={form.control}
          name="description"
          render={({ field, fieldState }) => (
            <TextInput
              label="Descripcion"
              multiline
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Cuenta que se comparte aqui, para quien es y que energia tiene."
              style={styles.textArea}
            />
          )}
        />

        <Controller
          control={form.control}
          name="rulesText"
          render={({ field, fieldState }) => (
            <TextInput
              label="Normas iniciales"
              multiline
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Una norma por linea"
              style={styles.rulesArea}
            />
          )}
        />

        <View style={styles.section}>
          <Text style={[styles.label, { color: theme.colors.text }]}>Visibilidad</Text>
          <View style={styles.pills}>
            {VISIBILITY.map((item) => (
              <TagPill
                key={item.value}
                label={item.label}
                selected={selectedVisibility === item.value}
                onPress={() =>
                  form.setValue("visibility", item.value, { shouldValidate: true })
                }
              />
            ))}
          </View>
        </View>

        <Button
          title="Crear Orbita"
          size="lg"
          loading={createCommunity.isPending}
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
  heroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  eyebrow: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: radius.pill,
  },
  eyebrowText: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
    lineHeight: 29,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  section: {
    gap: 10,
  },
  label: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  mediaEditor: {
    borderWidth: 1,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  bannerPreview: {
    height: 148,
    width: "100%",
    overflow: "hidden",
  },
  bannerShade: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "rgba(9,10,18,0.22)",
  },
  mediaBody: {
    gap: 12,
    padding: 12,
    paddingTop: 0,
  },
  identityPreview: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  avatarLift: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    marginTop: -38,
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    paddingBottom: 8,
  },
  previewName: {
    fontSize: typography.h2,
    fontWeight: "900",
  },
  previewMeta: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  mediaActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  textArea: {
    minHeight: 118,
    textAlignVertical: "top",
  },
  rulesArea: {
    minHeight: 104,
    textAlignVertical: "top",
  },
  error: {
    fontSize: typography.small,
  },
});
