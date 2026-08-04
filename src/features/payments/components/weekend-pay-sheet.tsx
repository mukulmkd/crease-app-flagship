"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { StatusChip } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { MVP_TEAM } from "@/constants/domain/enums";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { PaymentProofFields } from "@/features/payments/components/payment-proof-fields";
import { UpiPayActions } from "@/features/payments/components/upi-pay-actions";
import {
  useSubmitDemoWeekendPaymentProof,
  useSubmitWeekendPaymentProof,
} from "@/features/payments/hooks";
import {
  formatMatchDate,
  formatWeekendRange,
} from "@/features/team/lib/match-format";
import type { MyWeekendDues } from "@/services/payment.service";
import { formatInrAmount } from "@/utils";

const paySchema = z.object({
  utr: z.string().trim().min(4).max(64),
});

type PayValues = z.infer<typeof paySchema>;

type WeekendPaySheetProps = {
  weekend: MyWeekendDues | null;
  upi: string | null | undefined;
  /** Display name for UPI payee (defaults to Ranches Thunders). */
  payeeName?: string | null;
  demoMode: boolean;
  onClose: () => void;
};

function WeekendPaySheet({
  weekend,
  upi,
  payeeName,
  demoMode,
  onClose,
}: WeekendPaySheetProps) {
  const submitWeekend = useSubmitWeekendPaymentProof();
  const submitDemoWeekend = useSubmitDemoWeekendPaymentProof();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { utr: "" },
  });

  const amountInr = weekend?.totalDueInr ?? 0;
  const resolvedPayee = payeeName?.trim() || MVP_TEAM.name;
  const note = weekend
    ? `Crease ${formatWeekendRange(weekend.weekStartDate, weekend.weekEndDate)}`
    : "Crease weekend fees";

  return (
    <BottomSheet
      open={Boolean(weekend)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Pay weekend
          </BottomSheetTitle>
          <BottomSheetDescription>
            {weekend
              ? `₹${formatInrAmount(amountInr)} for ${formatWeekendRange(weekend.weekStartDate, weekend.weekEndDate)}`
              : null}
          </BottomSheetDescription>
        </BottomSheetHeader>
        <div className="space-y-4 px-4 pb-6">
          {weekend && weekend.lines.length > 1 ? (
            <ul className="space-y-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-muted-foreground">
              {weekend.lines.map((line) => (
                <li key={line.charge.id} className="flex justify-between gap-2">
                  <span>
                    vs {line.opposition?.trim() || "TBD"} ·{" "}
                    {formatMatchDate(line.matchDate)}
                  </span>
                  <span className="tabular-nums">
                    ₹{formatInrAmount(line.charge.totalInr)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          {!demoMode || upi ? (
            <UpiPayActions
              vpa={upi}
              amountInr={amountInr}
              payeeName={resolvedPayee}
              note={note}
            />
          ) : null}

          <form
            className="space-y-4 border-t border-outline-variant/40 pt-4"
            onSubmit={form.handleSubmit(async (values) => {
              if (!weekend || !file) {
                toast.error({ title: "Add UTR and a screenshot" });
                return;
              }
              try {
                await submitWeekend.mutateAsync({
                  settlementId: weekend.settlementId,
                  utr: values.utr,
                  file,
                });
                toast.success({
                  title: "Payment proof submitted",
                  description: "Your weekend payment is marked paid.",
                });
                onClose();
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            })}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                  Step 2 · Submit proof
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Step 1 is the UPI payment above.
                </p>
              </div>
              <StatusChip status="pending">Payment pending</StatusChip>
            </div>
            <PaymentProofFields
              utrRegistration={form.register("utr")}
              utrError={form.formState.errors.utr?.message}
              onFileChange={setFile}
            />
            <Button
              type="submit"
              variant="tonal"
              className="w-full"
              loading={submitWeekend.isPending}
              disabled={!upi && !demoMode}
            >
              Submit proof · ₹{formatInrAmount(amountInr)}
            </Button>
            {demoMode ? (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                loading={submitDemoWeekend.isPending}
                onClick={async () => {
                  if (!weekend) return;
                  try {
                    await submitDemoWeekend.mutateAsync({
                      settlementId: weekend.settlementId,
                      utr: form.getValues("utr") || undefined,
                    });
                    toast.success({ title: "Demo weekend payment submitted" });
                    onClose();
                  } catch (error) {
                    toast.error({ title: getMutationErrorMessage(error) });
                  }
                }}
              >
                Use dummy proof
              </Button>
            ) : null}
          </form>
        </div>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { WeekendPaySheet };
