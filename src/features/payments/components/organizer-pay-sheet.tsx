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
import { FormField } from "@/components/forms/form-field";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { PaymentProofFields } from "@/features/payments/components/payment-proof-fields";
import {
  useSubmitOrganizerPayoutProof,
  useSubmitSharedOrganizerPayoutProof,
} from "@/features/payments/hooks";
import type { SettlementOrganizerPayout } from "@/types/models";
import { formatInrAmount } from "@/utils";

const paySchema = z.object({
  payeeName: z.string().trim().min(2).max(120),
  utr: z.string().trim().min(4).max(64),
});

type PayValues = z.infer<typeof paySchema>;

type OrganizerPaySheetProps = {
  /** Per-match payout — omit when paying the whole weekend to one organizer. */
  payout: SettlementOrganizerPayout | null;
  settlementId: string | null;
  shared: boolean;
  amountInr: number;
  label: string;
  demoMode?: boolean;
  onClose: () => void;
};

/**
 * Admin records UTR + screenshot of the match-fee payout to the organizer.
 */
function OrganizerPaySheet({
  payout,
  settlementId,
  shared,
  amountInr,
  label,
  onClose,
}: OrganizerPaySheetProps) {
  const submitOne = useSubmitOrganizerPayoutProof();
  const submitShared = useSubmitSharedOrganizerPayoutProof();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { payeeName: "", utr: "" },
  });

  const open = shared ? Boolean(settlementId) : Boolean(payout);
  const busy = submitOne.isPending || submitShared.isPending;

  function handleOpenChange(next: boolean) {
    if (!next) {
      form.reset({ payeeName: "", utr: "" });
      setFile(null);
      onClose();
    }
  }

  return (
    <BottomSheet open={open} onOpenChange={handleOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Pay organizer
          </BottomSheetTitle>
          <BottomSheetDescription>
            Upload proof of ₹{formatInrAmount(amountInr)} paid to the organizer
            for {label}. Settlement stays Collecting until this is done.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            if (!file) {
              toast.error({ title: "Add UTR and a screenshot" });
              return;
            }
            try {
              if (shared && settlementId) {
                await submitShared.mutateAsync({
                  settlementId,
                  payeeName: values.payeeName,
                  utr: values.utr,
                  file,
                });
              } else if (payout) {
                await submitOne.mutateAsync({
                  payoutId: String(payout.id),
                  payeeName: values.payeeName,
                  utr: values.utr,
                  file,
                });
              }
              toast.success({ title: "Organizer payment recorded" });
              form.reset({ payeeName: "", utr: "" });
              setFile(null);
              onClose();
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <FormField
            label="Organizer name"
            error={form.formState.errors.payeeName?.message}
          >
            <Input
              {...form.register("payeeName")}
              placeholder="Tournament / ground organizer"
              autoComplete="off"
            />
          </FormField>
          <PaymentProofFields
            utrRegistration={form.register("utr")}
            utrError={form.formState.errors.utr?.message}
            onFileChange={setFile}
          />
          <Button
            type="submit"
            className="w-full"
            loading={busy}
            disabled={!file}
          >
            Mark organizer paid
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { OrganizerPaySheet };
