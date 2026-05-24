import type { Session } from "@supabase/supabase-js";
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
    options: {
      data: {
        display_name: input.displayName,
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "nexo://auth/callback",
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function resetPassword(input: ResetPasswordInput) {
  if (env.demoMode) {
    return demoResetPassword(input);
  }

  const { data, error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: "nexo://settings/account",
  });

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
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}

export async function listInterests() {
  if (env.demoMode) {
    return demoListInterests();
  }

  const { data, error } = await supabase
    .from("interests")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as Interest[];
}

export async function completeOnboarding(userId: string, input: OnboardingInput) {
  if (env.demoMode) {
    return demoCompleteOnboarding(userId, input);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      username: input.username,
      display_name: input.displayName,
      bio: input.bio ?? null,
      avatar_url: input.avatarUrl ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (profileError) {
    throw profileError;
  }

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

  const { error: interestsError } = await supabase
    .from("user_interests")
    .insert(rows);

  if (interestsError) {
    throw interestsError;
  }

  return getProfile(userId);
}

export function isProfileComplete(profile: Profile | null) {
  return Boolean(
    profile?.username &&
      profile.display_name &&
      !profile.username.startsWith("nexo_"),
  );
}
