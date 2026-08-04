"use client";

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
  const form = useForm<AskValues>({
    resolver: zodResolver(askSchema),
    defaultValues: {
      amountPerPlayerInr: FUND_CONTRIBUTION_ASK_INR,
      note: "",
    },
  });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
            Ask for funds
          </BottomSheetTitle>
          <BottomSheetDescription>
            Posts the per-player amount to the WhatsApp group and notifies
            everyone in-app.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
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
              onOpenChange(false);
              form.reset({
                amountPerPlayerInr: FUND_CONTRIBUTION_ASK_INR,
                note: "",
              });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <FormField
            label="Amount per player (INR)"
            error={form.formState.errors.amountPerPlayerInr?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              {...form.register("amountPerPlayerInr", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Note" error={form.formState.errors.note?.message}>
            <Input
              {...form.register("note")}
              placeholder="Optional message for the group"
            />
          </FormField>
          <Button type="submit" className="w-full" loading={sendAsk.isPending}>
            Send to WhatsApp group
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { AskForFundsSheet };
