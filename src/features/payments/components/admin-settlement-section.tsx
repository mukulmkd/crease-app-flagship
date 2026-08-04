"use client";

import { useState } from "react";

import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  AdminWeekendGroup,
  type WeekendAdminBucket,
} from "@/features/payments/components/admin-weekend-group";
import { OfflinePaySheet } from "@/features/payments/components/offline-pay-sheet";
import { ReimbursementPaySheet } from "@/features/payments/components/reimbursement-pay-sheet";
import {
  useAdminWeekendDues,
  useAdminReimbursements,
  useConfirmSettlement,
  useGenerateSettlement,
  useOpenSettlements,
  usePendingOrganizerPayouts,
  useWeekendFeeGenerateStatus,
} from "@/features/payments/hooks";
import { useMvpTeam } from "@/features/team/hooks";
import type { AdminPlayerDues } from "@/services/payment.service";
import type { SettlementReimbursement } from "@/types/models";
import { nextWeekendDates, weekendContainingDate } from "@/utils";

function AdminSettlementSection() {
  const teamQuery = useMvpTeam();
  const demoMode = Boolean(teamQuery.data?.demoMode);
  const thisSaturday = nextWeekendDates().saturday;
  const duesQuery = useAdminWeekendDues(true);
  const reimbursements = useAdminReimbursements(true);
  const settlements = useOpenSettlements();
  const organizerPayouts = usePendingOrganizerPayouts(true);
  const generateStatusQuery = useWeekendFeeGenerateStatus(thisSaturday);
  const generate = useGenerateSettlement();
  const confirmSettled = useConfirmSettlement();

  const [offlinePlayer, setOfflinePlayer] = useState<AdminPlayerDues | null>(
    null,
  );
  const [reimburse, setReimburse] = useState<{
    row: SettlementReimbursement;
    fullName: string | null;
  } | null>(null);

  const players = duesQuery.data ?? [];
  const pendingReimburse = reimbursements.data ?? [];
  const openSettlements = settlements.data ?? [];
  const generateStatus = generateStatusQuery.data;

  const settlementIds = [
    ...new Set([
      ...players.map((player) => player.settlementId),
      ...pendingReimburse.map((row) => String(row.reimbursement.settlementId)),
      ...openSettlements.map((row) => String(row.id)),
    ]),
  ];

  const weekends: WeekendAdminBucket[] = settlementIds
    .map((settlementId) => {
      const weekendPlayers = players.filter(
        (p) => p.settlementId === settlementId,
      );
      const first = weekendPlayers[0];
      const settlement =
        openSettlements.find((s) => String(s.id) === settlementId) ?? null;
      const weekStartDate =
        first?.weekStartDate ?? settlement?.weekStartDate ?? settlementId;
      const week = weekendContainingDate(weekStartDate);
      return {
        settlementId,
        weekStartDate: week.saturday,
        weekEndDate: first?.weekEndDate ?? week.sunday,
        players: weekendPlayers,
        reimbursements: pendingReimburse.filter(
          (row) => String(row.reimbursement.settlementId) === settlementId,
        ),
        settlement,
        organizerPendingCount: (organizerPayouts.data ?? []).filter(
          (row) => String(row.settlementId) === settlementId,
        ).length,
      };
    })
    .filter(
      (weekend) =>
        weekend.players.length > 0 || weekend.reimbursements.length > 0,
    )
    .sort((a, b) => b.weekStartDate.localeCompare(a.weekStartDate));

  const buttonLabel = generateStatus?.label ?? "Generate weekend fees";
  const buttonDisabled =
    generate.isPending ||
    generateStatusQuery.isLoading ||
    Boolean(generateStatus?.disabled);

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-heading text-xl font-bold uppercase">
          Admin settlement
        </h2>
        <div className="flex max-w-xs flex-col items-end gap-1">
          <Button
            type="button"
            variant="tonal"
            size="sm"
            loading={generate.isPending}
            disabled={buttonDisabled}
            onClick={async () => {
              try {
                await generate.mutateAsync(thisSaturday);
                toast.success({
                  title:
                    generateStatus?.label === "Refresh weekend fees"
                      ? "Weekend fees refreshed"
                      : "Weekend settlement generated",
                });
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            }}
          >
            {buttonLabel}
          </Button>
          {generateStatus?.hint ? (
            <p className="text-right text-[0.65rem] text-muted-foreground">
              {generateStatus.hint}
            </p>
          ) : null}
        </div>
      </div>
      <BodySm>
        Collect player fees, then upload organizer payment proofs on Summary
        before confirming settled.
      </BodySm>

      {duesQuery.isLoading ||
      reimbursements.isLoading ||
      organizerPayouts.isLoading ? (
        <LoadingState label="Loading team dues" />
      ) : weekends.length === 0 ? (
        <BodySm>No team charges generated yet.</BodySm>
      ) : (
        <ul className="space-y-3">
          {weekends.map((weekend, index) => (
            <li key={weekend.settlementId}>
              <AdminWeekendGroup
                weekend={weekend}
                defaultOpen={index === 0}
                confirmPending={confirmSettled.isPending}
                onMarkOffline={setOfflinePlayer}
                onReimburse={setReimburse}
                onConfirm={async () => {
                  try {
                    await confirmSettled.mutateAsync(weekend.settlementId);
                    toast.success({ title: "Settlement confirmed" });
                  } catch (error) {
                    toast.error({ title: getMutationErrorMessage(error) });
                  }
                }}
              />
            </li>
          ))}
        </ul>
      )}

      <OfflinePaySheet
        key={
          offlinePlayer
            ? `${offlinePlayer.settlementId}:${offlinePlayer.userId}`
            : "closed"
        }
        player={offlinePlayer}
        demoMode={demoMode}
        onClose={() => setOfflinePlayer(null)}
      />

      <ReimbursementPaySheet
        key={reimburse?.row.id ?? "reimburse-closed"}
        row={reimburse?.row ?? null}
        playerName={reimburse?.fullName ?? null}
        onClose={() => setReimburse(null)}
      />
    </section>
  );
}

export { AdminSettlementSection };
