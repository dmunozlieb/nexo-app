import { Redirect, Tabs } from "expo-router";
import { Home, MessageSquare, Search, UserRound } from "lucide-react-native";
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
    <Tabs
      initialRouteName="home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.secondary,
        tabBarInactiveTintColor: theme.colors.textFaint,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          minHeight: 70,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          borderRadius: 16,
          marginHorizontal: 3,
        },
        tabBarLabelStyle: {
          fontWeight: "800",
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Inicio",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Descubrir",
          tabBarIcon: ({ color, size }) => <Search color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => <UserRound color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
