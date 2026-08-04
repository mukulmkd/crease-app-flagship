"use client";

import dynamic from "next/dynamic";

import { BodySm, Title } from "@/components/common";
import { ErrorState, LoadingState } from "@/components/feedback";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { YourDuesSection } from "@/features/payments/components/your-dues-section";
import { useMyWeekendDues } from "@/features/payments/hooks";
import { useMvpTeam, useMyMembership } from "@/features/team/hooks";
import { formatInrAmount } from "@/utils";

const AdminSettlementSection = dynamic(
  () =>
    import("@/features/payments/components/admin-settlement-section").then(
      (module) => module.AdminSettlementSection,
    ),
  {
    loading: () => (
      <LoadingState variant="cards" label="Loading settlement administration" />
    ),
  },
);

function PaymentsShell() {
  const membershipQuery = useMyMembership();
  const teamQuery = useMvpTeam();
  const duesQuery = useMyWeekendDues();
  const isAdmin = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.SETTLEMENT_MANAGE,
  );

  if (membershipQuery.isLoading) {
    return <LoadingState label="Loading payments" />;
  }

  if (membershipQuery.isError) {
    return (
      <ErrorState
        title="Access denied"
        onRetry={() => void membershipQuery.refetch()}
      />
    );
  }

  const upi = teamQuery.data?.upiVpa;
  const payeeName = teamQuery.data?.name;
  const demoMode = Boolean(teamQuery.data?.demoMode);
  const isCollector =
    Boolean(teamQuery.data?.collectorUserId) &&
    Boolean(membershipQuery.data?.userId) &&
    String(teamQuery.data?.collectorUserId) ===
      String(membershipQuery.data?.userId);

  const weekends = duesQuery.data ?? [];
  const totalDueInr = weekends
    .filter((weekend) => !weekend.collectorAutoSettled)
    .reduce((sum, weekend) => sum + weekend.totalDueInr, 0);

  return (
    <div className="space-y-6 pb-2">
      <div className="space-y-1">
        <Title>Payments</Title>
        <BodySm className="text-muted-foreground">
          {demoMode
            ? "Demo mode · weekend fees · dummy UTR proof available"
            : "Weekend fees for completed matches with assigned carpool · UPI · UTR · screenshot"}
        </BodySm>
      </div>

      <section
        aria-label="Total dues summary"
        className="rounded-2xl bg-surface-container-low px-4 py-5"
      >
        <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Total dues
        </p>
        {duesQuery.isLoading ? (
          <p className="mt-1 font-heading text-3xl font-semibold text-muted-foreground tabular-nums">
            …
          </p>
        ) : (
          <p
            className={
              totalDueInr > 0
                ? "mt-1 font-heading text-4xl font-semibold text-destructive tabular-nums"
                : "mt-1 font-heading text-4xl font-semibold tabular-nums"
            }
          >
            ₹{formatInrAmount(totalDueInr)}
          </p>
        )}
        <BodySm className="mt-1">
          {totalDueInr > 0
            ? "Yet to be paid across open weekends"
            : isCollector
              ? "Nothing to pay — collector dues auto-settle"
              : "You’re clear across open weekends"}
        </BodySm>
      </section>

      <YourDuesSection
        upi={upi}
        payeeName={payeeName}
        demoMode={demoMode}
        isCollector={isCollector}
      />

      {isAdmin ? <AdminSettlementSection /> : null}
    </div>
  );
}

export { PaymentsShell };
