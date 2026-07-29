"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getFundService,
  getPaymentService,
  invalidateQueries,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { compressImageForUpload } from "@/utils/compress-image";
import { nextWeekendDates } from "@/utils";

export function useMyCharges() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.myCharges(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listMyCharges(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useTeamCharges(enabled: boolean) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.teamCharges(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listTeamCharges(actor);
    },
    enabled: Boolean(actor && enabled),
  });
}

export function useTeamReimbursements(enabled: boolean) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.reimbursements(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listTeamReimbursements(actor);
    },
    enabled: Boolean(actor && enabled),
  });
}

export function useOpenSettlements() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.settlements(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listOpenSettlements(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useMatchSettlementReport(matchId: string | undefined) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.matchReport(matchId ?? ""),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().getMatchSettlementReport(matchId!, actor);
    },
    enabled: Boolean(matchId && actor),
  });
}

export function useGenerateSettlement() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (weekStartDate?: string) => {
      requireActor(actor);
      const week = weekStartDate ?? nextWeekendDates().saturday;
      return getPaymentService().generateWeekendSettlement(week, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.payments(client);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useMarkOfflinePaid() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (chargeIds: string[]) => {
      requireActor(actor);
      return getPaymentService().markOfflinePaid(chargeIds, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.payments(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useConfirmSettlement() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => {
      requireActor(actor);
      return getPaymentService().confirmSettlementSettled(settlementId, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.payments(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useSubmitPaymentProof() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      chargeId: string;
      utr: string;
      file: File;
    }) => {
      requireActor(actor);
      const blob = await compressImageForUpload(input.file);
      const path = `${actor!.actorId}/${input.chargeId}-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return getPaymentService().submitPaymentProof(
        {
          chargeId: input.chargeId,
          utr: input.utr,
          screenshotPath: path,
        },
        actor!,
      );
    },
    onSuccess: async () => {
      await invalidateQueries.payments(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useSubmitReimbursementProof() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      reimbursementId: string;
      utr: string;
      file: File;
    }) => {
      requireActor(actor);
      const blob = await compressImageForUpload(input.file);
      const path = `${actor!.actorId}/reimburse-${input.reimbursementId}-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return getPaymentService().submitReimbursementProof(
        {
          reimbursementId: input.reimbursementId,
          utr: input.utr,
          screenshotPath: path,
        },
        actor!,
      );
    },
    onSuccess: async () => {
      await invalidateQueries.payments(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useFundBalance() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.fund.balance(),
    queryFn: () => {
      requireActor(actor);
      return getFundService().getBalance(actor);
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

export function useSendContributionAsk() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      amountPerPlayerInr?: number;
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
