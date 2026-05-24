import { Redirect } from "expo-router";
import { LoadingState } from "../src/components/ui/LoadingState";
import { useAuth } from "../src/features/auth/hooks/useAuth";

export default function IndexRoute() {
  const auth = useAuth();

  if (!auth.initialized) {
    return <LoadingState label="Encendiendo Orbitas..." />;
  }

  if (!auth.session) {
    return <Redirect href="/login" />;
  }

  if (!auth.onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/home" />;
}
