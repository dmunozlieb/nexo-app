import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  AtSign,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Rocket,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { env } from "../../../lib/env";
import { useTheme } from "../../../theme/useTheme";
import {
  authRegisterSchema,
  type AuthRegisterInput,
} from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { AuthScaffold } from "../components/AuthScaffold";
import { SocialAuthRow } from "../components/SocialAuthRow";
import {
  useGoogleLoginMutation,
  useRegisterMutation,
} from "../hooks/useAuthMutations";

const TOTAL_STEPS = 2;

type StepConfig = {
  title: string;
  subtitle: string;
  eyebrow: string;
};

const stepConfig: Record<number, StepConfig> = {
  1: {
    title: "Crea tu cuenta",
    subtitle: "Empieza con tu email y una contrasena segura.",
    eyebrow: "Paso 1 de 2",
  },
  2: {
    title: "Tu identidad",
    subtitle: "Elige como te veran los demas en Nexo.",
    eyebrow: "Paso 2 de 2",
  },
};

export function RegisterScreen() {
  const theme = useTheme();
  const [currentStep, setCurrentStep] = useState(1);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  const emailRef = useRef<RNTextInput | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const confirmPasswordRef = useRef<RNTextInput | null>(null);
  const displayNameRef = useRef<RNTextInput | null>(null);
  const usernameRef = useRef<RNTextInput | null>(null);

  const register = useRegisterMutation();
  const googleLogin = useGoogleLoginMutation();

  const form = useForm<AuthRegisterInput>({
    resolver: zodResolver(authRegisterSchema),
    mode: "onTouched",
    defaultValues: {
      displayName: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const password = form.watch("password");
  const passwordStrength = getPasswordStrength(password);
  const validationErrors = form.formState.errors;

  // Check if step 1 fields are valid
  const step1Fields = ["email", "password", "confirmPassword"] as const;
  const step1HasErrors = step1Fields.some(
    (field) => validationErrors[field]?.message,
  );
  const step1Values = form.watch(["email", "password", "confirmPassword"]);
  const step1Filled = step1Values.every((v) => v && v.length > 0);
  const canProceedToStep2 = step1Filled && !step1HasErrors;

  // Get current step config
  const { title, subtitle, eyebrow } = stepConfig[currentStep];

  async function handleRegister(input: AuthRegisterInput) {
    try {
      setRegisterError(null);
      await register.mutateAsync(input);
      router.replace("/onboarding");
    } catch (error) {
      setRegisterError(getFriendlyRegisterError(error));
    }
  }

  async function handleGoogleLogin() {
    try {
      setRegisterError(null);
      await googleLogin.mutateAsync();
      router.replace("/");
    } catch (error) {
      setRegisterError(getFriendlyRegisterError(error));
    }
  }

  function goToNextStep() {
    if (currentStep < TOTAL_STEPS && canProceedToStep2) {
      setCurrentStep(currentStep + 1);
      setRegisterError(null);
    }
  }

  function goToPreviousStep() {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setRegisterError(null);
    }
  }

  return (
    <AuthScaffold
      eyebrow={eyebrow}
      title={title}
      subtitle={subtitle}
      storyTitle="Empieza tu viaje orbital"
      storyCopy="Crea tu perfil, descubre comunidades y conecta con personas que comparten tus intereses."
      mobileMascot="inline"
      panelVariant="compact"
    >
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressStep,
                {
                  backgroundColor:
                    index < currentStep
                      ? theme.colors.primary
                      : "rgba(255,255,255,0.1)",
                },
              ]}
            />
          ))}
        </View>
      </View>

      {registerError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.registerError,
            {
              backgroundColor: `${theme.colors.error}12`,
              borderColor: `${theme.colors.error}50`,
            },
          ]}
        >
          <Text
            style={[styles.registerErrorText, { color: theme.colors.text }]}
          >
            {registerError}
          </Text>
        </View>
      ) : null}

      {/* Step 1: Email and Password */}
      {currentStep === 1 ? (
        <>
          {!env.demoMode ? (
            <SocialAuthRow
              onProvider={handleGoogleLogin}
              loadingProvider={googleLogin.isPending ? "google" : null}
            />
          ) : null}

          <Controller
            control={form.control}
            name="email"
            render={({ field, fieldState }) => (
              <TextInput
                ref={emailRef}
                label="Email"
                accessibilityLabel="Email"
                placeholder="tu@email.com"
                autoCapitalize="none"
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                inputMode="email"
                returnKeyType="next"
                required
                value={field.value}
                onChangeText={(value) => {
                  setRegisterError(null);
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
                error={fieldState.error?.message}
                success={!fieldState.error && field.value.includes("@")}
                icon={<Mail size={18} color={theme.colors.textFaint} />}
              />
            )}
          />

          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <TextInput
                ref={passwordRef}
                label="Contrasena"
                accessibilityLabel="Contrasena"
                placeholder="Minimo 8 caracteres"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="next"
                required
                value={field.value}
                onChangeText={(value) => {
                  setRegisterError(null);
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                blurOnSubmit={false}
                error={fieldState.error?.message}
                showErrorMessage={false}
                icon={<Lock size={18} color={theme.colors.textFaint} />}
                rightElement={
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={
                      passwordVisible
                        ? "Ocultar contrasena"
                        : "Mostrar contrasena"
                    }
                    hitSlop={12}
                    onPress={() => setPasswordVisible((v) => !v)}
                    style={({ pressed }) => [
                      styles.iconButton,
                      { opacity: pressed ? 0.68 : 1 },
                    ]}
                  >
                    {passwordVisible ? (
                      <Eye size={20} color={theme.colors.textMuted} />
                    ) : (
                      <EyeOff size={20} color={theme.colors.textMuted} />
                    )}
                  </Pressable>
                }
              />
            )}
          />

          <PasswordStrength
            value={passwordStrength}
            error={validationErrors.password?.message}
          />

          <Controller
            control={form.control}
            name="confirmPassword"
            render={({ field, fieldState }) => (
              <TextInput
                ref={confirmPasswordRef}
                label="Confirmar contrasena"
                accessibilityLabel="Confirmar contrasena"
                placeholder="Repite tu contrasena"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="newPassword"
                autoComplete="new-password"
                returnKeyType="done"
                required
                value={field.value}
                onChangeText={(value) => {
                  setRegisterError(null);
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                onSubmitEditing={goToNextStep}
                error={fieldState.error?.message}
                success={
                  !fieldState.error &&
                  field.value.length > 0 &&
                  field.value === password
                }
                icon={<ShieldCheck size={18} color={theme.colors.textFaint} />}
              />
            )}
          />

          <Button
            title="Continuar"
            size="lg"
            disabled={!canProceedToStep2}
            gradient={
              canProceedToStep2
                ? [theme.colors.primary, theme.colors.accent]
                : undefined
            }
            iconRight={<ChevronRight size={18} color="#FFFFFF" />}
            style={[
              styles.primaryButton,
              {
                borderColor: "transparent",
                shadowColor: theme.colors.primary,
                opacity: canProceedToStep2 ? 1 : 0.5,
              },
            ]}
            onPress={goToNextStep}
          />
        </>
      ) : null}

      {/* Step 2: Profile info */}
      {currentStep === 2 ? (
        <>
          <Controller
            control={form.control}
            name="displayName"
            render={({ field, fieldState }) => (
              <TextInput
                ref={displayNameRef}
                label="Nombre visible"
                accessibilityLabel="Nombre visible"
                placeholder="Como quieres que te llamen"
                textContentType="name"
                returnKeyType="next"
                required
                value={field.value}
                onChangeText={(value) => {
                  setRegisterError(null);
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                onSubmitEditing={() => usernameRef.current?.focus()}
                blurOnSubmit={false}
                error={fieldState.error?.message}
                success={!fieldState.error && field.value.length >= 2}
                icon={<UserRound size={18} color={theme.colors.textFaint} />}
              />
            )}
          />

          <Controller
            control={form.control}
            name="username"
            render={({ field, fieldState }) => (
              <TextInput
                ref={usernameRef}
                label="Username"
                accessibilityLabel="Username"
                placeholder="tu_nombre_unico"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                required
                value={field.value}
                onChangeText={(value) => {
                  setRegisterError(null);
                  field.onChange(value.toLowerCase().replace(/\s+/g, "_"));
                }}
                onBlur={field.onBlur}
                onSubmitEditing={form.handleSubmit(handleRegister)}
                error={fieldState.error?.message}
                success={!fieldState.error && field.value.length >= 3}
                icon={<AtSign size={18} color={theme.colors.textFaint} />}
              />
            )}
          />

          <Text
            style={[
              styles.usernameHint,
              { color: theme.colors.textSecondary ?? theme.colors.textMuted },
            ]}
          >
            Tu username sera tu identificador unico en Nexo. Solo letras,
            numeros y guiones bajos.
          </Text>

          <View style={styles.buttonRow}>
            <Button
              title="Atras"
              size="lg"
              variant="secondary"
              iconLeft={<ChevronLeft size={18} color={theme.colors.text} />}
              style={[styles.backButton, { borderColor: theme.colors.border }]}
              onPress={goToPreviousStep}
            />
            <Button
              title="Crear cuenta"
              size="lg"
              loading={register.isPending}
              disabled={register.isPending || googleLogin.isPending}
              gradient={[theme.colors.primary, theme.colors.accent]}
              iconRight={<Rocket size={18} color="#FFFFFF" />}
              style={[
                styles.primaryButton,
                styles.submitButton,
                {
                  borderColor: "transparent",
                  shadowColor: theme.colors.primary,
                },
              ]}
              onPress={form.handleSubmit(handleRegister)}
            />
          </View>
        </>
      ) : null}

      <Text
        style={[
          styles.login,
          { color: theme.colors.textSecondary ?? theme.colors.textMuted },
        ]}
      >
        Ya tienes cuenta?{" "}
        <Link
          href="/login"
          style={[styles.link, { color: theme.colors.secondary }]}
        >
          Entrar
        </Link>
      </Text>
    </AuthScaffold>
  );
}

function PasswordStrength({
  value,
  error,
}: {
  value: PasswordStrengthValue;
  error?: string | undefined;
}) {
  const theme = useTheme();
  const activeColor = error
    ? theme.colors.error
    : value.score >= 4
      ? theme.colors.success
      : value.score >= 3
        ? theme.colors.secondary
        : value.score >= 2
          ? theme.colors.warning
          : theme.colors.textFaint;

  return (
    <View style={styles.strengthBlock}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              {
                backgroundColor:
                  value.score > index ? activeColor : "rgba(255,255,255,0.08)",
              },
            ]}
          />
        ))}
      </View>
      <Text
        numberOfLines={2}
        style={[
          styles.strengthText,
          {
            color: error
              ? theme.colors.error
              : theme.colors.textSecondary ?? theme.colors.textMuted,
          },
        ]}
      >
        {error ?? value.label}
      </Text>
    </View>
  );
}

