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
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Orbit,
  Radio,
  Sparkles,
} from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { env } from "../../../lib/env";
import { fontFamilies, radius, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
import { getErrorMessage } from "../../../utils/errors";
import {
  authLoginSchema,
  type AuthLoginInput,
} from "../../../utils/validation";
import { AuthCosmicScaffold } from "../components/AuthCosmicScaffold";
import { SocialAuthRow } from "../components/SocialAuthRow";
import {
  useGoogleLoginMutation,
  useLoginMutation,
} from "../hooks/useAuthMutations";

export function LoginScreen() {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const login = useLoginMutation();
  const googleLogin = useGoogleLoginMutation();
  const form = useForm<AuthLoginInput>({
    resolver: zodResolver(authLoginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const email = form.watch("email");
  const password = form.watch("password");
  const validationErrors = form.formState.errors;
  const touched = form.formState.touchedFields;
  const emailSuccess = Boolean(
    touched.email &&
    email.trim() &&
    !validationErrors.email &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),
  );
  const passwordSuccess = Boolean(
    touched.password && password && !validationErrors.password,
  );

  async function handleLogin(input: AuthLoginInput) {
    try {
      setLoginError(null);
      await login.mutateAsync(input);
      router.replace("/");
    } catch (error) {
      setLoginError(getFriendlyLoginError(error));
    }
  }

  async function handleGoogleLogin() {
    try {
      setLoginError(null);
      await googleLogin.mutateAsync();
      router.replace("/");
    } catch (error) {
      setLoginError(getFriendlyLoginError(error));
    }
  }

  return (
    <AuthCosmicScaffold
      title="Vuelve a tu Orbita"
      subtitle="Retoma tus chats, comunidades y senales pendientes."
      storyBadge="Tu galaxia te espera"
      storyTitle="Tus Orbitas siguen girando"
      storyCopy="Retoma conversaciones, descubre senales nuevas y reconecta con tus comunidades justo donde lo dejaste."
      showTabletMascot
      visualSignals={[
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
      ]}
    >
      <View style={styles.form}>
        {!env.demoMode ? (
          <SocialAuthRow
            dividerLabel="o entra con email"
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
                setLoginError(null);
                field.onChange(value);
              }}
              onBlur={field.onBlur}
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
              error={fieldState.error?.message}
              success={emailSuccess}
              icon={<Mail size={17} color={theme.colors.textFaint} />}
            />
          )}
        />

        <View>
          <View style={styles.passwordHeader}>
            <Text
              style={[styles.passwordLabel, { color: theme.colors.textMuted }]}
            >
              Contrasena
            </Text>
            <Link
              href="/forgot-password"
              style={[styles.forgotLink, { color: theme.colors.secondary }]}
            >
              Olvidaste tu contrasena?
            </Link>
          </View>
          <Controller
            control={form.control}
            name="password"
            render={({ field, fieldState }) => (
              <TextInput
                ref={passwordRef}
                compact
                surface="auth"
                accessibilityLabel="Contrasena"
                placeholder="Tu contrasena"
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                autoComplete="password"
                returnKeyType="done"
                value={field.value}
                onChangeText={(value) => {
                  setLoginError(null);
                  field.onChange(value);
                }}
                onBlur={field.onBlur}
                onSubmitEditing={form.handleSubmit(handleLogin)}
                error={fieldState.error?.message}
                success={passwordSuccess}
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
        </View>

        {loginError ? (
          <View
            accessibilityRole="alert"
            style={[
              styles.loginError,
              {
                backgroundColor: `${theme.colors.error}18`,
                borderColor: `${theme.colors.error}70`,
              },
            ]}
          >
            <Text style={[styles.loginErrorText, { color: theme.colors.text }]}>
              {loginError}
            </Text>
          </View>
        ) : null}

        <Button
          title="Entrar"
          size="lg"
          loading={login.isPending}
          disabled={login.isPending || googleLogin.isPending}
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
          onPress={form.handleSubmit(handleLogin)}
        />

        <View style={styles.registerWrap}>
          <Text
            style={[styles.registerText, { color: theme.colors.textMuted }]}
          >
            No tienes cuenta?{" "}
            <Link
              href="/register"
              style={[styles.registerLink, { color: theme.colors.accent }]}
            >
              Crear cuenta
            </Link>
          </Text>
        </View>
      </View>
    </AuthCosmicScaffold>
  );
}

function PasswordRevealButton({
  visible,
  onPress,
}: {
  visible: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
      hitSlop={10}
      onPress={onPress}
      style={({ pressed }) => [
        styles.iconButton,
        { opacity: pressed ? 0.68 : 1 },
      ]}
    >
      {visible ? (
        <Eye size={19} color={theme.colors.textMuted} />
      ) : (
        <EyeOff size={19} color={theme.colors.textMuted} />
      )}
    </Pressable>
  );
}

function getFriendlyLoginError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials") ||
    message.includes("credentials")
  ) {
    return "No encontramos esa senal. Revisa tu email o contrasena e intentalo de nuevo.";
  }

  if (message.includes("rate limit")) {
    return "Demasiados intentos seguidos. Espera un poco y vuelve a intentarlo.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "No pudimos conectar con Nexo. Comprueba tu conexion e intenta otra vez.";
  }

  return "No se pudo iniciar sesion. Revisa los datos e intentalo de nuevo.";
}

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  passwordHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 5,
  },
  passwordLabel: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0,
  },
  forgotLink: {
    flexShrink: 1,
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "right",
  },
  iconButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  loginError: {
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  loginErrorText: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    lineHeight: 18,
    fontWeight: "600",
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
  primaryButtonText: {
    fontFamily: fontFamilies.interSemiBold,
    fontWeight: "600",
  },
  registerWrap: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
    marginTop: 2,
    alignItems: "center",
  },
  registerText: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.small,
    fontWeight: "500",
    textAlign: "center",
  },
  registerLink: {
    fontFamily: fontFamilies.interSemiBold,
    fontWeight: "600",
  },
});
