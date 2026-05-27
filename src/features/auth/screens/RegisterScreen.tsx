import { useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  View,
} from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Lock, Mail } from "lucide-react-native";
import { TextInput } from "../../../components/ui/TextInput";
import { env } from "../../../lib/env";
import { fontFamilies, radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import {
  authRegisterSchema,
  type AuthRegisterInput,
} from "../../../utils/validation";
import { AuthCosmicScaffold } from "../components/AuthCosmicScaffold";
import { SocialAuthRow } from "../components/SocialAuthRow";
import {
  useGoogleLoginMutation,
  useRegisterMutation,
} from "../hooks/useAuthMutations";
import {
  AuthErrorAlert,
  AuthSubmitButton,
  PasswordRevealButton,
  getFriendlyRegisterError,
} from "../shared";

export function RegisterScreen() {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const confirmPasswordRef = useRef<RNTextInput | null>(null);
  const register = useRegisterMutation();
  const googleLogin = useGoogleLoginMutation();
  const form = useForm<AuthRegisterInput>({
    resolver: zodResolver(authRegisterSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  });
  const password = form.watch("password");
  const passwordStrength = getPasswordStrength(password);

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

  return (
    <AuthCosmicScaffold
      title="Empieza tu viaje orbital"
      subtitle="Crea tu cuenta y prepara tu primera senal en Nexo."
      storyTitle="Una galaxia de comunidades te espera"
      storyCopy="Crea tu cuenta y entra en las Orbitas de la gente que comparte lo que te mueve."
    >
      <View style={styles.form}>
        {!env.demoMode ? (
          <SocialAuthRow
            dividerLabel="o crea tu cuenta con email"
            onProvider={handleGoogleLogin}
            loadingProvider={googleLogin.isPending ? "google" : null}
          />
        ) : null}

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
              icon={<Mail size={17} color={theme.colors.textFaint} />}
            />
          )}
        />

        <View>
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <TextInput
                ref={passwordRef}
                compact
                surface="auth"
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
                icon={<Lock size={17} color={theme.colors.textFaint} />}
                rightElement={
                  <PasswordRevealButton
                    visible={passwordVisible}
                    onPress={() => setPasswordVisible((visible) => !visible)}
                  />
                }
              />
            )}
          />
          <PasswordStrength value={passwordStrength} />
        </View>

        <Controller
          control={form.control}
          name="confirmPassword"
          render={({ field, fieldState }) => (
            <TextInput
              ref={confirmPasswordRef}
              compact
              surface="auth"
              label="Confirmar contrasena"
              accessibilityLabel="Confirmar contrasena"
              placeholder="Repite tu contrasena"
              secureTextEntry={!confirmPasswordVisible}
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
              icon={<Lock size={17} color={theme.colors.textFaint} />}
              rightElement={
                <PasswordRevealButton
                  visible={confirmPasswordVisible}
                  onPress={() =>
                    setConfirmPasswordVisible((visible) => !visible)
                  }
                />
              }
            />
          )}
        />

        <AuthErrorAlert message={registerError} />

        <AuthSubmitButton
          title="Crear cuenta"
          loading={register.isPending}
          disabled={register.isPending || googleLogin.isPending}
          onPress={form.handleSubmit(handleRegister)}
        />

        <Text style={[styles.legal, { color: theme.colors.textFaint }]}>
          Al crear cuenta aceptas nuestros{" "}
          <Link
            href="/terms"
            style={[styles.legalLink, { color: theme.colors.textMuted }]}
          >
            Terminos
          </Link>{" "}
          y la{" "}
          <Link
            href="/privacy"
            style={[styles.legalLink, { color: theme.colors.textMuted }]}
          >
            Politica de privacidad
          </Link>
          .
        </Text>

        <View style={styles.loginWrap}>
          <Text style={[styles.login, { color: theme.colors.textMuted }]}>
            Ya estas en Nexo?{" "}
            <Link
              href="/login"
              style={[styles.loginLink, { color: theme.colors.text }]}
            >
              Entrar
            </Link>
          </Text>
        </View>
      </View>
    </AuthCosmicScaffold>
  );
}

function PasswordStrength({ value }: { value: PasswordStrengthValue }) {
  const theme = useTheme();
  const activeColor =
    value.score >= 4
      ? theme.colors.primary
      : value.score >= 3
        ? theme.colors.secondary
        : value.score >= 2
          ? "#F59E0B"
          : theme.colors.error;

  return (
    <View style={styles.strengthBlock} accessibilityLiveRegion="polite">
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((index) => {
          const active = value.score > index;
          return (
            <View
              key={index}
              style={[
                styles.strengthBar,
                {
                  backgroundColor: active
                    ? activeColor
                    : "rgba(255,255,255,0.09)",
                  shadowColor: active ? activeColor : "transparent",
                  shadowOpacity: active ? 0.7 : 0,
                },
              ]}
            />
          );
        })}
      </View>
      <View style={styles.strengthMeta}>
        {value.label ? (
          <Text style={[styles.strengthLabel, { color: activeColor }]}>
            {value.label}
          </Text>
        ) : null}
        <Text
          numberOfLines={2}
          style={[styles.strengthHint, { color: theme.colors.textFaint }]}
        >
          {value.hint}
        </Text>
      </View>
    </View>
  );
}

type PasswordStrengthValue = {
  score: number;
  label: string;
  hint: string;
};

function getPasswordStrength(password: string): PasswordStrengthValue {
  if (!password) {
    return {
      score: 0,
      label: "",
      hint: "Usa mayusculas, minusculas y numeros.",
    };
  }

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasExtra = /[^A-Za-z0-9]/.test(password) || password.length >= 12;
  const score = [hasLength, hasUpper && hasLower, hasNumber, hasExtra].filter(
    Boolean,
  ).length;

  if (score >= 4) {
    return {
      score,
      label: "Fuerte",
      hint: "Buena senal. Tu contrasena es solida.",
    };
  }

  if (score >= 3) {
    return {
      score,
      label: "Buena",
      hint: hasExtra
        ? "Lista para despegar."
        : "Anade un simbolo si quieres reforzarla.",
    };
  }

  if (score >= 2) {
    return {
      score,
      label: "Mejorable",
      hint:
        hasUpper && hasLower
          ? "Anade un numero para reforzarla."
          : "Mezcla mayusculas y minusculas.",
    };
  }

  return {
    score,
    label: "Debil",
    hint: hasLength
      ? "Combina letras y numeros."
      : "Usa al menos 8 caracteres.",
  };
}

const styles = StyleSheet.create({
  form: {
    gap: 11,
  },
  strengthBlock: {
    gap: 7,
    marginTop: 7,
  },
  strengthBars: {
    flexDirection: "row",
    gap: 6,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  strengthMeta: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  strengthLabel: {
    minWidth: 70,
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: "600",
  },
  strengthHint: {
    flex: 1,
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.tiny,
    lineHeight: 15,
    fontWeight: "500",
    textAlign: "right",
  },
  legal: {
    maxWidth: 280,
    alignSelf: "center",
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.tiny,
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
  legalLink: {
    fontFamily: fontFamilies.interSemiBold,
    fontWeight: "600",
  },
  loginWrap: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
    marginTop: 2,
    alignItems: "center",
  },
  login: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "500",
    textAlign: "center",
  },
  loginLink: {
    fontFamily: fontFamilies.interSemiBold,
    fontWeight: "600",
  },
});
