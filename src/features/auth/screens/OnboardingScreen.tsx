import { useEffect, useMemo, useRef, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
  type DimensionValue,
} from "react-native";
import { router } from "expo-router";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Sparkles,
  Trash2,
} from "lucide-react-native";
import { NexoMascot } from "../../../components/brand/NexoMascot";
import { Avatar } from "../../../components/ui/Avatar";
import { Button } from "../../../components/ui/Button";
import { LoadingState } from "../../../components/ui/LoadingState";
import { TextInput } from "../../../components/ui/TextInput";
import { ScreenContainer } from "../../../components/layout/ScreenContainer";
import { env } from "../../../lib/env";
import {
  pickImage,
  uploadBase64Image,
} from "../../../services/storage-service";
import { radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import type { Interest } from "../../../types/domain";
import {
  onboardingSchema,
  type OnboardingInput,
} from "../../../utils/validation";
import { useAuth } from "../hooks/useAuth";
import { completeOnboarding, listInterests } from "../services/auth-service";

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
  {
    eyebrow: string;
    title: string;
    subtitle: string;
    label: string;
  }
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

const STARS: { top: DimensionValue; left: DimensionValue; size: number }[] = [
  { top: "4%", left: "8%", size: 1 },
  { top: "6%", left: "12%", size: 2 },
  { top: "7%", left: "52%", size: 1 },
  { top: "9%", left: "29%", size: 1 },
  { top: "11%", left: "78%", size: 1 },
  { top: "13%", left: "94%", size: 2 },
  { top: "16%", left: "61%", size: 1 },
  { top: "18%", left: "44%", size: 1 },
  { top: "21%", left: "17%", size: 1 },
  { top: "24%", left: "8%", size: 2 },
  { top: "26%", left: "73%", size: 1 },
  { top: "29%", left: "66%", size: 1 },
  { top: "32%", left: "36%", size: 1 },
  { top: "35%", left: "92%", size: 1 },
  { top: "38%", left: "11%", size: 1 },
  { top: "42%", left: "22%", size: 1 },
  { top: "44%", left: "58%", size: 1 },
  { top: "47%", left: "78%", size: 1 },
  { top: "48%", left: "84%", size: 2 },
  { top: "51%", left: "33%", size: 1 },
  { top: "54%", left: "5%", size: 1 },
  { top: "57%", left: "67%", size: 1 },
  { top: "61%", left: "38%", size: 1 },
  { top: "64%", left: "92%", size: 1 },
  { top: "67%", left: "72%", size: 2 },
  { top: "69%", left: "27%", size: 1 },
  { top: "73%", left: "16%", size: 1 },
  { top: "75%", left: "82%", size: 1 },
  { top: "78%", left: "58%", size: 1 },
  { top: "81%", left: "44%", size: 1 },
  { top: "84%", left: "88%", size: 2 },
  { top: "86%", left: "12%", size: 1 },
  { top: "89%", left: "32%", size: 1 },
  { top: "91%", left: "62%", size: 1 },
  { top: "93%", left: "70%", size: 1 },
  { top: "96%", left: "20%", size: 1 },
];

function getInterestEmoji(icon: string | null | undefined) {
  if (!icon) {
    return "✨";
  }

  return INTEREST_EMOJI[icon] ?? "✨";
}

function useReduceMotion() {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotion(enabled);
      }
    });

    const subscription = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduceMotion,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduceMotion;
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
    try {
      const valid = await form.trigger();

      if (!valid) {
        return;
      }

      if (env.demoMode) {
        await handleDemoContinue();
        return;
      }

      if (!auth.session?.user.id) {
        router.replace("/login");
        return;
      }

      setSaving(true);
      await completeOnboarding(auth.session.user.id, form.getValues());
      await auth.refreshProfile();
      router.replace("/home");
    } catch (error) {
      console.warn("onboarding submit failed", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function handleDemoContinue() {
    const values = form.getValues();
    const fallbackInterest = interests.data?.[0]?.id;
    const fallbackUsername =
      typeof auth.session?.user.user_metadata?.username === "string"
        ? auth.session.user.user_metadata.username
            .toLowerCase()
            .replace(/\s+/g, "_")
        : "demo_user";
    const demoInput: OnboardingInput = {
      displayName:
        values.displayName?.trim() ||
        auth.profile?.display_name ||
        "Explorador Nexo",
      username:
        values.username?.trim().toLowerCase().replace(/\s+/g, "_") ||
        (auth.profile?.username && !auth.profile.username.startsWith("nexo_")
          ? auth.profile.username
          : fallbackUsername),
      bio: values.bio?.trim() || "Preparando mi primera Orbita.",
      interestIds: values.interestIds.length
        ? values.interestIds
        : fallbackInterest
          ? [fallbackInterest]
          : [],
      avatarUrl: values.avatarUrl ?? auth.profile?.avatar_url ?? null,
    };

    try {
      setSaving(true);
      if (auth.session?.user.id) {
        await completeOnboarding(auth.session.user.id, demoInput);
        await auth.refreshProfile();
      }
      router.replace("/home");
    } catch (error) {
      console.warn("demo onboarding failed", getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  if (interests.isLoading) {
    return <LoadingState label="Preparando intereses..." />;
  }

  return (
    <ScreenContainer scroll contentStyle={styles.screen}>
      <OnboardingBackdrop reduceMotion={reduceMotion} />

      <View pointerEvents="box-none" style={styles.cardWrap}>
        <View
          style={[
            styles.cardShell,
            { borderColor: theme.colors.border },
          ]}
        >
          <BlurView
            intensity={50}
            tint="dark"
            blurMethod="dimezisBlurViewSdk31Plus"
            style={[
              styles.card,
              { backgroundColor: "rgba(9,12,28,0.78)" },
            ]}
          >
            <View style={styles.headerRow}>
              <NexoMascot size={64} animated={!reduceMotion} />
              <View style={styles.headerCopy}>
                <View style={styles.eyebrow}>
                  <Sparkles size={13} color={theme.colors.secondary} />
                  <Text
                    style={[
                      styles.eyebrowText,
                      { color: theme.colors.secondary },
                    ]}
                  >
                    {meta.eyebrow}
                  </Text>
                </View>
                <Text style={[styles.title, { color: theme.colors.text }]}>
                  {meta.title}
                </Text>
              </View>
            </View>

            <ProgressIndicator
              total={STEPS.length}
              currentIndex={stepIndex}
              currentLabel={meta.label}
              primaryColor={theme.colors.primary}
              idleColor={theme.colors.border}
              textColor={theme.colors.textMuted}
            />

            <Text style={[styles.subtitle, { color: theme.colors.textMuted }]}>
              {meta.subtitle}
            </Text>

            <Animated.View
              style={[styles.stepBody, { opacity: stepOpacity }]}
            >
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
                />
              ) : null}
            </Animated.View>

            <View style={styles.footer}>
              {!isFirst ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Paso anterior"
                  onPress={handleBack}
                  style={({ pressed }) => [
                    styles.backButton,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: "rgba(255,255,255,0.04)",
                      opacity: pressed ? 0.78 : 1,
                    },
                  ]}
                >
                  <ArrowLeft size={18} color={theme.colors.text} />
                </Pressable>
              ) : null}
              <Button
                title={isLast ? "Aterrizar en Nexo" : "Siguiente"}
                size="lg"
                loading={saving}
                disabled={!canSubmit}
                icon={
                  isLast ? null : (
                    <ArrowRight size={18} color="#FFFFFF" />
                  )
                }
                onPress={handleNext}
                style={styles.nextButton}
              />
            </View>
          </BlurView>
        </View>
      </View>
    </ScreenContainer>
  );
}

