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
import { ArrowRight, Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { env } from "../../../lib/env";
import { useTheme } from "../../../theme/useTheme";
import {
  authLoginSchema,
  type AuthLoginInput,
} from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { AuthScaffold } from "../components/AuthScaffold";
import { SocialAuthRow } from "../components/SocialAuthRow";
import { useLoginMutation } from "../hooks/useAuthMutations";

type DemoOrbColor = "secondary" | "primary" | "accent";

const demoUsers: ReadonlyArray<{
  name: string;
  role: string;
  email: string;
  color: DemoOrbColor;
}> = [
  { name: "Luna", role: "Exploradora", email: "luna@nexo.local", color: "secondary" },
  { name: "Kai", role: "Moderador", email: "kai@nexo.local", color: "primary" },
  { name: "Iris", role: "Admin", email: "iris@nexo.local", color: "accent" },
];

export function LoginScreen() {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const passwordRef = useRef<RNTextInput | null>(null);
  const login = useLoginMutation();
  const form = useForm<AuthLoginInput>({
    resolver: zodResolver(authLoginSchema),
    mode: "onTouched",
    defaultValues: {
      email: "",
      password: "",
    },
  });
  const validationErrors = form.formState.errors;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  async function handleLogin(input: AuthLoginInput) {
    try {
      setAuthError(null);
      await login.mutateAsync(input);
      router.replace("/");
    } catch (error) {
      setAuthError(getFriendlyLoginError(error));
    }
  }

  function fillDemoUser(email: string) {
    setAuthError(null);
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", "Password123!", { shouldValidate: true });
  }

  return (
    <AuthScaffold
      eyebrow="Bienvenido de vuelta"
      title="Vuelve a tu Orbita"
      subtitle="Entra y retoma tus comunidades, chats y ecos pendientes."
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
            returnKeyType="next"
            value={field.value}
            onChangeText={(value) => {
              setAuthError(null);
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
            label="Contrasena"
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
              setAuthError(null);
              field.onChange(value);
            }}
            onBlur={field.onBlur}
            onSubmitEditing={form.handleSubmit(handleLogin)}
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
                  styles.eyeButton,
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
      {authError ? (
        <View
          accessibilityRole="alert"
          style={[
            styles.authError,
            {
              backgroundColor: `${theme.colors.error}18`,
              borderColor: `${theme.colors.error}70`,
            },
          ]}
        >
          <Text style={[styles.authErrorText, { color: theme.colors.text }]}>
            {authError}
          </Text>
        </View>
      ) : null}
      {env.demoMode ? (
        <View
          style={[
            styles.demoBlock,
            {
              backgroundColor: "rgba(255,255,255,0.04)",
              borderColor: "rgba(255,255,255,0.08)",
            },
          ]}
        >
          <View style={styles.demoHeader}>
            <Text style={[styles.demoLabel, { color: theme.colors.text }]}>
              Acceso demo
            </Text>
            <Text style={[styles.demoHint, { color: theme.colors.textFaint }]}>
              Elige una orbita para entrar
            </Text>
          </View>
          <View style={styles.demoUsers}>
            {demoUsers.map((user) => {
              const accent = theme.colors[user.color];
              return (
                <Pressable
                  key={user.email}
                  accessibilityRole="button"
                  accessibilityLabel={`Usar demo ${user.name}, ${user.role}`}
                  onPress={() => fillDemoUser(user.email)}
                  style={({ pressed }) => [
                    styles.demoChip,
                    {
                      backgroundColor: theme.colors.elevated,
                      borderColor: pressed ? accent : `${accent}3D`,
                      shadowColor: accent,
                      shadowOpacity: pressed ? 0.45 : 0.22,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.demoOrbHalo,
                      { backgroundColor: `${accent}22` },
                    ]}
                  />
                  <View
                    style={[
                      styles.demoOrb,
                      {
                        backgroundColor: `${accent}1C`,
                        borderColor: accent,
                      },
                    ]}
                  >
                    <Text style={[styles.demoOrbLetter, { color: accent }]}>
                      {user.name[0]}
                    </Text>
                  </View>
                  <View style={styles.demoChipText}>
                    <Text
                      style={[styles.demoChipName, { color: theme.colors.text }]}
                    >
                      {user.name}
                    </Text>
                    <Text
                      style={[
                        styles.demoChipRole,
                        { color: theme.colors.textFaint },
                      ]}
                    >
                      {user.role}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}
      <Button
        title="Entrar"
        size="lg"
        loading={login.isPending}
        disabled={login.isPending}
        gradient={[theme.colors.primary, theme.colors.accent]}
        iconRight={<ArrowRight size={18} color="#FFFFFF" />}
        style={[
          styles.loginButton,
          {
            shadowColor: theme.colors.primary,
            borderColor: "transparent",
          },
        ]}
        onPress={form.handleSubmit(handleLogin)}
      />
      <View style={styles.links}>
        <Link
          href="/forgot-password"
          style={[styles.linkMuted, { color: theme.colors.textMuted }]}
        >
          Olvidaste tu contrasena?
        </Link>
        <Text style={{ color: theme.colors.textMuted }}>
          No tienes cuenta?{" "}
          <Link
            href="/register"
            style={[styles.link, { color: theme.colors.accent }]}
          >
            Crear cuenta
          </Link>
        </Text>
      </View>
    </AuthScaffold>
  );
}

function getFriendlyLoginError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();

  if (
    message.includes("invalid login") ||
    message.includes("invalid credentials")
  ) {
    return "Email o contrasena incorrectos. Revisa tus datos e intenta de nuevo.";
  }

  if (message.includes("email not confirmed")) {
    return "Tu email todavia no esta confirmado. Revisa tu bandeja de entrada.";
  }

  if (message.includes("network") || message.includes("fetch")) {
    return "No pudimos conectar con Nexo. Comprueba tu conexion e intenta otra vez.";
  }

  return "No se pudo iniciar sesion. Intentalo de nuevo en unos segundos.";
}

const styles = StyleSheet.create({
  authError: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  authErrorText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
  },
  loginButton: {
    shadowOpacity: 0.34,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  links: {
    alignItems: "center",
    gap: 10,
  },
  link: {
    fontWeight: "800",
  },
  linkMuted: {
    fontWeight: "700",
    fontSize: 13,
  },
  eyeButton: {
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
  demoBlock: {
    gap: 10,
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  demoHeader: {
    gap: 2,
  },
  demoLabel: {
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  demoHint: {
    fontSize: 12,
    lineHeight: 16,
  },
  demoUsers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  demoChip: {
    minHeight: 56,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
    flexDirection: "row",
    gap: 9,
    justifyContent: "flex-start",
    flexGrow: 1,
    flexBasis: "30%",
    minWidth: 96,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "hidden",
  },
  demoOrbHalo: {
    position: "absolute",
    left: -6,
    top: -6,
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.6,
  },
  demoOrb: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  demoOrbLetter: {
    fontSize: 13,
    fontWeight: "900",
  },
  demoChipText: {
    flex: 1,
    minWidth: 0,
  },
  demoChipName: {
    fontSize: 13,
    fontWeight: "900",
  },
  demoChipRole: {
    fontSize: 11,
    fontWeight: "800",
  },
});
