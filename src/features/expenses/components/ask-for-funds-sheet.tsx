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
import { FUND_CONTRIBUTION_ASK_INR } from "@/constants/domain/enums";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useSendContributionAsk } from "@/features/expenses/hooks";
import { formatInrAmount } from "@/utils";

const askSchema = z.object({
  amountPerPlayerInr: z.number().positive("Enter amount per player"),
  note: z.string().trim().max(500).optional(),
});

type AskValues = z.infer<typeof askSchema>;

type AskForFundsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function AskForFundsSheet({ open, onOpenChange }: AskForFundsSheetProps) {
  const sendAsk = useSendContributionAsk();
  const [reviewValues, setReviewValues] = useState<AskValues | null>(null);
  const form = useForm<AskValues>({
    resolver: zodResolver(askSchema),
    defaultValues: {
      amountPerPlayerInr: FUND_CONTRIBUTION_ASK_INR,
      note: "",
    },
  });

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setReviewValues(null);
        onOpenChange(nextOpen);
      }}
    >
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            {reviewValues ? "Confirm fund ask" : "Ask for funds"}
          </BottomSheetTitle>
          <BottomSheetDescription>
            {reviewValues
              ? "This broadcast goes to the whole team and cannot be recalled."
              : "Review the amount before notifying the WhatsApp group and everyone in-app."}
          </BottomSheetDescription>
        </BottomSheetHeader>
        {reviewValues ? (
          <div className="space-y-4 px-4 pb-6">
            <section className="rounded-xl bg-surface-container-low p-4">
              <p className="text-xs font-semibold text-muted-foreground">
                Every active player will be asked for
              </p>
              <p className="mt-1 font-heading text-3xl font-semibold tabular-nums">
                ₹{formatInrAmount(reviewValues.amountPerPlayerInr)}
              </p>
              {reviewValues.note ? (
                <p className="mt-3 text-sm">{reviewValues.note}</p>
              ) : null}
            </section>
            <Button
              type="button"
              className="w-full"
              loading={sendAsk.isPending}
              onClick={async () => {
                const values = reviewValues;
                if (!values) return;
                try {
                  const result = await sendAsk.mutateAsync({
                    amountPerPlayerInr: values.amountPerPlayerInr,
                    note: values.note || null,
                  });
                  toast.success({
                    title: result.whatsappSent
                      ? "Ask sent to WhatsApp group"
                      : "Ask saved · WhatsApp not configured",
                    description: result.whatsappSent
                      ? undefined
                      : "In-app alerts were sent. Add a WhatsApp notify URL in Settings.",
                  });
                  setReviewValues(null);
                  onOpenChange(false);
                  form.reset({
                    amountPerPlayerInr: FUND_CONTRIBUTION_ASK_INR,
                    note: "",
                  });
                } catch (error) {
                  toast.error({ title: getMutationErrorMessage(error) });
                }
              }}
            >
              Confirm and broadcast
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={sendAsk.isPending}
              onClick={() => setReviewValues(null)}
            >
              Back
            </Button>
          </div>
        ) : (
          <form
            className="space-y-4 px-4 pb-6"
            onSubmit={form.handleSubmit((values) => {
              setReviewValues(values);
            })}
          >
            <FormField
              label="Amount per player (INR)"
              error={form.formState.errors.amountPerPlayerInr?.message}
            >
              <Input
                type="number"
                inputMode="decimal"
                {...form.register("amountPerPlayerInr", {
                  valueAsNumber: true,
                })}
              />
            </FormField>
            <FormField label="Note" error={form.formState.errors.note?.message}>
              <Input
                {...form.register("note")}
                placeholder="Optional message for the group"
              />
            </FormField>
            <Button
              type="submit"
              className="w-full"
              loading={sendAsk.isPending}
            >
              Review broadcast
            </Button>
          </form>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { AskForFundsSheet };
