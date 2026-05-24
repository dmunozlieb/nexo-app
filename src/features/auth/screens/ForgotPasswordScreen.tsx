import { Alert } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Mail } from "lucide-react-native";
import { Button } from "../../../components/ui/Button";
import { TextInput } from "../../../components/ui/TextInput";
import { useTheme } from "../../../theme/useTheme";
import { resetPasswordSchema, type ResetPasswordInput } from "../../../utils/validation";
import { getErrorMessage } from "../../../utils/errors";
import { AuthScaffold } from "../components/AuthScaffold";
import { useResetPasswordMutation } from "../hooks/useAuthMutations";

export function ForgotPasswordScreen() {
  const theme = useTheme();
  const resetPassword = useResetPasswordMutation();
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function handleReset(input: ResetPasswordInput) {
    try {
      await resetPassword.mutateAsync(input);
      Alert.alert("Revisa tu email", "Te hemos enviado instrucciones para continuar.");
      router.replace("/login");
    } catch (error) {
      Alert.alert("No se pudo enviar", getErrorMessage(error));
    }
  }

  return (
    <AuthScaffold
      title="Recupera tu acceso"
      subtitle="Te enviaremos un enlace seguro para restablecer tu contrasena."
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
      <Button
        title="Enviar enlace"
        size="lg"
        loading={resetPassword.isPending}
        onPress={form.handleSubmit(handleReset)}
      />
      <Button title="Volver" variant="ghost" onPress={() => router.back()} />
    </AuthScaffold>
  );
}
