import type { Session } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoCompleteOnboarding,
  demoGetCurrentSession,
  demoGetProfile,
  demoListAccounts,
  demoListInterests,
  demoResetPassword,
  demoSignInWithEmail,
  demoSignOut,
  demoSignUpWithEmail,
  type DemoAccount,
} from "../../../services/demo-service";
import type { Interest, Profile } from "../../../types/domain";
import type {
  AuthLoginInput,
  AuthRegisterInput,
  OnboardingInput,
  ResetPasswordInput,
} from "../../../utils/validation";

WebBrowser.maybeCompleteAuthSession();

function getOAuthRedirectTo() {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.origin;
  }

  return "nexo://auth/callback";
}

export type { DemoAccount };

/** Cuentas demo disponibles para acceso rapido en el login (vacio fuera de demo). */
export function listDemoAccounts(): DemoAccount[] {
  return env.demoMode ? demoListAccounts() : [];
}

export async function signInWithEmail(input: AuthLoginInput) {
  if (env.demoMode) {
    return demoSignInWithEmail(input);
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signUpWithEmail(input: AuthRegisterInput) {
  if (env.demoMode) {
    return demoSignUpWithEmail(input);
  }

  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithGoogle() {
  const redirectTo = getOAuthRedirectTo();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== "web",
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }

  if (Platform.OS === "web") {
    return data;
  }

  if (!data.url) {
    throw new Error("No se pudo iniciar Google Auth.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    throw new Error("Inicio con Google cancelado.");
  }

  const url = new URL(result.url);
  const code = url.searchParams.get("code");

  if (!code) {
    throw new Error("Google no devolvio un codigo valido.");
  }

  const session = await supabase.auth.exchangeCodeForSession(code);

  if (session.error) {
    throw session.error;
  }

  return session.data;
}

export async function resetPassword(input: ResetPasswordInput) {
  if (env.demoMode) {
    return demoResetPassword(input);
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(
    input.email,
    {
      redirectTo: "nexo://settings/account",
    },
  );

  if (error) {
    throw error;
  }

  return data;
}

export async function signOut() {
  if (env.demoMode) {
    await demoSignOut();
    return;
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}

export async function getCurrentSession(): Promise<Session | null> {
  if (env.demoMode) {
    return demoGetCurrentSession();
  }

  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

// Profile rows are auto-created by the on_auth_user_created trigger
// (see supabase/migrations/005_auto_create_profile.sql). A null result here
// means either demo mode without a session or a legacy user predating the
// trigger; both route through onboarding where upsertProfile creates the row.
export async function getProfile(userId: string): Promise<Profile | null> {
  if (env.demoMode) {
    return demoGetProfile(userId);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as Profile | null) ?? null;
}

const FALLBACK_INTERESTS: Interest[] = [
  { id: "aaaaaaaa-0000-4000-8000-000000000001", name: "Arte", slug: "arte", icon: "art" },
  { id: "aaaaaaaa-0000-4000-8000-000000000002", name: "Gaming", slug: "gaming", icon: "game" },
  { id: "aaaaaaaa-0000-4000-8000-000000000003", name: "Lectura", slug: "lectura", icon: "book" },
  { id: "aaaaaaaa-0000-4000-8000-000000000004", name: "Musica", slug: "musica", icon: "music" },
  { id: "aaaaaaaa-0000-4000-8000-000000000005", name: "Tecnologia", slug: "tecnologia", icon: "code" },
  { id: "aaaaaaaa-0000-4000-8000-000000000006", name: "Cine", slug: "cine", icon: "film" },
];

export async function listInterests() {
  if (env.demoMode) {
    return demoListInterests();
  }

  try {
    const { data, error } = await supabase
      .from("interests")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      throw error;
    }

    const rows = (data ?? []) as Interest[];
    return rows.length > 0 ? rows : FALLBACK_INTERESTS;
  } catch {
    return FALLBACK_INTERESTS;
  }
}

export async function completeOnboarding(
  userId: string,
  input: OnboardingInput,
) {
  if (env.demoMode) {
    return demoCompleteOnboarding(userId, input);
  }

  await upsertProfile(userId, input);
  await replaceUserInterests(userId, input.interestIds);
  return getProfile(userId);
}

async function replaceUserInterests(userId: string, interestIds: string[]) {
  try {
    const { error: deleteError } = await supabase
      .from("user_interests")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    if (interestIds.length === 0) {
      return;
    }

    const rows = interestIds.map((interestId) => ({
      user_id: userId,
      interest_id: interestId,
    }));

    const { error: interestsError } = await supabase
      .from("user_interests")
      .insert(rows);

    if (interestsError) {
      throw interestsError;
    }
  } catch (error) {
    // Non-blocking: interest persistence is a soft requirement while the
    // database schema is being finalized. Log so QA can see failures.
    console.warn("replaceUserInterests failed", error);
  }
}

async function upsertProfile(
  userId: string,
  input: Pick<OnboardingInput, "username" | "displayName" | "bio" | "avatarUrl">,
) {
  const now = new Date().toISOString();
  const { error } = await supabase.from("profiles").upsert(
    {
      id: userId,
      username: input.username,
      display_name: input.displayName,
      bio: input.bio ?? null,
      avatar_url: input.avatarUrl ?? null,
      updated_at: now,
      is_banned: false,
    },
    { onConflict: "id" },
  );

  if (error) {
    throw error;
  }
}

export function isProfileComplete(profile: Profile | null) {
  return Boolean(
    profile?.username &&
    profile.display_name &&
    !profile.username.startsWith("nexo_"),
  );
}
