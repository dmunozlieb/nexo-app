import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Orbit, Sparkles } from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { Button } from "../../../components/ui/Button";
import { GradientCard } from "../../../components/ui/GradientCard";
import { TagPill } from "../../../components/ui/TagPill";
import { TextInput } from "../../../components/ui/TextInput";
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

export function CreateCommunityScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const createCommunity = useCreateCommunityMutation(auth.session?.user.id);
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
