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
import { ChevronRight, Lock, Mail } from "lucide-react-native";
import { Avatar } from "../../../components/ui/Avatar";
import { TextInput } from "../../../components/ui/TextInput";
import { env } from "../../../lib/env";
import { listDemoAccounts } from "../services/auth-service";
import { fontFamilies, typography } from "../../../theme/tokens";
import { useTheme } from "../../../theme/useTheme";
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
import {
  AUTH_STORY,
  AuthErrorAlert,
  AuthSubmitButton,
  EMAIL_PATTERN,
  PasswordRevealButton,
  getFriendlyLoginError,
  useAuthVisualSignals,
} from "../shared";

export function LoginScreen() {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const login = useLoginMutation();
  const googleLogin = useGoogleLoginMutation();
  const visualSignals = useAuthVisualSignals();
  const demoAccounts = listDemoAccounts();
  const form = useForm<AuthLoginInput>({
    resolver: zodResolver(authLoginSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { email: "", password: "" },
  });
  const email = form.watch("email");
  const password = form.watch("password");
  const validationErrors = form.formState.errors;
  const touched = form.formState.touchedFields;
  const emailSuccess = Boolean(
    touched.email &&
      email.trim() &&
      !validationErrors.email &&
      EMAIL_PATTERN.test(email.trim()),
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

  function handleDemoLogin(email: string, password: string) {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", password, { shouldValidate: true });
    void handleLogin({ email, password });
  }

  return (
    <AuthCosmicScaffold
      title="Vuelve a tu Orbita"
      subtitle="Retoma tus chats, comunidades y senales pendientes."
      storyBadge={AUTH_STORY.badge}
      storyTitle={AUTH_STORY.title}
      storyCopy={AUTH_STORY.copy}
      showTabletMascot
      visualSignals={visualSignals}
    >
      <View style={styles.form}>
        {!env.demoMode ? (
          <SocialAuthRow
            dividerLabel="o entra con email"
            onProvider={handleGoogleLogin}
            loadingProvider={googleLogin.isPending ? "google" : null}
          />
        ) : null}

        {env.demoMode && demoAccounts.length > 0 ? (
          <View style={styles.demoPanel}>
            <Text style={[styles.demoTitle, { color: theme.colors.secondary }]}>
              Cuentas demo
            </Text>
            <Text style={[styles.demoHint, { color: theme.colors.textFaint }]}>
              Toca una para entrar al instante.
            </Text>
            <View style={styles.demoList}>
              {demoAccounts.map((account) => (
                <Pressable
                  key={account.email}
                  accessibilityRole="button"
                  accessibilityLabel={`Entrar como ${account.displayName}`}
                  disabled={login.isPending}
                  onPress={() =>
                    handleDemoLogin(account.email, account.password)
                  }
                  style={({ pressed, hovered }) => [
                    styles.demoRow,
                    {
                      borderColor: theme.colors.border,
                      backgroundColor: hovered
                        ? "rgba(255,255,255,0.08)"
                        : "rgba(255,255,255,0.03)",
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Avatar label={account.displayName} size={34} />
                  <View style={styles.demoCopy}>
                    <Text
                      style={[styles.demoName, { color: theme.colors.text }]}
                      numberOfLines={1}
                    >
                      {account.displayName}
                    </Text>
                    <Text
                      style={[
                        styles.demoHandle,
                        { color: theme.colors.textFaint },
                      ]}
                      numberOfLines={1}
                    >
                      @{account.username}
                    </Text>
                  </View>
                  <ChevronRight size={16} color={theme.colors.textFaint} />
                </Pressable>
              ))}
            </View>
          </View>
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

        <AuthErrorAlert message={loginError} />

        <AuthSubmitButton
          title="Entrar"
          loading={login.isPending}
          disabled={login.isPending || googleLogin.isPending}
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

const styles = StyleSheet.create({
  form: {
    gap: 12,
  },
  demoPanel: {
    gap: 4,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(123,92,255,0.20)",
    backgroundColor: "rgba(7,10,23,0.40)",
  },
  demoTitle: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.tiny,
    fontWeight: "700",
    letterSpacing: 0.4,
  },
  demoHint: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.tiny,
    fontWeight: "500",
    marginBottom: 4,
  },
  demoList: {
    gap: 8,
  },
  demoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 52,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  demoCopy: {
    flex: 1,
    minWidth: 0,
  },
  demoName: {
    fontFamily: fontFamilies.interSemiBold,
    fontSize: typography.small,
    fontWeight: "600",
  },
  demoHandle: {
    fontFamily: fontFamilies.interMedium,
    fontSize: typography.tiny,
    fontWeight: "500",
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
  },
  forgotLink: {
    flexShrink: 1,
    fontFamily: fontFamilies.interSemiBold,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "600",
    textAlign: "right",
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
