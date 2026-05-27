import type { Session } from "@supabase/supabase-js";
import { Platform } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { env } from "../../../lib/env";
import { supabase } from "../../../lib/supabase";
import {
  demoCompleteOnboarding,
  demoGetCurrentSession,
  demoGetProfile,
  demoListInterests,
  demoResetPassword,
  demoSignInWithEmail,
  demoSignOut,
  demoSignUpWithEmail,
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

export async function getProfile(userId: string) {
  if (env.demoMode) {
    return demoGetProfile(userId);
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .limit(1);

  if (error) {
    throw error;
  }

  const profile = data?.[0] ?? null;

  if (!profile) {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (user?.id !== userId) {
      return null;
    }

    await upsertProfile(userId, {
      username: getTemporaryUsername(userId),
      displayName: getUserDisplayName(user),
      bio: undefined,
      avatarUrl: getUserAvatarUrl(user),
    });

    return getProfile(userId);
  }

  return profile as Profile;
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

  try {
    const { error: deleteError } = await supabase
      .from("user_interests")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      throw deleteError;
    }

    const rows = input.interestIds.map((interestId) => ({
      user_id: userId,
      interest_id: interestId,
    }));

    if (rows.length) {
      const { error: interestsError } = await supabase
        .from("user_interests")
        .insert(rows);

      if (interestsError) {
        throw interestsError;
      }
    }
  } catch {
    // Interests are non-blocking while the real database schema is being completed.
  }

  return getProfile(userId);
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

function getTemporaryUsername(userId: string) {
  return `nexo_${userId.replaceAll("-", "").slice(0, 10)}`;
}

function getUserDisplayName(user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>) {
  const metadata = user.user_metadata ?? {};
  const fromMetadata =
    metadata.display_name ?? metadata.full_name ?? metadata.name;
  const fromEmail = user.email?.split("@")[0];

  return String(fromMetadata ?? fromEmail ?? "Nexo Explorer").slice(0, 40);
}

function getUserAvatarUrl(user: NonNullable<Awaited<ReturnType<typeof supabase.auth.getUser>>["data"]["user"]>) {
  const metadata = user.user_metadata ?? {};
  const avatarUrl = metadata.avatar_url ?? metadata.picture;

  return avatarUrl ? String(avatarUrl) : null;
}

export function isProfileComplete(profile: Profile | null) {
  return Boolean(
    profile?.username &&
    profile.display_name &&
    !profile.username.startsWith("nexo_"),
  );
}
