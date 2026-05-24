import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Eye, EyeOff, Mail, Lock } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { useTheme } from "../../../theme/useTheme";
import {
  authLoginSchema,
  type AuthLoginInput,
} from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { AuthScaffold } from "../components/AuthScaffold";
import { useLoginMutation } from "../hooks/useAuthMutations";

export function LoginScreen() {
  const theme = useTheme();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const login = useLoginMutation();
  const form = useForm<AuthLoginInput>({
    resolver: zodResolver(authLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleLogin(input: AuthLoginInput) {
    try {
      await login.mutateAsync(input);
      router.replace("/");
    } catch (error) {
      Alert.alert("No se pudo iniciar sesion", getErrorMessage(error));
    }
  }

  function fillDemoUser(email: string) {
    form.setValue("email", email, { shouldValidate: true });
    form.setValue("password", "Password123!", { shouldValidate: true });
  }

  return (
    <AuthScaffold
      title="Bienvenido de vuelta"
      subtitle="Entra a tus Orbitas, responde ecos y sigue las conversaciones que dejaste abiertas."
    >
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <TextInput
            label="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
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
            label="Contrasena"
            secureTextEntry={!passwordVisible}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            autoComplete="password"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
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
      <View style={styles.demoBlock}>
        <Text style={[styles.demoLabel, { color: theme.colors.textFaint }]}>
          Acceso demo
        </Text>
        <View style={styles.demoUsers}>
          {["luna@nexo.local", "kai@nexo.local", "iris@nexo.local"].map((email) => (
            <Pressable
              key={email}
              accessibilityRole="button"
              accessibilityLabel={`Usar ${email}`}
              onPress={() => fillDemoUser(email)}
              style={({ pressed }) => [
                styles.demoChip,
                {
                  backgroundColor: theme.colors.elevated,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.72 : 1,
                },
              ]}
            >
              <Text style={[styles.demoChipText, { color: theme.colors.textMuted }]}>
                {email.split("@")[0]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <Button
        title="Entrar"
        size="lg"
        loading={login.isPending}
        onPress={form.handleSubmit(handleLogin)}
      />
      <View style={styles.links}>
        <Link href="/forgot-password" style={[styles.link, { color: theme.colors.secondary }]}>
          Olvidaste tu contrasena?
        </Link>
        <Text style={{ color: theme.colors.textMuted }}>
          No tienes cuenta?{" "}
          <Link href="/register" style={[styles.link, { color: theme.colors.accent }]}>
            Crear cuenta
          </Link>
        </Text>
      </View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
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
    gap: 8,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  demoUsers: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  demoChip: {
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
});
