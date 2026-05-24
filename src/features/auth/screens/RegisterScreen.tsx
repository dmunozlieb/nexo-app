import { Alert, StyleSheet, Text } from "react-native";
import { Link, router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Mail, Lock, UserRound } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { useTheme } from "../../../theme/useTheme";
import {
  authRegisterSchema,
  type AuthRegisterInput,
} from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { AuthScaffold } from "../components/AuthScaffold";
import { useRegisterMutation } from "../hooks/useAuthMutations";

export function RegisterScreen() {
  const theme = useTheme();
  const register = useRegisterMutation();
  const form = useForm<AuthRegisterInput>({
    resolver: zodResolver(authRegisterSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
    },
  });

  async function handleRegister(input: AuthRegisterInput) {
    try {
      await register.mutateAsync(input);
      router.replace("/onboarding");
    } catch (error) {
      Alert.alert("No se pudo crear la cuenta", getErrorMessage(error));
    }
  }

  return (
    <AuthScaffold
      title="Crea tu identidad"
      subtitle="Elige luego tus intereses y empieza a participar en Orbitas con seguridad desde el primer dia."
    >
      <Controller
        control={form.control}
        name="displayName"
        render={({ field, fieldState }) => (
          <TextInput
            label="Nombre visible"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            icon={<UserRound size={18} color={theme.colors.textFaint} />}
          />
        )}
      />
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
            secureTextEntry
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
            icon={<Lock size={18} color={theme.colors.textFaint} />}
          />
        )}
      />
      <Button
        title="Crear cuenta"
        size="lg"
        loading={register.isPending}
        onPress={form.handleSubmit(handleRegister)}
      />
      <Text style={[styles.login, { color: theme.colors.textMuted }]}>
        Ya tienes cuenta?{" "}
        <Link href="/login" style={[styles.link, { color: theme.colors.secondary }]}>
          Entrar
        </Link>
      </Text>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  login: {
    textAlign: "center",
  },
  link: {
    fontWeight: "800",
  },
});
