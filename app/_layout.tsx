import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { queryClient } from "../src/lib/query-client";
import { AuthProvider } from "../src/features/auth/hooks/useAuth";
import { useTheme } from "../src/theme/useTheme";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RootStack />
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

function RootStack() {
  const theme = useTheme();

  return (
    <>
      <StatusBar style={theme.mode === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      />
    </>
  );
}
