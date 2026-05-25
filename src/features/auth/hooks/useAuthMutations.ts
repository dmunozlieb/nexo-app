import { useMutation } from "@tanstack/react-query";
import {
  resetPassword,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from "../services/auth-service";

export function useLoginMutation() {
  return useMutation({
    mutationFn: signInWithEmail,
  });
}

export function useRegisterMutation() {
  return useMutation({
    mutationFn: signUpWithEmail,
  });
}

export function useGoogleLoginMutation() {
  return useMutation({
    mutationFn: signInWithGoogle,
  });
}

export function useResetPasswordMutation() {
  return useMutation({
    mutationFn: resetPassword,
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: signOut,
  });
}
