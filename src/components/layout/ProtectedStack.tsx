import { Redirect, Stack } from "expo-router";
import { AppNavigationFrame } from "../navigation/AppNavigationFrame";
import { LoadingState } from "../ui/LoadingState";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useTheme } from "../../theme/useTheme";

export function ProtectedStack() {
  const auth = useAuth();
  const theme = useTheme();

  if (!auth.initialized) {
    return <LoadingState label="Preparando Nexo..." />;
  }

  if (!auth.session) {
    return <Redirect href="/login" />;
  }

  if (!auth.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <AppNavigationFrame>
      <Stack
        screenOptions={{
          title: "",
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </AppNavigationFrame>
  );
}
