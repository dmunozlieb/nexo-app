import { Redirect, Tabs } from "expo-router";
import { AppNavigationFrame } from "../../src/components/navigation/AppNavigationFrame";
import { LoadingState } from "../../src/components/ui/LoadingState";
import { useAuth } from "../../src/features/auth/hooks/useAuth";
import { useTheme } from "../../src/theme/useTheme";

export default function TabsLayout() {
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
      <Tabs
        initialRouteName="home"
        tabBar={() => null}
        screenOptions={{
          headerShown: false,
          animation: "shift",
          tabBarHideOnKeyboard: true,
          sceneStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Inicio" }} />
        <Tabs.Screen name="discover" options={{ title: "Explorar" }} />
        <Tabs.Screen name="create" options={{ title: "Crear" }} />
        <Tabs.Screen name="chat" options={{ title: "Chats" }} />
        <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
      </Tabs>
    </AppNavigationFrame>
  );
}
