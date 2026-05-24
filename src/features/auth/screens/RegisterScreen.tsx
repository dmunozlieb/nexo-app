import { useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import {
  AtSign,
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
import { useRegisterMutation } from "../hooks/useAuthMutations";

export function RegisterScreen() {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const fitDesktop = width >= 980 && height >= 720;
  const compactForm = fitDesktop && height < 940;
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const usernameRef = useRef<RNTextInput | null>(null);
  const emailRef = useRef<RNTextInput | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const confirmPasswordRef = useRef<RNTextInput | null>(null);
  const register = useRegisterMutation();
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
  const hasValidationErrors = Object.keys(validationErrors).length > 0;
  const passwordError =
    typeof validationErrors.password?.message === "string"
      ? validationErrors.password.message
      : undefined;

  async function handleRegister(input: AuthRegisterInput) {
    try {
      setRegisterError(null);
      await register.mutateAsync(input);
      router.replace("/onboarding");
    } catch (error) {
      setRegisterError(getFriendlyRegisterError(error));
    }
  }

  return (
    <AuthScaffold
      eyebrow="Nueva cuenta"
      title="Crea tu identidad"
      subtitle="Crea tu perfil y despues elige tus intereses para encontrar tus primeras Orbitas."
      storyTitle="Empieza tu viaje orbital"
      storyCopy="Crea tu perfil, descubre comunidades y conecta con personas que comparten tus intereses."
      mobileMascot="inline"
      panelVariant="compact"
    >
      {hasValidationErrors ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.validationNotice,
            {
              backgroundColor: `${theme.colors.error}16`,
              borderColor: `${theme.colors.error}66`,
            },
          ]}
        >
          <Text
            style={[styles.validationNoticeText, { color: theme.colors.text }]}
          >
            Revisa los campos marcados en rojo.
          </Text>
        </View>
      ) : null}
      {!env.demoMode ? <SocialAuthRow /> : null}
      <Controller
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextInput
            compact={compactForm}
            label="Nombre visible"
            accessibilityLabel="Nombre visible"
            placeholder="Luna Vega"
            textContentType="name"
            returnKeyType="next"
            value={field.value}
            onChangeText={(value) => {
              setRegisterError(null);
              field.onChange(value);
            }}
            onBlur={field.onBlur}
            onSubmitEditing={() => usernameRef.current?.focus()}
            blurOnSubmit={false}
            error={fieldState.error?.message}
            showErrorMessage={false}
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
            compact={compactForm}
            label="Username"
            accessibilityLabel="Username"
            placeholder="luna_vega"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            value={field.value}
            onChangeText={(value) => {
              setRegisterError(null);
              field.onChange(value.toLowerCase().replace(/\s+/g, "_"));
            }}
            onBlur={field.onBlur}
            onSubmitEditing={() => emailRef.current?.focus()}
            blurOnSubmit={false}
            error={fieldState.error?.message}
            showErrorMessage={false}
            icon={<AtSign size={18} color={theme.colors.textFaint} />}
          />
        )}
      />
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextInput
            ref={emailRef}
            compact={compactForm}
            label="Email"
            accessibilityLabel="Email"
            placeholder="tu@email.com"
            autoCapitalize="none"
            keyboardType="email-address"
            textContentType="emailAddress"
            autoComplete="email"
            inputMode="email"
            returnKeyType="next"
            value={field.value}
            onChangeText={(value) => {
              setRegisterError(null);
              field.onChange(value);
            }}
            onBlur={field.onBlur}
            onSubmitEditing={() => passwordRef.current?.focus()}
            blurOnSubmit={false}
            error={fieldState.error?.message}
            showErrorMessage={false}
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
            compact={compactForm}
            label="Contrasena"
            accessibilityLabel="Contrasena"
            placeholder="Minimo 8 caracteres"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="next"
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
                  passwordVisible ? "Ocultar contrasena" : "Mostrar contrasena"
                }
                hitSlop={10}
                onPress={() => setPasswordVisible((visible) => !visible)}
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
        compact={compactForm}
        error={passwordError}
      />
      <Controller
        control={form.control}
        name="confirmPassword"
        render={({ field, fieldState }) => (
          <TextInput
            ref={confirmPasswordRef}
            compact={compactForm}
            label="Confirmar contrasena"
            accessibilityLabel="Confirmar contrasena"
            placeholder="Repite tu contrasena"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            value={field.value}
            onChangeText={(value) => {
              setRegisterError(null);
              field.onChange(value);
            }}
            onBlur={field.onBlur}
            onSubmitEditing={form.handleSubmit(handleRegister)}
            error={fieldState.error?.message}
            showErrorMessage={false}
            icon={<ShieldCheck size={18} color={theme.colors.textFaint} />}
          />
        )}
      />
      {registerError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.registerError,
            {
              backgroundColor: `${theme.colors.error}18`,
              borderColor: `${theme.colors.error}70`,
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
      <Button
        title="Crear cuenta"
        size={compactForm ? "md" : "lg"}
        loading={register.isPending}
        disabled={register.isPending}
        gradient={[theme.colors.primary, theme.colors.accent]}
        iconRight={<Rocket size={18} color="#FFFFFF" />}
        style={[
          styles.primaryButton,
          {
            borderColor: "transparent",
            shadowColor: theme.colors.primary,
          },
        ]}
        onPress={form.handleSubmit(handleRegister)}
      />
      <Text style={[styles.login, { color: theme.colors.textMuted }]}>
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
  compact = false,
  error,
}: {
  value: PasswordStrengthValue;
  compact?: boolean;
  error?: string | undefined;
}) {
  const theme = useTheme();
  const activeColor =
    error
      ? theme.colors.error
      : value.score >= 4
        ? theme.colors.success
        : value.score >= 3
          ? theme.colors.secondary
          : value.score >= 2
            ? theme.colors.warning
            : theme.colors.textFaint;

  return (
    <View
      style={[
        styles.strengthBlock,
        compact ? styles.strengthBlockCompact : null,
      ]}
    >
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((index) => (
          <View
            key={index}
            style={[
              styles.strengthBar,
              {
                backgroundColor:
                  value.score > index ? activeColor : "rgba(255,255,255,0.1)",
              },
            ]}
          />
        ))}
      </View>
      <Text
        numberOfLines={compact ? 1 : 2}
        style={[
          styles.strengthText,
          compact ? styles.strengthTextCompact : null,
          { color: error ? theme.colors.error : theme.colors.textFaint },
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
    return { score, label: "Buen inicio, anade mas variedad si puedes." };
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
  login: {
    textAlign: "center",
  },
  link: {
    fontWeight: "800",
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  validationNotice: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 12,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  validationNoticeText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "900",
    textAlign: "center",
  },
  strengthBlock: {
    gap: 6,
    marginTop: -5,
  },
  strengthBlockCompact: {
    gap: 4,
    marginTop: -6,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 5,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  strengthText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "800",
  },
  strengthTextCompact: {
    fontSize: 11,
    lineHeight: 14,
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
    fontWeight: "800",
  },
  primaryButton: {
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
});
