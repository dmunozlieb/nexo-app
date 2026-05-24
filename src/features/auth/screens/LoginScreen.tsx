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
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
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
import { useLoginMutation } from "../hooks/useAuthMutations";

const demoUsers = [
  { name: "Luna", role: "Exploradora", email: "luna@nexo.local" },
  { name: "Kai", role: "Moderador", email: "kai@nexo.local" },
  { name: "Iris", role: "Admin", email: "iris@nexo.local" },
] as const;

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
                  <EyeOff size={20} color={theme.colors.textMuted} />
                ) : (
                  <Eye size={20} color={theme.colors.textMuted} />
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
              backgroundColor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            },
          ]}
        >
          <View style={styles.demoHeader}>
            <Text style={[styles.demoLabel, { color: theme.colors.text }]}>
              Acceso demo
            </Text>
            <Text style={[styles.demoHint, { color: theme.colors.textFaint }]}>
              Rellena credenciales de prueba
            </Text>
          </View>
          <View style={styles.demoUsers}>
            {demoUsers.map((user) => (
              <Pressable
                key={user.email}
                accessibilityRole="button"
                accessibilityLabel={`Usar demo ${user.name}, ${user.role}`}
                onPress={() => fillDemoUser(user.email)}
                style={({ pressed }) => [
                  styles.demoChip,
                  {
                    backgroundColor: theme.colors.elevated,
                    borderColor: theme.colors.border,
                    opacity: pressed ? 0.72 : 1,
                  },
                ]}
              >
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
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}
      <Button
        title="Entrar"
        size="lg"
        loading={login.isPending}
        disabled={login.isPending}
        style={[
          styles.loginButton,
          {
            shadowColor: theme.colors.secondary,
            backgroundColor: theme.colors.primary,
            borderColor: theme.colors.primary,
          },
        ]}
        onPress={form.handleSubmit(handleLogin)}
      />
      <View style={styles.links}>
        <Link
          href="/forgot-password"
          style={[styles.link, { color: theme.colors.secondary }]}
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
  eyeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
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
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    alignItems: "flex-start",
    justifyContent: "center",
    flexGrow: 1,
    minWidth: 92,
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
