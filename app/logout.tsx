import { useEffect } from "react";
import { router } from "expo-router";
import { LoadingState } from "../src/components/ui/LoadingState";
import { signOut } from "../src/features/auth/services/auth-service";

export default function LogoutRoute() {
  useEffect(() => {
    let mounted = true;

    async function logout() {
      try {
        await signOut();
      } finally {
        if (mounted) {
          router.replace("/login");
        }
      }
    }

    void logout();

    return () => {
      mounted = false;
    };
  }, []);

  return <LoadingState label="Cerrando sesion..." />;
}