function OnboardingBackdrop({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
    >
      <LinearGradient
        colors={["#03050F", "#070B1F", "#0B0E2A", "#070B1F", "#03050F"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {STARS.map((star, index) => (
        <TwinkleStar
          key={`${star.top}-${star.left}`}
          star={star}
          index={index}
          reduceMotion={reduceMotion}
        />
      ))}
      <LinearGradient
        colors={["rgba(3,5,15,0.7)", "rgba(3,5,15,0)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.4 }}
        style={backdropStyles.vignetteTop}
      />
      <LinearGradient
        colors={["rgba(3,5,15,0)", "rgba(3,5,15,0.78)"]}
        start={{ x: 0.5, y: 0.6 }}
        end={{ x: 0.5, y: 1 }}
        style={backdropStyles.vignetteBottom}
      />
    </View>
  );
}

function TwinkleStar({
  star,
  index,
  reduceMotion,
}: {
  star: { top: DimensionValue; left: DimensionValue; size: number };
  index: number;
  reduceMotion: boolean;
}) {
  const twinkle = useRef(new Animated.Value(0.5 + (index % 4) * 0.12)).current;

  useEffect(() => {
    if (reduceMotion) {
      twinkle.stopAnimation();
      twinkle.setValue(0.8);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(twinkle, {
          toValue: 1,
          duration: 1800 + (index % 6) * 280,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0.35,
          duration: 2200 + (index % 5) * 320,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    const startDelay = setTimeout(() => animation.start(), index * 90);

    return () => {
      clearTimeout(startDelay);
      animation.stop();
    };
  }, [index, reduceMotion, twinkle]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        backdropStyles.star,
        {
          top: star.top,
          left: star.left,
          width: star.size,
          height: star.size,
          borderRadius: star.size / 2,
          opacity: twinkle,
          transform: [
            {
              scale: twinkle.interpolate({
                inputRange: [0.35, 1],
                outputRange: [0.8, 1.4],
              }),
            },
          ],
        },
      ]}
    />
  );
}

function ProgressIndicator({
  total,
  currentIndex,
  currentLabel,
  primaryColor,
  idleColor,
  textColor,
}: {
  total: number;
  currentIndex: number;
  currentLabel: string;
  primaryColor: string;
  idleColor: string;
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
                  backgroundColor: filled ? primaryColor : idleColor,
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
            colors={[theme.colors.primary, theme.colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatarRing}
          >
            <View
              style={[
                styles.avatarInner,
                { backgroundColor: theme.colors.background },
              ]}
            >
              <Avatar
                uri={avatarUrl}
                label={displayName ?? "Nexo"}
                size={120}
              />
            </View>
          </LinearGradient>
          <View
            style={[
              styles.avatarBadge,
              {
                backgroundColor: theme.colors.primary,
                borderColor: theme.colors.background,
              },
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
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Saltar foto por ahora"
              onPress={onSkipAvatar}
              style={({ pressed }) => [
                styles.linkButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text
                style={[styles.linkText, { color: theme.colors.textFaint }]}
              >
                Saltar por ahora
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      <Controller
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextInput
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
            onChangeText={(text) =>
              field.onChange(text.toLowerCase().replace(/\s+/g, "_"))
            }
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
}: {
  interests: Interest[];
  selectedIds: string[];
  onToggle: (id: string) => void;
  errorMessage: string | undefined;
  reduceMotion: boolean;
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
              borderColor={theme.colors.border}
              surfaceColor={theme.colors.surface}
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
  borderColor,
  surfaceColor,
  textColor,
}: {
  name: string;
  emoji: string;
  selected: boolean;
  onPress: () => void;
  reduceMotion: boolean;
  primaryColor: string;
  secondaryColor: string;
  borderColor: string;
  surfaceColor: string;
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
            borderColor: selected ? secondaryColor : borderColor,
            backgroundColor: selected
              ? "rgba(123,92,255,0.16)"
              : surfaceColor,
            shadowColor: selected ? primaryColor : "transparent",
            shadowOpacity: selected ? 0.3 : 0,
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
  screen: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 12,
  },
  cardWrap: {
    width: "100%",
    maxWidth: 540,
    alignItems: "center",
    justifyContent: "center",
  },
  cardShell: {
    width: "100%",
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000000",
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  card: {
    width: "100%",
    padding: 26,
    gap: 18,
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
    fontSize: typography.tiny,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  title: {
    fontSize: typography.h1,
    fontWeight: "900",
    lineHeight: 28,
  },
  subtitle: {
    fontSize: typography.body,
    lineHeight: 22,
  },
  progressWrap: {
    gap: 6,
  },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  stepBody: {
    minHeight: 280,
  },
  stepContent: {
    gap: 16,
  },
  avatarBlock: {
    alignItems: "center",
    gap: 10,
  },
  avatarPicker: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  avatarRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: "center",
    justifyContent: "center",
    padding: 3,
  },
  avatarInner: {
    width: "100%",
    height: "100%",
    borderRadius: 67,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarBadge: {
    position: "absolute",
    right: 6,
    bottom: 6,
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarHelper: {
    fontSize: typography.small,
    fontWeight: "600",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  linkText: {
    fontSize: typography.small,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  usernamePrefix: {
    fontSize: typography.h3,
    fontWeight: "800",
  },
  bioBlock: {
    gap: 4,
  },
  bioInput: {
    minHeight: 96,
    textAlignVertical: "top",
  },
  bioCounter: {
    alignSelf: "flex-end",
    fontSize: typography.tiny,
    fontWeight: "700",
  },
  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    justifyContent: "space-between",
  },
  interestCardWrap: {
    width: "31.5%",
    minHeight: 100,
  },
  interestCard: {
    width: "100%",
    minHeight: 96,
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
    fontSize: 30,
  },
  interestLabel: {
    fontSize: typography.small,
    fontWeight: "800",
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
    fontSize: typography.small,
    fontWeight: "700",
  },
  error: {
    fontSize: typography.small,
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
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  nextButton: {
    flex: 1,
  },
});

const backdropStyles = StyleSheet.create({
  star: {
    position: "absolute",
    backgroundColor: "#FFFFFF",
    shadowColor: "#B18CFF",
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  vignetteTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "26%",
  },
  vignetteBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "34%",
  },
});
