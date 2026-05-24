import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  ArrowLeft,
  Clock,
  Inbox,
  Mail,
  Send,
  ShieldCheck,
} from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { useTheme } from "../../../theme/useTheme";
import { radius, typography } from "../../../theme/tokens";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { AuthScaffold } from "../components/AuthScaffold";
import { useResetPasswordMutation } from "../hooks/useAuthMutations";

const tips = [
  {
    Icon: Send,
    label: "Enlace de un solo uso",
    tone: "secondary" as const,
  },
  {
    Icon: Clock,
    label: "Caduca en 30 minutos",
    tone: "accent" as const,
  },
  {
    Icon: Inbox,
    label: "Revisa tu spam si tarda",
    tone: "success" as const,
  },
];

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const [submitted, setSubmitted] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resetPassword = useResetPasswordMutation();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
    },
  });

  async function handleReset(input: ResetPasswordInput) {
    try {
      setError(null);
      await resetPassword.mutateAsync(input);
      setSubmitted(input.email);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  if (submitted) {
    return (
      <AuthScaffold
        eyebrow="Enlace enviado"
        title="Revisa tu email"
        subtitle={`Hemos mandado instrucciones a ${submitted}. Si no aparecen en un minuto, mira en spam.`}
        storyTitle="Recupera tu orbita"
        storyCopy="Cuando vuelvas a entrar, tus Orbitas, chats y ecos seguiran esperandote."
        panelVariant="compact"
      >
        <View
          style={[
            styles.successBlock,
            {
              backgroundColor: `${theme.colors.success}14`,
              borderColor: `${theme.colors.success}3D`,
            },
          ]}
        >
          <ShieldCheck size={20} color={theme.colors.success} />
          <Text style={[styles.successText, { color: theme.colors.text }]}>
            Enlace seguro enviado. Sigue las instrucciones para crear una
            contrasena nueva.
          </Text>
        </View>
        <Button
          title="Volver al acceso"
          size="lg"
          gradient={[theme.colors.primary, theme.colors.accent]}
          iconRight={<ArrowLeft size={18} color="#FFFFFF" />}
          style={{ shadowColor: theme.colors.primary, borderColor: "transparent" }}
          onPress={() => router.replace("/login")}
        />
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            setSubmitted(null);
            form.reset({ email: submitted });
          }}
          style={({ pressed }) => [
            styles.resendLink,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text style={[styles.resendText, { color: theme.colors.textMuted }]}>
            No te llego?{" "}
            <Text style={{ color: theme.colors.accent, fontWeight: "900" }}>
              Reenviar enlace
            </Text>
          </Text>
        </Pressable>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold
      eyebrow="Restablecer acceso"
      title="Recupera tu acceso"
      subtitle="Te enviaremos un enlace seguro para restablecer tu contrasena."
      storyTitle="Recupera tu orbita"
      storyCopy="Cuando vuelvas a entrar, tus Orbitas, chats y ecos seguiran esperandote."
      panelVariant="compact"
    >
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextInput
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
              setError(null);
              field.onChange(value);
            }}
            onBlur={field.onBlur}
            onSubmitEditing={form.handleSubmit(handleReset)}
            error={fieldState.error?.message}
            icon={<Mail size={18} color={theme.colors.textFaint} />}
          />
        )}
      />

      <View
        style={[
          styles.tipsBlock,
          {
            backgroundColor: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.08)",
          },
        ]}
      >
        {tips.map((tip) => {
          const tint =
            tip.tone === "secondary"
              ? theme.colors.secondary
              : tip.tone === "accent"
                ? theme.colors.accent
                : theme.colors.success;
          return (
            <View key={tip.label} style={styles.tipRow}>
              <View
                style={[
                  styles.tipIcon,
                  {
                    backgroundColor: `${tint}1C`,
                    borderColor: `${tint}55`,
                  },
                ]}
              >
                <tip.Icon size={14} color={tint} />
              </View>
              <Text style={[styles.tipText, { color: theme.colors.textMuted }]}>
                {tip.label}
              </Text>
            </View>
          );
        })}
      </View>

      {error ? (
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
            {error}
          </Text>
        </View>
      ) : null}

      <Button
        title="Enviar enlace"
        size="lg"
        loading={resetPassword.isPending}
        disabled={resetPassword.isPending}
        gradient={[theme.colors.primary, theme.colors.accent]}
        iconRight={<Send size={16} color="#FFFFFF" />}
        style={{ shadowColor: theme.colors.primary, borderColor: "transparent" }}
        onPress={form.handleSubmit(handleReset)}
      />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver al inicio de sesion"
        onPress={() => router.back()}
        style={({ pressed }) => [
          styles.backLink,
          { opacity: pressed ? 0.6 : 1 },
        ]}
      >
        <ArrowLeft size={14} color={theme.colors.textMuted} />
        <Text style={[styles.backText, { color: theme.colors.textMuted }]}>
          Volver al acceso
        </Text>
      </Pressable>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  tipsBlock: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: 12,
    gap: 9,
  },
  tipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  tipIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tipText: {
    flex: 1,
    fontSize: typography.small,
    fontWeight: "700",
  },
  errorBlock: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
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
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  backLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
  },
  backText: {
    fontSize: typography.small,
    fontWeight: "800",
  },
  resendLink: {
    paddingVertical: 6,
    alignItems: "center",
  },
  resendText: {
    fontSize: typography.small,
    fontWeight: "700",
  },
});
