"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { DEMO_PAYMENT_PROOF_PATH } from "@/constants/domain/enums";
import {
  getPaymentService,
  invalidateQueries,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { compressImageForUpload } from "@/utils/compress-image";
import { nextWeekendDates } from "@/utils";

export function useMyWeekendDues() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.myWeekendDues(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listMyWeekendDues(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useMatchCollectionStatuses() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.matchCollectionStatuses(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listMatchCollectionStatuses(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useAdminWeekendDues(enabled: boolean) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.adminWeekendDues(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listAdminWeekendDues(actor);
    },
    enabled: Boolean(actor && enabled),
  });
}

export function useAdminReimbursements(enabled: boolean) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.adminReimbursements(),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listAdminReimbursements(actor);
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

export function useWeekendFeeGenerateStatus(weekStartDate?: string) {
  const actor = useActor();
  const week = weekStartDate ?? nextWeekendDates().saturday;
  return useQuery({
    queryKey: queryKeys.payments.weekendFeeGenerateStatus(week),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().getWeekendFeeGenerateStatus(week, actor);
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

export function useAdminWeekendPaymentSummary(
  settlementId: string | undefined,
) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.payments.weekendSummary(settlementId ?? ""),
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().getAdminWeekendPaymentSummary(
        settlementId!,
        actor,
      );
    },
    enabled: Boolean(settlementId && actor),
  });
}

export function useNudgeUnpaidWeekendPlayers() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (settlementId: string) => {
      requireActor(actor);
      return getPaymentService().nudgeUnpaidWeekendPlayers(settlementId, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.notifications(client);
    },
  });
}

export function usePendingOrganizerPayouts(enabled = true) {
  const actor = useActor();
  return useQuery({
    queryKey: [...queryKeys.payments.all(), "organizer-payouts-pending"],
    queryFn: () => {
      requireActor(actor);
      return getPaymentService().listPendingOrganizerPayouts(actor);
    },
    enabled: Boolean(actor) && enabled,
  });
}

export function useSetOrganizerPayoutMode() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      settlementId: string;
      mode: "per_match" | "shared";
    }) => {
      requireActor(actor);
      return getPaymentService().setOrganizerPayoutMode(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.payments(client);
    },
  });
}

export function useSubmitOrganizerPayoutProof() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      payoutId: string;
      payeeName: string;
      utr: string;
      file: File;
    }) => {
      requireActor(actor);
      const blob = await compressImageForUpload(input.file);
      const path = `${actor!.actorId}/organizer-${input.payoutId}-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return getPaymentService().submitOrganizerPayoutProof(
        {
          payoutId: input.payoutId,
          payeeName: input.payeeName,
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

export function useSubmitSharedOrganizerPayoutProof() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      settlementId: string;
      payeeName: string;
      utr: string;
      file: File;
    }) => {
      requireActor(actor);
      const blob = await compressImageForUpload(input.file);
      const path = `${actor!.actorId}/organizer-shared-${input.settlementId}-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return getPaymentService().submitSharedOrganizerPayoutProof(
        {
          settlementId: input.settlementId,
          payeeName: input.payeeName,
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
    mutationFn: async (input: {
      chargeIds: string[];
      utr: string;
      file: File;
    }) => {
      requireActor(actor);
      const blob = await compressImageForUpload(input.file);
      const path = `${actor!.actorId}/offline-${input.chargeIds[0]}-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return getPaymentService().markOfflinePaid(
        {
          chargeIds: input.chargeIds,
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

/** Demo mode — offline mark with placeholder proof (no upload). */
export function useMarkDemoOfflinePaid() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { chargeIds: string[]; utr?: string }) => {
      requireActor(actor);
      return getPaymentService().markOfflinePaid(
        {
          chargeIds: input.chargeIds,
          utr: input.utr?.trim() || `OFFLINE${Date.now().toString().slice(-8)}`,
          screenshotPath: DEMO_PAYMENT_PROOF_PATH,
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
      await invalidateQueries.tournaments(client);
      await invalidateQueries.matches(client);
    },
  });
}

export function useSubmitWeekendPaymentProof() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      settlementId: string;
      utr: string;
      file: File;
    }) => {
      requireActor(actor);
      const blob = await compressImageForUpload(input.file);
      const path = `${actor!.actorId}/weekend-${input.settlementId}-${Date.now()}.jpg`;
      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase.storage
        .from("payment-proofs")
        .upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (error) throw error;
      return getPaymentService().submitWeekendPaymentProof(
        {
          settlementId: input.settlementId,
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

/** Demo mode only — marks a charge paid with a placeholder proof path. */

export function useSubmitDemoWeekendPaymentProof() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (input: { settlementId: string; utr?: string }) => {
      requireActor(actor);
      return getPaymentService().submitWeekendPaymentProof(
        {
          settlementId: input.settlementId,
          utr: input.utr?.trim() || `DEMO${Date.now().toString().slice(-8)}`,
          screenshotPath: DEMO_PAYMENT_PROOF_PATH,
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
