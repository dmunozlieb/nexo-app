import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { env } from "../../../lib/env";
import { queryClient } from "../../../lib/query-client";
import { supabase } from "../../../lib/supabase";
import { onDemoAuthStateChange } from "../../../services/demo-service";
import type { Profile } from "../../../types/domain";
import {
  getCurrentSession,
  getProfile,
  isProfileComplete,
} from "../services/auth-service";

type AuthContextValue = {
  initialized: boolean;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  const loadProfile = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.user.id) {
      setProfile(null);
      return;
    }

    try {
      const nextProfile = await getProfile(activeSession.user.id);
      setProfile(nextProfile);
    } catch {
      setProfile(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    await loadProfile(session);
  }, [loadProfile, session]);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      try {
        const currentSession = await getCurrentSession();
        if (!mounted) {
          return;
        }
        setSession(currentSession);
        await loadProfile(currentSession);
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    }

    void bootstrap();

    const unsubscribe = env.demoMode
      ? onDemoAuthStateChange((nextSession) => {
          setSession(nextSession);
          void loadProfile(nextSession);
          void queryClient.invalidateQueries();
        })
      : (() => {
          const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
            setSession(nextSession);
            void loadProfile(nextSession);
            void queryClient.invalidateQueries();
          });

          return () => data.subscription.unsubscribe();
        })();

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      initialized,
      session,
      profile,
      isAuthenticated: Boolean(session),
      onboardingComplete: isProfileComplete(profile),
      refreshProfile,
    }),
    [initialized, profile, refreshProfile, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);

  if (!value) {
    throw new Error("useAuth debe usarse dentro de AuthProvider.");
  }

  return value;
}
