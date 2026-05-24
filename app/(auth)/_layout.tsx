import { Redirect, Stack } from "expo-router";
import { LoadingState } from "../../src/components/ui/LoadingState";
import { useAuth } from "../../src/features/auth/hooks/useAuth";
import { useTheme } from "../../src/theme/useTheme";

export default function AuthLayout() {
  const auth = useAuth();
  const theme = useTheme();

  if (!auth.initialized) {
    return <LoadingState label="Preparando acceso..." />;
  }

  if (auth.session && auth.onboardingComplete) {
    return <Redirect href="/home" />;
  }

  if (auth.session && !auth.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    />
  );
}
