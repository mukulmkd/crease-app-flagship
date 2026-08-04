"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useRecordContribution } from "@/features/expenses/hooks";
import type { PlayerFundContributionSummary } from "@/types/models";

const recordSchema = z.object({
  userId: z.string().uuid("Pick a player"),
  amountInr: z.number().positive("Enter an amount"),
  note: z.string().trim().max(500).optional(),
});

type RecordValues = z.infer<typeof recordSchema>;

type RecordContributionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  players: PlayerFundContributionSummary[];
  initialUserId?: string | null;
};

function RecordContributionSheet({
  open,
  onOpenChange,
  players,
  initialUserId = null,
}: RecordContributionSheetProps) {
  const record = useRecordContribution();
  const form = useForm<RecordValues>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      userId: initialUserId ?? "",
      amountInr: undefined,
      note: "",
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        userId: initialUserId ?? "",
        amountInr: undefined,
        note: "",
      });
    }
  }, [open, initialUserId, form]);

  const selectedUserId = useWatch({ control: form.control, name: "userId" });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Record contribution
          </BottomSheetTitle>
          <BottomSheetDescription>
            Credits the funds when a player has paid offline.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await record.mutateAsync({
                userId: values.userId,
                amountInr: values.amountInr,
                note: values.note || null,
              });
              toast.success({ title: "Contribution recorded" });
              onOpenChange(false);
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <FormField
            label="Player"
            error={form.formState.errors.userId?.message}
          >
            <Select
              value={selectedUserId || undefined}
              onValueChange={(value) =>
                form.setValue("userId", value, { shouldValidate: true })
              }
            >
              <SelectTrigger aria-label="Player" className="h-12 w-full">
                <SelectValue placeholder="Select player" />
              </SelectTrigger>
              <SelectContent>
                {players.map((player) => (
                  <SelectItem key={player.userId} value={String(player.userId)}>
                    {player.fullName?.trim() || "Unnamed player"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
          <FormField
            label="Amount (INR)"
            error={form.formState.errors.amountInr?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              {...form.register("amountInr", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Note" error={form.formState.errors.note?.message}>
            <Input {...form.register("note")} />
          </FormField>
          <Button type="submit" className="w-full" loading={record.isPending}>
            Save contribution
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { RecordContributionSheet };
