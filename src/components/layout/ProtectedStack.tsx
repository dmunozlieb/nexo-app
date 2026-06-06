import { useWindowDimensions } from "react-native";
import { Redirect, Stack } from "expo-router";
import { AppNavigationFrame } from "../navigation/AppNavigationFrame";
import { LoadingState } from "../ui/LoadingState";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { useTheme } from "../../theme/useTheme";

const DESKTOP_WIDTH = 980;

export function ProtectedStack() {
  const auth = useAuth();
  const theme = useTheme();
  const { width } = useWindowDimensions();
  // En movil/tablet la navegacion se cubre con el bottom-nav (y cada pantalla
  // inmersiva tiene su propia flecha), asi que ocultamos la cabecera del Stack.
  // En desktop no hay bottom-nav, asi que la flecha atras se mantiene.
  const isDesktop = width >= DESKTOP_WIDTH;

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
          headerShown: isDesktop,
          headerStyle: { backgroundColor: theme.colors.background },
          headerTintColor: theme.colors.text,
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </AppNavigationFrame>
  );
}
