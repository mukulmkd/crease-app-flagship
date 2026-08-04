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
import { SegmentedControl } from "@/components/forms/segmented-control";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useAddExpense } from "@/features/expenses/hooks";

const expenseSchema = z.object({
  amountInr: z.number().positive("Enter an amount"),
  category: z.string().trim().min(1).max(64),
  note: z.string().trim().max(500).optional(),
});

type ExpenseValues = z.infer<typeof expenseSchema>;
type ExpenseCategoryPreset = "ground" | "kit" | "travel" | "other";

const CATEGORY_OPTIONS = [
  { value: "ground" as const, label: "Ground" },
  { value: "kit" as const, label: "Kit" },
  { value: "travel" as const, label: "Travel" },
  { value: "other" as const, label: "Other" },
];

type AddExpenseSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function AddExpenseSheet({ open, onOpenChange }: AddExpenseSheetProps) {
  const addExpense = useAddExpense();
  const [categoryPreset, setCategoryPreset] =
    useState<ExpenseCategoryPreset>("ground");
  const form = useForm<ExpenseValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { amountInr: undefined, category: "ground", note: "" },
  });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Add expense
          </BottomSheetTitle>
          <BottomSheetDescription>
            Debits the Ranches Thunders fund balance immediately.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await addExpense.mutateAsync({
                amountInr: values.amountInr,
                category: values.category,
                note: values.note || null,
              });
              toast.success({ title: "Expense recorded" });
              onOpenChange(false);
              setCategoryPreset("ground");
              form.reset({
                amountInr: undefined,
                category: "ground",
                note: "",
              });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
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
          <FormField
            label="Category"
            error={
              categoryPreset === "other"
                ? undefined
                : form.formState.errors.category?.message
            }
          >
            <SegmentedControl
              size="sm"
              aria-label="Expense category"
              options={CATEGORY_OPTIONS}
              value={categoryPreset}
              onValueChange={(value) => {
                setCategoryPreset(value);
                form.setValue("category", value === "other" ? "" : value);
                form.clearErrors("category");
              }}
            />
          </FormField>
          {categoryPreset === "other" ? (
            <FormField
              label="Other category"
              error={form.formState.errors.category?.message}
            >
              <Input
                {...form.register("category")}
                placeholder="e.g. refreshments"
                autoFocus
              />
            </FormField>
          ) : null}
          <FormField label="Note" error={form.formState.errors.note?.message}>
            <Input {...form.register("note")} />
          </FormField>
          <Button
            type="submit"
            className="w-full"
            loading={addExpense.isPending}
          >
            Save expense
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { AddExpenseSheet };
