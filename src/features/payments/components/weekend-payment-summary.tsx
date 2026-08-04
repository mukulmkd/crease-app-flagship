"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";

import { BodySm, StatusChip, Title } from "@/components/common";
import { ErrorState, LoadingState } from "@/components/feedback";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { SETTLEMENT_STATUS_LABELS } from "@/constants/domain/labels";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { OrganizerPaySheet } from "@/features/payments/components/organizer-pay-sheet";
import { OrganizerPayoutSection } from "@/features/payments/components/organizer-payout-section";
import {
  MatchFeesSection,
  PlayerSection,
  SummaryStat,
} from "@/features/payments/components/weekend-payment-summary-parts";
import {
  useAdminWeekendPaymentSummary,
  useConfirmSettlement,
  useNudgeUnpaidWeekendPlayers,
  useSetOrganizerPayoutMode,
} from "@/features/payments/hooks";
import { useMyMembership } from "@/features/team/hooks";
import {
  formatMatchDate,
  formatWeekendRange,
} from "@/features/team/lib/match-format";
import type { SettlementOrganizerPayout } from "@/types/models";
import { formatInrAmount } from "@/utils";

type WeekendPaymentSummaryViewProps = {
  settlementId: string;
};

/**
 * Admin weekend payment board — Sat / Sun / both rolled into one settlement.
 * Stays Collecting until organizer payout proofs are uploaded, then Confirm.
 */
