"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";
import { AuthError } from "@/lib/auth/utils";
import { invalidateQueries, queryKeys } from "@/lib/query";
import type { LoginFormInput } from "@/lib/validations/auth";
import * as authService from "@/services/auth";

const PHONE_STORAGE_KEY = "crease.auth.phone";

function persistAuthPhone(phone: string) {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(PHONE_STORAGE_KEY, phone);
  }
}

export function readAuthPhone() {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(PHONE_STORAGE_KEY);
}

function clearAuthPhone() {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(PHONE_STORAGE_KEY);
  }
}

export function useSendOtp() {
  const router = useRouter();

  return useMutation({
    mutationFn: (input: LoginFormInput) => authService.sendOtp(input),
    onSuccess: ({ phone }) => {
      persistAuthPhone(phone);
      router.push(`${AUTH_ROUTES.otp}?phone=${encodeURIComponent(phone)}`);
    },
  });
}

export function useVerifyOtp() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.verifyOtp,
    onSuccess: (data) => {
      void invalidateQueries.auth(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.root });
      const user = data.user as
        | { user_metadata?: { onboarding_complete?: boolean } }
        | null
        | undefined;
      const complete = user?.user_metadata?.onboarding_complete === true;
      router.replace(complete ? "/home" : AUTH_ROUTES.completeProfile);
    },
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (phone: string) => authService.resendOtp(phone),
  });
}

export function useCompleteProfile() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authService.completeProfile,
    onSuccess: () => {
      clearAuthPhone();
      void invalidateQueries.auth(queryClient);
      router.replace("/home");
    },
  });
}

export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => authService.signOut(),
    onSuccess: async () => {
      clearAuthPhone();
      await queryClient.cancelQueries();
      queryClient.clear();
      router.replace(AUTH_ROUTES.login);
    },
  });
}

export function getMutationErrorMessage(error: unknown) {
  if (error instanceof AuthError) return error.message;
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
