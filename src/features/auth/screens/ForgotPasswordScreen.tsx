import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  ArrowRight,
  Mail,
  Orbit,
  Radio,
  ShieldCheck,
  Sparkles,
} from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { fontFamilies, radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "../../../utils/validation";
import { AuthCosmicScaffold } from "../components/AuthCosmicScaffold";
import { useResetPasswordMutation } from "../hooks/useAuthMutations";

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [resetError, setResetError] = useState<string | null>(null);
  const resetPassword = useResetPasswordMutation();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
    },
  });
  const email = form.watch("email");
  const validationErrors = form.formState.errors;
  const touched = form.formState.touchedFields;
  const emailSuccess = Boolean(
    touched.email &&
    email.trim() &&
    !validationErrors.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
  );
  const visualSignals = [
    {
      label: "Ecos",
      hint: "esperandote",
      color: theme.colors.primary,
      icon: <Sparkles size={12} color={theme.colors.primary} />,
    },
    {
      label: "Orbitas",
      hint: "vivas",
      color: theme.colors.secondary,
      icon: <Orbit size={12} color={theme.colors.secondary} />,
    },
    {
      label: "Senales",
      hint: "nuevas",
      color: theme.colors.accent,
      icon: <Radio size={12} color={theme.colors.accent} />,
    },
  ];

  async function handleReset(input: ResetPasswordInput) {
    try {
      setResetError(null);
      await resetPassword.mutateAsync(input);
      setSubmitted(input.email);
    } catch (error) {
      setResetError(getFriendlyResetError(error));
    }
  }

  if (submitted) {
    return (
      <AuthCosmicScaffold
        title="Revisa tu email"
        subtitle="Te enviamos una senal segura para volver a entrar."
        storyBadge="Tu galaxia te espera"
        storyTitle="Tus Orbitas siguen girando"
        storyCopy="Retoma conversaciones, descubre senales nuevas y reconecta con tus comunidades justo donde lo dejaste."
        showTabletMascot
        visualSignals={visualSignals}
      >
        <View style={styles.form}>
          <View
            accessibilityRole="alert"
            style={[
              styles.successBlock,
              {
                backgroundColor: `${theme.colors.success}14`,
                borderColor: `${theme.colors.success}45`,
              },
            ]}
          >
            <ShieldCheck size={20} color={theme.colors.success} />
            <Text style={[styles.successText, { color: theme.colors.text }]}>
              Hemos enviado instrucciones a {submitted}. Si no aparecen pronto,
              revisa spam o promociones.
            </Text>
          </View>

          <Button
            title="Volver al login"
            size="lg"
            gradient={["#8B5CF6", "#22D3EE"]}
            iconRight={<ArrowRight size={18} color="#FFFFFF" />}
            style={[
              styles.primaryButton,
              {
                borderColor: "transparent",
                shadowColor: theme.colors.primary,
              },
            ]}
            textStyle={styles.primaryButtonText}
            onPress={() => router.replace("/login")}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reenviar enlace"
            onPress={() => {
              setSubmitted(null);
              form.reset({ email: submitted });
            }}
            style={({ pressed }) => [
              styles.secondaryLink,
              { opacity: pressed ? 0.62 : 1 },
            ]}
          >
            <Text
              style={[
                styles.secondaryLinkText,
                { color: theme.colors.textMuted },
              ]}
            >
              No te llego?{" "}
              <Text
                style={{
                  color: theme.colors.accent,
                  fontFamily: fontFamilies.interSemiBold,
                  fontWeight: "600",
                }}
              >
                Reenviar enlace
              </Text>
            </Text>
          </Pressable>
        </View>
      </AuthCosmicScaffold>
    );
  }

  return (
    <AuthCosmicScaffold
      title="Recupera tu orbita"
      subtitle="Escribe tu email y te enviamos un enlace para volver a entrar."
      storyBadge="Tu galaxia te espera"
      storyTitle="Tus Orbitas siguen girando"
      storyCopy="Retoma conversaciones, descubre senales nuevas y reconecta con tus comunidades justo donde lo dejaste."
      showTabletMascot
      visualSignals={visualSignals}
    >
      <View style={styles.form}>
        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <TextInput
              compact
              surface="auth"
              label="Email"
              accessibilityLabel="Email"
              placeholder="tu@email.com"
              autoCapitalize="none"
              keyboardType="email-address"
              textContentType="emailAddress"
              autoComplete="email"
              inputMode="email"
              returnKeyType="send"
              value={field.value}
              onChangeText={(value) => {
                setResetError(null);
                field.onChange(value);
              }}
              onBlur={field.onBlur}
              onSubmitEditing={form.handleSubmit(handleReset)}
              error={fieldState.error?.message}
              success={emailSuccess}
              icon={<Mail size={17} color={theme.colors.textFaint} />}
            />
          )}
        />

        {resetError ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.errorBlock,
              {
                backgroundColor: `${theme.colors.error}18`,
                borderColor: `${theme.colors.error}70`,
              },
            ]}
          >
            <Text style={[styles.errorText, { color: theme.colors.text }]}>
              {resetError}
            </Text>
          </View>
        ) : null}

        <Button
          title="Enviar enlace"
          size="lg"
          loading={resetPassword.isPending}
          disabled={resetPassword.isPending}
          gradient={["#8B5CF6", "#22D3EE"]}
          iconRight={<ArrowRight size={18} color="#FFFFFF" />}
          style={[
            styles.primaryButton,
            {
              borderColor: "transparent",
              shadowColor: theme.colors.primary,
            },
          ]}
          textStyle={styles.primaryButtonText}
          onPress={form.handleSubmit(handleReset)}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver al login"
          onPress={() => router.replace("/login")}
          style={({ pressed }) => [
            styles.backLink,
            { opacity: pressed ? 0.62 : 1 },
          ]}
        >
          <ArrowLeft size={14} color={theme.colors.textMuted} />
          <Text style={[styles.backText, { color: theme.colors.textMuted }]}>
            Volver al login
          </Text>
        </Pressable>
      </View>
    </AuthCosmicScaffold>
  );
}

function getFriendlyResetError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("rate limit")) {
    return "Demasiados emails seguidos. Espera un poco y vuelve a intentarlo.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "No pudimos conectar con Nexo. Comprueba tu conexion e intenta otra vez.";
  }

  return "No pudimos enviar el enlace. Revisa el email e intentalo de nuevo.";
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  primaryButton: {
    marginTop: 3,
    minHeight: 48,
    borderRadius: radius.lg,
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  errorBlock: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "600",
  },
  successBlock: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
  },
  successText: {
    flex: 1,
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    lineHeight: 19,
    fontWeight: "500",
  },
  primaryButtonText: {
    fontFamily: fontFamilies.interSemiBold,
    fontWeight: "600",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 6,
    paddingVertical: 7,
  },
  backText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    fontWeight: "600",
  },
  secondaryLink: {
    alignItems: "center",
    paddingVertical: 7,
  },
  secondaryLinkText: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "500",
    textAlign: "center",
  },
});
