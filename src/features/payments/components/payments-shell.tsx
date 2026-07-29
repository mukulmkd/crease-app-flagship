"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BodySm, Title } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { FormField } from "@/components/forms/form-field";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useConfirmSettlement,
  useGenerateSettlement,
  useMarkOfflinePaid,
  useMyCharges,
  useOpenSettlements,
  useSubmitPaymentProof,
  useSubmitReimbursementProof,
  useTeamCharges,
  useTeamReimbursements,
} from "@/features/payments/hooks";
import { useMvpTeam, useMyMembership } from "@/features/team/hooks";
import type { SettlementCharge, SettlementReimbursement } from "@/types/models";
import { nextWeekendDates } from "@/utils";

const paySchema = z.object({
  utr: z.string().trim().min(4).max(64),
});

type PayValues = z.infer<typeof paySchema>;

function PaymentsShell() {
  const membershipQuery = useMyMembership();
  const teamQuery = useMvpTeam();
  const myCharges = useMyCharges();
  const isAdmin = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.SETTLEMENT_MANAGE,
  );
  const teamCharges = useTeamCharges(isAdmin);
  const reimbursements = useTeamReimbursements(isAdmin);
  const settlements = useOpenSettlements();
  const generate = useGenerateSettlement();
  const markOffline = useMarkOfflinePaid();
  const confirmSettled = useConfirmSettlement();
  const submitProof = useSubmitPaymentProof();
  const submitReimburse = useSubmitReimbursementProof();

  const [payCharge, setPayCharge] = useState<SettlementCharge | null>(null);
  const [reimburseRow, setReimburseRow] =
    useState<SettlementReimbursement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { utr: "" },
  });

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

  const pendingMine =
    myCharges.data?.filter((c) => c.status === "pending" && c.totalInr > 0) ??
    [];
  const pendingTeam =
    teamCharges.data?.filter((c) => c.status === "pending" && c.totalInr > 0) ??
    [];
  const pendingReimburse =
    reimbursements.data?.filter((r) => r.status === "pending") ?? [];
  const upi = teamQuery.data?.upiVpa;

  return (
    <div className="space-y-6">
      <div>
        <Title>Payments</Title>
        <BodySm>
          Weekend fees for completed matches with assigned carpool · UPI · UTR ·
          screenshot
        </BodySm>
      </div>

      <section className="space-y-3">
        <h2 className="font-heading text-xl font-bold uppercase">Your dues</h2>
        {myCharges.isLoading ? (
          <LoadingState label="Loading charges" />
        ) : pendingMine.length === 0 ? (
          <EmptyState
            title="Nothing due"
            description="You’re clear for open settlements."
          />
        ) : (
          <ul className="space-y-2">
            {pendingMine.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3"
              >
                <div>
                  <p className="font-heading text-lg font-bold tabular-nums">
                    ₹{c.totalInr}
                  </p>
                  <BodySm>
                    Match share ₹{c.matchFeeShareInr}
                    {c.carpoolFeeInr > 0
                      ? ` + carpool ₹${c.carpoolFeeInr}`
                      : ""}
                    {c.carpoolCreditInr > 0
                      ? ` − credit ₹${c.carpoolCreditInr}`
                      : ""}
                  </BodySm>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    setPayCharge(c);
                    setReimburseRow(null);
                    setFile(null);
                    form.reset({ utr: "" });
                  }}
                >
                  Pay
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isAdmin ? (
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-heading text-xl font-bold uppercase">
              Admin settlement
            </h2>
            <Button
              type="button"
              variant="tonal"
              size="sm"
              loading={generate.isPending}
              onClick={async () => {
                try {
                  await generate.mutateAsync(nextWeekendDates().saturday);
                  toast.success({ title: "Weekend settlement generated" });
                } catch (error) {
                  toast.error({ title: getMutationErrorMessage(error) });
                }
              }}
            >
              Generate weekend fees
            </Button>
          </div>
          <BodySm>
            Bills completed matches with a locked XI/XII and saved carpool
            assignment. Credits offset weekend dues; leftover driver credit is
            listed below.
          </BodySm>

          {pendingTeam.length > 0 ? (
            <ul className="space-y-2">
              {pendingTeam.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm"
                >
                  <span>
                    ₹{c.totalInr} · {String(c.userId).slice(0, 8)}…
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    loading={markOffline.isPending}
                    onClick={async () => {
                      try {
                        await markOffline.mutateAsync([c.id]);
                        toast.success({ title: "Marked offline paid" });
                      } catch (error) {
                        toast.error({
                          title: getMutationErrorMessage(error),
                        });
                      }
                    }}
                  >
                    Offline paid
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <BodySm>No pending team charges.</BodySm>
          )}

          <h3 className="font-heading text-lg font-bold uppercase">
            Owed to drivers
          </h3>
          {reimbursements.isLoading ? (
            <LoadingState label="Loading reimbursements" />
          ) : pendingReimburse.length === 0 ? (
            <BodySm>No pending driver reimbursements.</BodySm>
          ) : (
            <ul className="space-y-2">
              {pendingReimburse.map((row) => (
                <li
                  key={row.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-sm"
                >
                  <span>
                    ₹{row.amountInr} · {String(row.userId).slice(0, 8)}…
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="tonal"
                    onClick={() => {
                      setReimburseRow(row);
                      setPayCharge(null);
                      setFile(null);
                      form.reset({ utr: "" });
                    }}
                  >
                    Mark paid
                  </Button>
                </li>
              ))}
            </ul>
          )}

          {(settlements.data ?? []).map((s) => (
            <Button
              key={s.id}
              type="button"
              className="w-full"
              loading={confirmSettled.isPending}
              disabled={pendingTeam.length > 0 || pendingReimburse.length > 0}
              onClick={async () => {
                try {
                  await confirmSettled.mutateAsync(s.id);
                  toast.success({ title: "Settlement confirmed" });
                } catch (error) {
                  toast.error({ title: getMutationErrorMessage(error) });
                }
              }}
            >
              Confirm settled · {s.weekStartDate}
            </Button>
          ))}
        </section>
      ) : null}

      <BottomSheet
        open={Boolean(payCharge)}
        onOpenChange={(open) => {
          if (!open) setPayCharge(null);
        }}
      >
        <BottomSheetContent className="bg-surface-container-lowest">
          <BottomSheetHeader className="text-left">
            <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
              Submit payment
            </BottomSheetTitle>
            <BottomSheetDescription>
              {upi
                ? `Pay ₹${payCharge?.totalInr ?? 0} to ${upi}`
                : "Ask Admin to set the team UPI VPA in Settings."}
            </BottomSheetDescription>
          </BottomSheetHeader>
          <form
            className="space-y-4 px-4 pb-6"
            onSubmit={form.handleSubmit(async (values) => {
              if (!payCharge || !file) {
                toast.error({ title: "Add UTR and a screenshot" });
                return;
              }
              try {
                await submitProof.mutateAsync({
                  chargeId: payCharge.id,
                  utr: values.utr,
                  file,
                });
                toast.success({ title: "Payment submitted" });
                setPayCharge(null);
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            })}
          >
            <FormField label="UTR" error={form.formState.errors.utr?.message}>
              <Input {...form.register("utr")} autoComplete="off" />
            </FormField>
            <FormField label="Screenshot">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              loading={submitProof.isPending}
              disabled={!upi}
            >
              Mark paid
            </Button>
          </form>
        </BottomSheetContent>
      </BottomSheet>

      <BottomSheet
        open={Boolean(reimburseRow)}
        onOpenChange={(open) => {
          if (!open) setReimburseRow(null);
        }}
      >
        <BottomSheetContent className="bg-surface-container-lowest">
          <BottomSheetHeader className="text-left">
            <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
              Driver reimbursement
            </BottomSheetTitle>
            <BottomSheetDescription>
              Record offline payment of ₹{reimburseRow?.amountInr ?? 0} to the
              driver (UTR + screenshot).
            </BottomSheetDescription>
          </BottomSheetHeader>
          <form
            className="space-y-4 px-4 pb-6"
            onSubmit={form.handleSubmit(async (values) => {
              if (!reimburseRow || !file) {
                toast.error({ title: "Add UTR and a screenshot" });
                return;
              }
              try {
                await submitReimburse.mutateAsync({
                  reimbursementId: reimburseRow.id,
                  utr: values.utr,
                  file,
                });
                toast.success({ title: "Reimbursement recorded" });
                setReimburseRow(null);
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            })}
          >
            <FormField label="UTR" error={form.formState.errors.utr?.message}>
              <Input {...form.register("utr")} autoComplete="off" />
            </FormField>
            <FormField label="Screenshot">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              loading={submitReimburse.isPending}
            >
              Mark reimbursed
            </Button>
          </form>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}

export { PaymentsShell };