function WeekendPaymentSummaryView({
  settlementId,
}: WeekendPaymentSummaryViewProps) {
  const router = useRouter();
  const membershipQuery = useMyMembership();
  const summaryQuery = useAdminWeekendPaymentSummary(settlementId);
  const nudge = useNudgeUnpaidWeekendPlayers();
  const setMode = useSetOrganizerPayoutMode();
  const confirmSettled = useConfirmSettlement();
  const [payTarget, setPayTarget] = useState<{
    payout: SettlementOrganizerPayout | null;
    shared: boolean;
    amountInr: number;
    label: string;
  } | null>(null);

  const canManage = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.SETTLEMENT_MANAGE,
  );
  const canNudge = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.NOTIFICATION_SEND,
  );

  if (membershipQuery.isLoading || summaryQuery.isLoading) {
    return <LoadingState label="Loading weekend summary" />;
  }

  if (!canManage) {
    return (
      <div className="space-y-4">
        <ErrorState
          title="Admins only"
          description="Weekend payment summary is available to team Admins."
        />
        <Button
          type="button"
          variant="tonal"
          className="w-full"
          onClick={() => router.push("/payments")}
        >
          Back to payments
        </Button>
      </div>
    );
  }

  if (summaryQuery.isError || !summaryQuery.data) {
    return (
      <ErrorState
        title="Could not load weekend summary"
        onRetry={() => void summaryQuery.refetch()}
      />
    );
  }

  const summary = summaryQuery.data;
  const range = formatWeekendRange(summary.weekStartDate, summary.weekEndDate);
  const matchLabel =
    summary.matches.length === 0
      ? "No completed fixtures billed yet"
      : summary.matches
          .map(
            (match) =>
              `${formatMatchDate(match.matchDate)} vs ${match.opposition?.trim() || "TBD"}`,
          )
          .join(" · ");

  const pendingOrganizer = summary.organizerPayouts.filter(
    (row) => row.status === "pending",
  );
  const paidOrganizer = summary.organizerPayouts.filter(
    (row) => row.status !== "pending",
  );
  const isSharedMode = summary.organizerPayouts.some(
    (row) => row.matchId == null,
  );
  const canConfirm =
    summary.settlement.status !== "settled" &&
    summary.playersCollected &&
    pendingOrganizer.length === 0;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-12 shrink-0"
          aria-label="Back to payments"
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/payments");
          }}
        >
          <ArrowLeft aria-hidden />
        </Button>
        <div className="min-w-0">
          <Title>Weekend summary</Title>
          <BodySm>{range}</BodySm>
        </div>
      </div>

      <section className="space-y-3 rounded-xl bg-surface-container-low px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex flex-wrap gap-2">
            <StatusChip
              status={
                summary.settlement.status === "settled"
                  ? "success"
                  : summary.settlement.status === "cancelled"
                    ? "danger"
                    : "pending"
              }
            >
              {SETTLEMENT_STATUS_LABELS[summary.settlement.status]}
            </StatusChip>
            {summary.settlement.status === "collecting" &&
            summary.playersCollected &&
            pendingOrganizer.length > 0 ? (
              <StatusChip status="warning">Organizer payout pending</StatusChip>
            ) : null}
          </div>
          <BodySm>{matchLabel}</BodySm>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <SummaryStat
            label="Billed"
            value={`₹${formatInrAmount(summary.billedTotalInr)}`}
          />
          <SummaryStat
            label="Collected"
            value={`₹${formatInrAmount(summary.paidTotalInr)}`}
            tone="success"
          />
          <SummaryStat
            label="Remaining"
            value={`₹${formatInrAmount(summary.unpaidTotalInr)}`}
            tone={summary.unpaidTotalInr > 0 ? "danger" : "neutral"}
          />
        </div>
        {canNudge && summary.unpaid.length > 0 ? (
          <Button
            type="button"
            className="w-full"
            loading={nudge.isPending}
            onClick={async () => {
              try {
                const result = await nudge.mutateAsync(settlementId);
                toast.success({
                  title: "Nudge sent to group",
                  description:
                    result.nudged > 0
                      ? `In-app alert to ${result.nudged} unpaid player${result.nudged === 1 ? "" : "s"}`
                      : "WhatsApp group message posted",
                });
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            }}
          >
            <Megaphone className="size-4" aria-hidden />
            Nudge unpaid in group
          </Button>
        ) : null}
      </section>

      <MatchFeesSection matches={summary.matches} />

      <PlayerSection
        title="Still owing"
        empty="Everyone has paid for this weekend."
        players={summary.unpaid}
        variant="unpaid"
      />
      <PlayerSection
        title="Paid"
        empty="No settled payments yet."
        players={summary.paid}
        variant="paid"
      />

      <OrganizerPayoutSection
        rangeLabel={range}
        matchCount={summary.matches.length}
        payouts={summary.organizerPayouts}
        pendingCount={pendingOrganizer.length}
        paidCount={paidOrganizer.length}
        isSharedMode={isSharedMode}
        matchDateById={
          new Map(
            summary.matches.map((match) => [match.matchId, match.matchDate]),
          )
        }
        weekStartDate={summary.weekStartDate}
        modeLoading={setMode.isPending}
        settled={summary.settlement.status === "settled"}
        onModeChange={async (mode) => {
          try {
            await setMode.mutateAsync({ settlementId, mode });
          } catch (error) {
            toast.error({ title: getMutationErrorMessage(error) });
          }
        }}
        onUpload={setPayTarget}
      />

      {summary.settlement.status !== "settled" ? (
        <Button
          type="button"
          className="w-full"
          loading={confirmSettled.isPending}
          disabled={!canConfirm}
          onClick={async () => {
            try {
              await confirmSettled.mutateAsync(settlementId);
              toast.success({ title: "Weekend settlement complete" });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Confirm settled
        </Button>
      ) : null}
      {!canConfirm &&
      summary.settlement.status !== "settled" &&
      summary.playersCollected ? (
        <BodySm>
          Upload organizer payment proof before confirming the weekend settled.
        </BodySm>
      ) : null}

      <OrganizerPaySheet
        key={
          payTarget
            ? payTarget.shared
              ? `shared:${settlementId}`
              : String(payTarget.payout?.id)
            : "closed"
        }
        payout={payTarget?.payout ?? null}
        settlementId={payTarget?.shared ? settlementId : null}
        shared={Boolean(payTarget?.shared)}
        amountInr={payTarget?.amountInr ?? 0}
        label={payTarget?.label ?? ""}
        onClose={() => setPayTarget(null)}
      />
    </div>
  );
}

export { WeekendPaymentSummaryView };
