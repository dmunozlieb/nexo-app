import { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { ImagePlus, Send } from "lucide-react-native";
import { Image } from "expo-image";
import { POST_TYPES } from "../../../constants/post";
import { Button } from "../../../components/ui/Button";
import { EmptyState } from "../../../components/ui/EmptyState";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TagPill } from "../../../components/ui/TagPill";
import { TextInput } from "../../../components/ui/TextInput";
import { GradientCard } from "../../../components/ui/GradientCard";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { pickImage, uploadBase64Image } from "../../../services/storage-service";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import type { PostType } from "../../../types/domain";
import { getErrorMessage } from "../../../utils/errors";
import { postFormSchema, type PostFormInput } from "../../../utils/validation";
import { useAuth } from "../../auth/hooks/useAuth";
import { useJoinedCommunities } from "../../communities/hooks/useCommunities";
import { useCreatePostMutation } from "../hooks/usePosts";

export function CreatePostScreen() {
  const { communityId } = useLocalSearchParams<{ communityId?: string }>();
  const theme = useTheme();
  const auth = useAuth();
  const joined = useJoinedCommunities(auth.session?.user.id);
  const createPost = useCreatePostMutation(auth.session?.user.id);
  const [uploading, setUploading] = useState(false);

  const form = useForm<PostFormInput>({
    resolver: zodResolver(postFormSchema),
    defaultValues: {
      communityId: "",
      type: "debate",
      title: "",
      body: "",
      mediaUrls: [],
    },
  });

  const selectedCommunity = form.watch("communityId");
  const selectedType = form.watch("type");
  const mediaUrls = form.watch("mediaUrls");
  const isCommunityContext = Boolean(communityId);

  useEffect(() => {
    if (communityId && selectedCommunity !== communityId) {
      form.setValue("communityId", communityId, { shouldValidate: true });
      return;
    }

    const firstCommunity = joined.data?.[0];
    if (firstCommunity && !selectedCommunity) {
      form.setValue("communityId", firstCommunity.id, { shouldValidate: true });
    }
  }, [communityId, form, joined.data, selectedCommunity]);

  async function handlePickImage() {
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
        bucket: "post-media",
        path: `${auth.session.user.id}/${Date.now()}.jpg`,
        base64: asset.base64,
        contentType: asset.mimeType ?? "image/jpeg",
      });
      form.setValue("mediaUrls", [...mediaUrls, url], { shouldValidate: true });
    } catch (error) {
      Alert.alert("No se pudo subir la imagen", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(input: PostFormInput) {
    try {
      const post = await createPost.mutateAsync(input);
      router.replace({ pathname: "/post/[id]", params: { id: post.id } });
    } catch (error) {
      Alert.alert("No se pudo publicar", getErrorMessage(error));
    }
  }

  if (joined.isLoading) {
    return <LoadingState label="Revisando tus Orbitas..." />;
  }

  if ((joined.data ?? []).length === 0) {
    return (
      <ScreenContainer>
        <EmptyState
          title="Necesitas una Orbita"
          message="Unete a una comunidad antes de publicar."
          action={<Button title="Descubrir" onPress={() => router.push("/discover")} />}
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer contentStyle={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <GradientCard style={styles.composerCard} contentStyle={styles.content}>
          <View style={styles.header}>
            <Text style={[styles.kicker, { color: theme.colors.secondary }]}>
              Nuevo eco
            </Text>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Crear publicacion
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {isCommunityContext
                ? "Elige una energia y deja un eco claro para esta comunidad."
                : "Elige una energia, una Orbita y deja un eco claro para la comunidad."}
            </Text>
          </View>

          {!isCommunityContext ? (
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.colors.text }]}>Orbita destino</Text>
              <View style={styles.pills}>
                {(joined.data ?? []).map((community) => (
                  <TagPill
                    key={community.id}
                    label={community.name}
                    selected={selectedCommunity === community.id}
                    onPress={() =>
                      form.setValue("communityId", community.id, { shouldValidate: true })
                    }
                  />
                ))}
              </View>
              {form.formState.errors.communityId?.message ? (
                <Text style={[styles.error, { color: theme.colors.error }]}>
                  {form.formState.errors.communityId.message}
                </Text>
              ) : null}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={[styles.label, { color: theme.colors.text }]}>Energia</Text>
            <View style={styles.pills}>
              {POST_TYPES.map((type) => (
                <TagPill
                  key={type.value}
                  label={type.label}
                  selected={selectedType === type.value}
                  onPress={() =>
                    form.setValue("type", type.value as PostType, { shouldValidate: true })
                  }
                />
              ))}
            </View>
          </View>

          <Controller
            control={form.control}
            name="title"
            render={({ field, fieldState }) => (
              <TextInput
                label="Titulo opcional"
                maxLength={120}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Una pregunta potente o una idea breve"
              />
            )}
          />
          <Controller
            control={form.control}
            name="body"
            render={({ field, fieldState }) => (
              <TextInput
                label="Contenido"
                multiline
                maxLength={5000}
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
                placeholder="Escribe tu eco..."
                style={styles.bodyInput}
              />
            )}
          />

          {mediaUrls[0] ? (
            <Image source={{ uri: mediaUrls[0] }} style={styles.preview} contentFit="cover" />
          ) : null}
          <View style={styles.actions}>
            <Button
              title="Imagen"
              variant="secondary"
              loading={uploading}
              icon={<ImagePlus size={18} color={theme.colors.text} />}
              onPress={handlePickImage}
            />
            <Button
              title="Publicar"
              loading={createPost.isPending}
              icon={<Send size={18} color="#FFFFFF" />}
              onPress={form.handleSubmit(handleSubmit)}
            />
          </View>
        </GradientCard>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: "center",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingTop: 48,
    paddingBottom: 48,
  },
  composerCard: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
  },
  content: {
    gap: 16,
    padding: 22,
  },
  header: {
    gap: 6,
  },
  kicker: {
    fontSize: typography.tiny,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 21,
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
  bodyInput: {
    minHeight: 180,
    textAlignVertical: "top",
  },
  preview: {
    width: "100%",
    aspectRatio: 16 / 10,
    borderRadius: radius.md,
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "flex-end",
  },
  error: {
    fontSize: typography.small,
  },
});
