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
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { PaymentProofFields } from "@/features/payments/components/payment-proof-fields";
import { useSubmitReimbursementProof } from "@/features/payments/hooks";
import type { SettlementReimbursement } from "@/types/models";
import { formatInrAmount } from "@/utils";

const paySchema = z.object({
  utr: z.string().trim().min(4).max(64),
});

type PayValues = z.infer<typeof paySchema>;

type ReimbursementPaySheetProps = {
  row: SettlementReimbursement | null;
  playerName: string | null;
  onClose: () => void;
};

function ReimbursementPaySheet({
  row,
  playerName,
  onClose,
}: ReimbursementPaySheetProps) {
  const submitReimburse = useSubmitReimbursementProof();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { utr: "" },
  });

  return (
    <BottomSheet
      open={Boolean(row)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Reimbursement
          </BottomSheetTitle>
          <BottomSheetDescription>
            Record offline payment of ₹{formatInrAmount(row?.amountInr ?? 0)} to{" "}
            {playerName?.trim() || "the player"} (UTR + screenshot required).
            Covers leftover carpool or tournament prepaid credit.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            if (!row || !file) {
              toast.error({ title: "Add UTR and a screenshot" });
              return;
            }
            try {
              await submitReimburse.mutateAsync({
                reimbursementId: row.id,
                utr: values.utr,
                file,
              });
              toast.success({ title: "Reimbursement recorded" });
              onClose();
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <PaymentProofFields
            utrRegistration={form.register("utr")}
            utrError={form.formState.errors.utr?.message}
            onFileChange={setFile}
          />
          <Button
            type="submit"
            className="w-full"
            loading={submitReimburse.isPending}
            disabled={!file}
          >
            Mark reimbursed
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { ReimbursementPaySheet };
