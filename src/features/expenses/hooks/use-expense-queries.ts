"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFundService,
  invalidateQueries,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";

export function useExpenseHub() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.fund.hub(),
    queryFn: () => {
      requireActor(actor);
      return getFundService().getExpenseHub(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useAddExpense() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amountInr: number;
      category?: string;
      note?: string | null;
    }) => {
      requireActor(actor);
      return getFundService().addExpense(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.fund(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useRecordContribution() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      userId: string;
      amountInr: number;
      note?: string | null;
      askId?: string | null;
    }) => {
      requireActor(actor);
      return getFundService().recordContribution(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.fund(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useSendContributionAsk() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amountPerPlayerInr: number;
      note?: string | null;
    }) => {
      requireActor(actor);
      return getFundService().createAndSendContributionAsk(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.fund(client);
      await invalidateQueries.notifications(client);
      await invalidateQueries.dashboard(client);
    },
  });
}
