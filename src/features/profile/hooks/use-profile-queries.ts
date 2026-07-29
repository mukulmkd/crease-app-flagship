"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { invalidateQueries, queryKeys } from "@/lib/query";
import { useAuth } from "@/hooks/use-auth";
import type { UpdateOwnProfileInput } from "@/lib/validations/auth";
import * as authService from "@/services/auth";

export function useMyProfile() {
  const { user, isAuthenticated } = useAuth();
  return useQuery({
    queryKey: queryKeys.auth.profile(),
    queryFn: () => authService.getMyProfile(),
    enabled: Boolean(isAuthenticated && user),
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();

  return useMutation({
    mutationFn: (input: UpdateOwnProfileInput) =>
      authService.updateMyProfile(input),
    onSuccess: async () => {
      await invalidateQueries.auth(queryClient);
      await invalidateQueries.teamMembers(queryClient);
      await invalidateQueries.dashboard(queryClient);
      await refresh();
    },
  });
}

async function refreshProfileCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  refresh: () => Promise<void>,
) {
  await invalidateQueries.auth(queryClient);
  await invalidateQueries.teamMembers(queryClient);
  await invalidateQueries.dashboard(queryClient);
  await refresh();
}

export function useUpdateMyAvatar() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();

  return useMutation({
    mutationFn: (blob: Blob) => authService.updateMyAvatar(blob),
    onSuccess: async () => {
      await refreshProfileCaches(queryClient, refresh);
    },
  });
}

export function useRemoveMyAvatar() {
  const queryClient = useQueryClient();
  const { refresh } = useAuth();

  return useMutation({
    mutationFn: () => authService.removeMyAvatar(),
    onSuccess: async () => {
      await refreshProfileCaches(queryClient, refresh);
    },
  });
}
