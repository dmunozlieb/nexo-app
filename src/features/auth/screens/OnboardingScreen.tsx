import { useEffect, useState, type ReactNode } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  Camera,
  MessageSquare,
  Orbit,
  Palette,
  Sparkles,
  Users,
} from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { GradientCard } from "../../../components/ui/GradientCard";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TagPill } from "../../../components/ui/TagPill";
import { TextInput } from "../../../components/ui/TextInput";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import {
  pickImage,
  uploadBase64Image,
} from "../../../services/storage-service";
import { typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import {
  onboardingSchema,
  type OnboardingInput,
} from "../../../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { completeOnboarding, listInterests } from "../services/auth-service";

export function OnboardingScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const interests = useQuery({
    queryKey: ["interests"],
    queryFn: listInterests,
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      username: "",
      displayName: auth.profile?.display_name ?? "",
      bio: "",
      interestIds: [],
      avatarUrl: auth.profile?.avatar_url ?? null,
    },
  });

  const selectedInterests = form.watch("interestIds");
  const avatarUrl = form.watch("avatarUrl");

  useEffect(() => {
    if (auth.profile) {
      const pendingUsername =
        typeof auth.session?.user.user_metadata?.username === "string"
          ? auth.session.user.user_metadata.username
          : "";

      form.reset({
        username: auth.profile.username.startsWith("nexo_")
          ? pendingUsername
          : auth.profile.username,
        displayName: auth.profile.display_name ?? "",
        bio: auth.profile.bio ?? "",
        interestIds: [],
        avatarUrl: auth.profile.avatar_url,
      });
    }
  }, [auth.profile, auth.session?.user.user_metadata?.username, form]);

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

  function toggleInterest(interestId: string) {
    const next = selectedInterests.includes(interestId)
      ? selectedInterests.filter((id) => id !== interestId)
      : [...selectedInterests, interestId];
    form.setValue("interestIds", next, { shouldValidate: true });
  }

  async function handleSubmit(input: OnboardingInput) {
    try {
      if (!auth.session?.user.id) {
        router.replace("/login");
        return;
      }

      setSaving(true);
      await completeOnboarding(auth.session.user.id, input);
      await auth.refreshProfile();
      router.replace("/home");
    } catch (error) {
      Alert.alert("No se pudo guardar", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (interests.isLoading) {
    return <LoadingState label="Preparando intereses..." />;
  }

  return (
    <ScreenContainer scroll contentStyle={styles.screen}>
      <View style={styles.header}>
        <GradientCard contentStyle={styles.welcomeCard}>
          <View style={styles.welcomeCopy}>
            <View style={styles.eyebrow}>
              <Sparkles size={15} color={theme.colors.secondary} />
              <Text
                style={[styles.eyebrowText, { color: theme.colors.secondary }]}
              >
                Primer salto
              </Text>
            </View>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Ajusta tu senal inicial
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              Elige intereses, crea tu identidad y entra en Orbitas con gente
              afin.
            </Text>
          </View>
          <NexoMascot size={118} />
        </GradientCard>
        <View style={styles.featureGrid}>
          <Feature
            icon={<Orbit size={17} color={theme.colors.secondary} />}
            label="Explora comunidades"
          />
          <Feature
            icon={<Palette size={17} color={theme.colors.accent} />}
            label="Publica ideas"
          />
          <Feature
            icon={<MessageSquare size={17} color={theme.colors.success} />}
            label="Chatea por intereses"
          />
          <Feature
            icon={<Users size={17} color={theme.colors.warning} />}
            label="Crea tu perfil"
          />
        </View>
      </View>

      <View style={styles.avatarRow}>
        <Avatar uri={avatarUrl} label={form.watch("displayName")} size={76} />
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
            placeholder="tu_nombre"
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
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="Cuenta que te mueve por aqui."
            style={styles.bioInput}
          />
        )}
      />

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Intereses
        </Text>
        <View style={styles.interests}>
          {(interests.data ?? []).map((interest) => (
            <TagPill
              key={interest.id}
              label={`${interest.icon ?? "#"} ${interest.name}`}
              selected={selectedInterests.includes(interest.id)}
              onPress={() => toggleInterest(interest.id)}
            />
          ))}
        </View>
        {form.formState.errors.interestIds?.message ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {form.formState.errors.interestIds.message}
          </Text>
        ) : null}
      </View>

      <Button
        title="Entrar a Nexo"
        size="lg"
        loading={saving}
        onPress={form.handleSubmit(handleSubmit)}
      />
    </ScreenContainer>
  );
}

function Feature({ icon, label }: { icon: ReactNode; label: string }) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.feature,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
        },
      ]}
    >
      {icon}
      <Text style={[styles.featureText, { color: theme.colors.textMuted }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
    paddingTop: 18,
  },
  header: {
    gap: 12,
  },
  welcomeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  welcomeCopy: {
    flex: 1,
    minWidth: 0,
    gap: 8,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eyebrowText: {
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
    lineHeight: 22,
  },
  featureGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  feature: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  featureText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  avatarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  bioInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: typography.h3,
    fontWeight: "900",
  },
  interests: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  error: {
    fontSize: typography.small,
  },
});
