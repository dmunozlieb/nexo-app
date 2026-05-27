import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { ArrowLeft, Camera, Sparkles, Trash2 } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { TextInput } from "../../../components/ui/TextInput";
import { env } from "../../../lib/env";
import {
  pickImage,
  uploadBase64Image,
} from "../../../services/storage-service";
import { fontFamilies, radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import type { Interest } from "../../../types/domain";
import {
  onboardingSchema,
  type OnboardingInput,
} from "../../../utils/validation";
import { AuthCosmicScaffold } from "../components/AuthCosmicScaffold";
import { AuthOrbitMascot } from "../components/AuthOrbitMascot";
import { useAuth } from "../hooks/useAuth";
import { completeOnboarding, listInterests } from "../services/auth-service";
import { AUTH_CTA_GRADIENT, AuthSubmitButton, useReduceMotion } from "../shared";

const INTEREST_EMOJI: Record<string, string> = {
  art: "🎨",
  game: "🎮",
  book: "📚",
  music: "🎵",
  code: "💻",
  film: "🎬",
};

const STEPS = ["quien", "identidad", "orbita"] as const;
type StepKey = (typeof STEPS)[number];

const STEP_META: Record<
  StepKey,
  { eyebrow: string; title: string; subtitle: string; label: string }
> = {
  quien: {
    eyebrow: "Primer salto",
    title: "Crea tu identidad",
    subtitle: "Elige como te vera la galaxia. Puedes cambiarlo cuando quieras.",
    label: "Identidad",
  },
  identidad: {
    eyebrow: "Tu firma",
    title: "Elige tu @username",
    subtitle:
      "Sera tu firma dentro de Nexo. Usa letras, numeros o guion bajo.",
    label: "Perfil",
  },
  orbita: {
    eyebrow: "Casi listo",
    title: "Que te mueve?",
    subtitle:
      "Elige al menos una categoria para encontrar comunidades afines.",
    label: "Intereses",
  },
};

const BIO_LIMIT = 160;
const DEMO_DEFAULTS = {
  displayName: "Explorador Nexo",
  username: "demo_user",
  bio: "Preparando mi primera Orbita.",
} as const;

function getInterestEmoji(icon: string | null | undefined) {
  if (!icon) {
    return "✨";
  }
  return INTEREST_EMOJI[icon] ?? "✨";
}

function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function applyDemoFallbacks(
  input: OnboardingInput,
  context: {
    profileDisplayName?: string | null | undefined;
    profileUsername?: string | null | undefined;
    profileAvatarUrl?: string | null | undefined;
    pendingUsername?: string | undefined;
    firstInterestId?: string | undefined;
  },
): OnboardingInput {
  const profileUsernameValid =
    context.profileUsername && !context.profileUsername.startsWith("nexo_")
      ? context.profileUsername
      : undefined;

  return {
    displayName:
      input.displayName?.trim() ||
      context.profileDisplayName ||
      DEMO_DEFAULTS.displayName,
    username:
      normalizeUsername(input.username ?? "") ||
      profileUsernameValid ||
      (context.pendingUsername && normalizeUsername(context.pendingUsername)) ||
      DEMO_DEFAULTS.username,
    bio: input.bio?.trim() || DEMO_DEFAULTS.bio,
    interestIds: input.interestIds.length
      ? input.interestIds
      : context.firstInterestId
        ? [context.firstInterestId]
        : [],
    avatarUrl: input.avatarUrl ?? context.profileAvatarUrl ?? null,
  };
}

export function OnboardingScreen() {
  const theme = useTheme();
  const auth = useAuth();
  const reduceMotion = useReduceMotion();
  const interests = useQuery({
    queryKey: ["interests"],
    queryFn: listInterests,
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const stepOpacity = useRef(new Animated.Value(1)).current;

  const form = useForm<OnboardingInput>({
    resolver: zodResolver(onboardingSchema),
    mode: "onSubmit",
    reValidateMode: "onChange",
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
  const currentDisplayName = form.watch("displayName");
  const bioValue = form.watch("bio") ?? "";

  useEffect(() => {
    if (!auth.profile) {
      return;
    }

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
  }, [auth.profile, auth.session?.user.user_metadata?.username, form]);

  const currentStep: StepKey = STEPS[stepIndex] ?? "quien";
  const isLast = stepIndex === STEPS.length - 1;
  const isFirst = stepIndex === 0;
  const meta = STEP_META[currentStep];
  const canSubmit = !isLast || selectedInterests.length > 0;

  function fadeToStep(nextIndex: number) {
    if (reduceMotion) {
      setStepIndex(nextIndex);
      return;
    }

    Animated.timing(stepOpacity, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setStepIndex(nextIndex);
      Animated.timing(stepOpacity, {
        toValue: 1,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    });
  }

  async function handleNext() {
    const fields =
      currentStep === "quien"
        ? (["displayName"] as const)
        : currentStep === "identidad"
          ? (["username", "bio"] as const)
          : (["interestIds"] as const);

    const valid = await form.trigger(fields);
    if (!valid) {
      return;
    }

    if (isLast) {
      void handleSubmit();
      return;
    }

    fadeToStep(Math.min(stepIndex + 1, STEPS.length - 1));
  }

  function handleBack() {
    fadeToStep(Math.max(stepIndex - 1, 0));
  }

  async function handlePickAvatar() {
    if (!auth.session?.user.id) {
      return;
    }

    try {
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
      form.setValue("avatarUrl", url, { shouldValidate: false });
    } catch (error) {
      console.warn("avatar upload failed", getErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function handleSkipAvatar() {
    form.setValue("avatarUrl", null, { shouldValidate: false });
  }

  function toggleInterest(interestId: string) {
    const next = selectedInterests.includes(interestId)
      ? selectedInterests.filter((id) => id !== interestId)
      : [...selectedInterests, interestId];
    form.setValue("interestIds", next, { shouldValidate: true });
  }

  async function handleSubmit() {
    if (!auth.session?.user.id) {
      router.replace("/login");
      return;
    }

    const baseValues = form.getValues();
    const payload: OnboardingInput = env.demoMode
      ? applyDemoFallbacks(baseValues, {
          profileDisplayName: auth.profile?.display_name,
          profileUsername: auth.profile?.username,
          profileAvatarUrl: auth.profile?.avatar_url,
          pendingUsername:
            typeof auth.session.user.user_metadata?.username === "string"
              ? auth.session.user.user_metadata.username
              : undefined,
          firstInterestId: interests.data?.[0]?.id,
        })
      : baseValues;

    if (!env.demoMode) {
      const valid = await form.trigger();
      if (!valid) {
        return;
      }
    }

    try {
      setSaving(true);
      await completeOnboarding(auth.session.user.id, payload);
      await auth.refreshProfile();
      router.replace("/home");
    } catch (error) {
      console.warn("onboarding submit failed", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthCosmicScaffold
      formHeader={
        <OnboardingHeader
          eyebrow={meta.eyebrow}
          title={meta.title}
          reduceMotion={reduceMotion}
          eyebrowColor={theme.colors.secondary}
          titleColor={theme.colors.text}
        />
      }
      hideDesktopVisual
    >
      <View style={styles.form}>
        <ProgressIndicator
          total={STEPS.length}
          currentIndex={stepIndex}
          currentLabel={meta.label}
          primaryColor={theme.colors.primary}
          secondaryColor={theme.colors.secondary}
          textColor={theme.colors.textFaint}
        />

        <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
          {meta.subtitle}
        </Text>

        <Animated.View style={[styles.stepBody, { opacity: stepOpacity }]}>
          {currentStep === "quien" ? (
            <StepWhoAreYou
              avatarUrl={avatarUrl}
              displayName={currentDisplayName}
              uploading={uploading}
              form={form}
              onPickAvatar={handlePickAvatar}
              onSkipAvatar={handleSkipAvatar}
            />
          ) : null}

          {currentStep === "identidad" ? (
            <StepIdentity form={form} bioLength={bioValue.length} />
          ) : null}

          {currentStep === "orbita" ? (
            <StepInterests
              interests={interests.data ?? []}
              selectedIds={selectedInterests}
              onToggle={toggleInterest}
              errorMessage={form.formState.errors.interestIds?.message}
              reduceMotion={reduceMotion}
              loading={interests.isLoading}
            />
          ) : null}
        </Animated.View>

        <View style={styles.footer}>
          {!isFirst ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Paso anterior"
              onPress={handleBack}
              disabled={saving}
              style={({ pressed }) => [
                styles.backButton,
                { opacity: saving ? 0.5 : pressed ? 0.78 : 1 },
              ]}
            >
              <ArrowLeft size={18} color={theme.colors.text} />
            </Pressable>
          ) : null}
          <AuthSubmitButton
            title={isLast ? "Aterrizar en Nexo" : "Siguiente"}
            loading={saving}
            disabled={!canSubmit}
            iconRight={isLast ? null : undefined}
            onPress={handleNext}
            style={styles.nextButton}
          />
        </View>
      </View>
    </AuthCosmicScaffold>
  );
}

function OnboardingHeader({
  eyebrow,
  title,
  reduceMotion,
  eyebrowColor,
  titleColor,
}: {
  eyebrow: string;
  title: string;
  reduceMotion: boolean;
  eyebrowColor: string;
  titleColor: string;
}) {
  return (
    <View style={styles.headerRow}>
      <AuthOrbitMascot size={64} animated={!reduceMotion} />
      <View style={styles.headerCopy}>
        <View style={styles.eyebrow}>
          <Sparkles size={13} color={eyebrowColor} />
          <Text style={[styles.eyebrowText, { color: eyebrowColor }]}>
            {eyebrow}
          </Text>
        </View>
        <Text style={[styles.headerTitle, { color: titleColor }]}>{title}</Text>
      </View>
    </View>
  );
}

function ProgressIndicator({
  total,
  currentIndex,
  currentLabel,
  primaryColor,
  secondaryColor,
  textColor,
}: {
  total: number;
  currentIndex: number;
  currentLabel: string;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}) {
  return (
    <View style={styles.progressWrap}>
      <View style={styles.dotsRow}>
        {Array.from({ length: total }).map((_, index) => {
          const active = index === currentIndex;
          const completed = index < currentIndex;
          const filled = active || completed;

          return (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  width: active ? 28 : 8,
                  backgroundColor: filled
                    ? active
                      ? primaryColor
                      : secondaryColor
                    : "rgba(255,255,255,0.12)",
                  shadowColor: active ? primaryColor : "transparent",
                  shadowOpacity: active ? 0.6 : 0,
                },
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.progressText, { color: textColor }]}>
        Paso {currentIndex + 1} de {total} · {currentLabel}
      </Text>
    </View>
  );
}

type FormShape = ReturnType<typeof useForm<OnboardingInput>>;

function StepWhoAreYou({
  avatarUrl,
  displayName,
  uploading,
  form,
  onPickAvatar,
  onSkipAvatar,
}: {
  avatarUrl: string | null | undefined;
  displayName: string | undefined;
  uploading: boolean;
  form: FormShape;
  onPickAvatar: () => void;
  onSkipAvatar: () => void;
}) {
  const theme = useTheme();
  const hasAvatar = Boolean(avatarUrl);

  return (
    <View style={styles.stepContent}>
      <View style={styles.avatarBlock}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Elegir avatar"
          onPress={onPickAvatar}
          style={({ pressed }) => [
            styles.avatarPicker,
            { opacity: pressed ? 0.86 : 1 },
          ]}
        >
          <LinearGradient
            colors={AUTH_CTA_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View style={styles.avatarInner}>
              <Avatar
                uri={avatarUrl}
                label={displayName ?? "Nexo"}
                size={118}
              />
            </View>
          </LinearGradient>
          <View
            style={[
              styles.avatarBadge,
              { backgroundColor: theme.colors.primary },
            ]}
          >
            <Camera size={15} color="#FFFFFF" />
          </View>
        </Pressable>
        <View style={styles.avatarActionsRow}>
          <Text
            style={[styles.avatarHelper, { color: theme.colors.textFaint }]}
          >
            {uploading
              ? "Subiendo..."
              : hasAvatar
                ? "Toca para cambiar"
                : "Toca para elegir una imagen"}
          </Text>
          {hasAvatar ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Quitar foto"
              onPress={onSkipAvatar}
              style={({ pressed }) => [
                styles.linkButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Trash2 size={13} color={theme.colors.textFaint} />
              <Text
                style={[styles.linkText, { color: theme.colors.textFaint }]}
              >
                Quitar foto
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Controller
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextInput
            compact
            surface="auth"
            label="Nombre visible"
            placeholder="Como quieres que te llamemos"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
    </View>
  );
}

function StepIdentity({
  form,
  bioLength,
}: {
  form: FormShape;
  bioLength: number;
}) {
  const theme = useTheme();
  const counterNearLimit = bioLength > BIO_LIMIT * 0.85;

  return (
    <View style={styles.stepContent}>
      <Controller
        control={form.control}
        name="username"
        render={({ field, fieldState }) => (
          <TextInput
            compact
            surface="auth"
            label="Username"
            autoCapitalize="none"
            icon={
              <Text
                style={[
                  styles.usernamePrefix,
                  { color: theme.colors.secondary },
                ]}
              >
                @
              </Text>
            }
            value={field.value}
            onChangeText={(text) => field.onChange(normalizeUsername(text))}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            placeholder="tu_nombre"
          />
        )}
      />
      <View style={styles.bioBlock}>
        <Controller
          control={form.control}
          name="bio"
          render={({ field, fieldState }) => (
            <TextInput
              compact
              surface="auth"
              label="Bio (opcional)"
              multiline
              maxLength={BIO_LIMIT}
              value={field.value}
              onChangeText={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              placeholder="Cuenta que te mueve por aqui."
              style={styles.bioInput}
            />
          )}
        />
        <Text
          style={[
            styles.bioCounter,
            {
              color: counterNearLimit
                ? theme.colors.warning
                : theme.colors.textFaint,
            },
          ]}
        >
          {bioLength}/{BIO_LIMIT}
        </Text>
      </View>
    </View>
  );
}

function StepInterests({
  interests,
  selectedIds,
  onToggle,
  errorMessage,
  reduceMotion,
  loading,
}: {
  interests: Interest[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  errorMessage: string | undefined;
  reduceMotion: boolean;
  loading: boolean;
}) {
  const theme = useTheme();

  const grid = useMemo(
    () =>
      interests.map((interest) => ({
        interest,
        emoji: getInterestEmoji(interest.icon),
      })),
    [interests],
  );

  if (loading && interests.length === 0) {
    return (
      <View style={[styles.stepContent, styles.interestsLoading]}>
        <Text style={[styles.interestCount, { color: theme.colors.textFaint }]}>
          Cargando categorias...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.stepContent}>
      <View style={styles.interestGrid}>
        {grid.map(({ interest, emoji }) => {
          const selected = selectedIds.includes(interest.id);

          return (
            <InterestCard
              key={interest.id}
              name={interest.name}
              emoji={emoji}
              selected={selected}
              onPress={() => onToggle(interest.id)}
              reduceMotion={reduceMotion}
              primaryColor={theme.colors.primary}
              secondaryColor={theme.colors.secondary}
              textColor={theme.colors.text}
            />
          );
        })}
      </View>
      <View style={styles.interestFooterRow}>
        <Text style={[styles.interestCount, { color: theme.colors.textFaint }]}>
          {selectedIds.length === 0
            ? "Aun no has elegido nada"
            : `${selectedIds.length} ${selectedIds.length === 1 ? "seleccionada" : "seleccionadas"}`}
        </Text>
        {errorMessage && selectedIds.length === 0 ? (
          <Text style={[styles.error, { color: theme.colors.error }]}>
            {errorMessage}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function InterestCard({
  name,
  emoji,
  selected,
  onPress,
  reduceMotion,
  primaryColor,
  secondaryColor,
  textColor,
}: {
  name: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
  reduceMotion: boolean;
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
}) {
  const scale = useRef(new Animated.Value(selected ? 1 : 0.98)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }

    Animated.spring(scale, {
      toValue: selected ? 1.04 : 1,
      tension: 220,
      friction: 14,
      useNativeDriver: true,
    }).start();
  }, [reduceMotion, scale, selected]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`Interes ${name}${selected ? " seleccionado" : ""}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.interestCardWrap,
        { opacity: pressed ? 0.88 : 1 },
      ]}
    >
      <Animated.View
        style={[
          styles.interestCard,
          {
            transform: [{ scale }],
            borderColor: selected ? secondaryColor : "rgba(255,255,255,0.1)",
            backgroundColor: selected
              ? "rgba(123,92,255,0.18)"
              : "rgba(255,255,255,0.04)",
            shadowColor: selected ? primaryColor : "transparent",
            shadowOpacity: selected ? 0.35 : 0,
          },
        ]}
      >
        <Text style={styles.interestEmoji}>{emoji}</Text>
        <Text
          style={[
            styles.interestLabel,
            { color: selected ? "#FFFFFF" : textColor },
          ]}
        >
          {name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  eyebrow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  eyebrowText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.tiny,
    fontWeight: "600",
    letterSpacing: 0.4,
  },
  headerTitle: {
    fontFamily: fontFamilies.interBold,
    fontSize: typography.h1,
    lineHeight: 28,
    fontWeight: "700",
  },
  subtitle: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    lineHeight: 20,
    fontWeight: "500",
  },
  progressWrap: {
    gap: 7,
    alignItems: "flex-start",
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  progressText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.tiny,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  stepBody: {
    minHeight: 270,
  },
  stepContent: {
    gap: 14,
  },
  avatarBlock: {
    alignItems: "center",
    gap: 10,
  },
  avatarPicker: {
    width: 132,
    height: 132,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarRing: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 63,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#090A1F",
  },
  avatarBadge: {
    position: "absolute",
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#090A1F",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarHelper: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "500",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  usernamePrefix: {
    fontFamily: fontFamilies.interBold,
    fontSize: typography.h3,
    fontWeight: "800",
  },
  bioBlock: {
    gap: 4,
  },
  bioInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  bioCounter: {
    alignSelf: "flex-end",
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.tiny,
    fontWeight: "600",
  },
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  interestCardWrap: {
    width: "31.5%",
    minHeight: 96,
  },
  interestCard: {
    width: "100%",
    minHeight: 92,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    overflow: "hidden",
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  interestEmoji: {
    fontSize: 28,
  },
  interestLabel: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    fontWeight: "700",
    textAlign: "center",
  },
  interestFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  interestCount: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "600",
  },
  interestsLoading: {
    minHeight: 230,
    alignItems: "center",
    justifyContent: "center",
  },
  error: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "500",
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 4,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 1,
  },
});