type PasswordStrengthValue = {
  score: number;
  label: string;
};

function getPasswordStrength(password: string): PasswordStrengthValue {
  if (!password) {
    return { score: 0, label: "Usa mayusculas, minusculas y numeros." };
  }

  const score = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[a-z]/.test(password),
    /[0-9]/.test(password),
  ].filter(Boolean).length;

  if (score >= 4) {
    return { score, label: "Contrasena fuerte." };
  }

  if (score >= 3) {
    return { score, label: "Buen inicio, anade mas variedad." };
  }

  return { score, label: "Contrasena debil: combina letras y numeros." };
}

function getFriendlyRegisterError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (message.includes("already") || message.includes("registered")) {
    return "Ese email ya tiene una cuenta. Prueba a iniciar sesion.";
  }

  if (message.includes("username") || message.includes("duplicate")) {
    return "Ese username ya esta en uso. Prueba con otra senal.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "No pudimos conectar con Nexo. Comprueba tu conexion e intenta otra vez.";
  }

  return "No se pudo crear la cuenta. Revisa los datos e intentalo de nuevo.";
}

const styles = StyleSheet.create({
  progressContainer: {
    paddingHorizontal: 4,
  },
  progressBar: {
    flexDirection: "row",
    gap: 6,
  },
  progressStep: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  login: {
    textAlign: "center",
    fontSize: 14,
  },
  link: {
    fontWeight: "800",
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  strengthBlock: {
    gap: 6,
    marginTop: -4,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 5,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  strengthText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
  },
  registerError: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  registerErrorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
  },
  usernameHint: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: -4,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  backButton: {
    flex: 0,
    minWidth: 100,
    borderWidth: 1,
  },
  primaryButton: {
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  submitButton: {
    flex: 1,
  },
});
