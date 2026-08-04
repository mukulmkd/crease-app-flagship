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
import { useTeamMembers, useUpdateTournament } from "@/features/team/hooks";
import type { TournamentSummary } from "@/types/models";

const schema = z
  .object({
    name: z.string().trim().min(2, "Name is required").max(120),
    plannedMatchCount: z.number().int().positive(),
    totalFeesInr: z.number().nonnegative(),
    feesPaidByUserId: z.string().uuid().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.totalFeesInr > 0 && !value.feesPaidByUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feesPaidByUserId"],
        message: "Select which Admin prepaid the fees",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

type EditTournamentSheetProps = {
  summary: TournamentSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditTournamentSheet({
  summary,
  open,
  onOpenChange,
}: EditTournamentSheetProps) {
  const update = useUpdateTournament();
  const adminsQuery = useTeamMembers({ role: "admin", status: "active" });
  const admins = adminsQuery.data?.items ?? [];
  const minPlanned = summary.settledMatchCount;
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: summary.tournament.name,
      plannedMatchCount: summary.tournament.plannedMatchCount,
      totalFeesInr: summary.tournament.totalFeesInr,
      feesPaidByUserId: summary.tournament.feesPaidByUserId
        ? String(summary.tournament.feesPaidByUserId)
        : null,
    },
  });

  const totalFees = useWatch({ control: form.control, name: "totalFeesInr" });
  const feesPaidByUserId = useWatch({
    control: form.control,
    name: "feesPaidByUserId",
  });

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: summary.tournament.name,
      plannedMatchCount: summary.tournament.plannedMatchCount,
      totalFeesInr: summary.tournament.totalFeesInr,
      feesPaidByUserId: summary.tournament.feesPaidByUserId
        ? String(summary.tournament.feesPaidByUserId)
        : null,
    });
  }, [open, summary, form]);

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
            Edit tournament
          </BottomSheetTitle>
          <BottomSheetDescription>
            Update details while matches remain. Planned count cannot go below{" "}
            {minPlanned} already settled.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            if (values.plannedMatchCount < minPlanned) {
              form.setError("plannedMatchCount", {
                message: `Must be at least ${minPlanned}`,
              });
              return;
            }
            try {
              await update.mutateAsync({
                tournamentId: String(summary.tournament.id),
                ...values,
                feesPaidByUserId:
                  values.totalFeesInr > 0 ? values.feesPaidByUserId : null,
              });
              toast.success({ title: "Tournament updated" });
              onOpenChange(false);
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <FormField label="Name" error={form.formState.errors.name?.message}>
            <Input {...form.register("name")} />
          </FormField>
          <FormField
            label="Number of matches"
            error={form.formState.errors.plannedMatchCount?.message}
          >
            <Input
              type="number"
              inputMode="numeric"
              {...form.register("plannedMatchCount", { valueAsNumber: true })}
            />
          </FormField>
          <FormField
            label="Total tournament fees (₹)"
            error={form.formState.errors.totalFeesInr?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              {...form.register("totalFeesInr", { valueAsNumber: true })}
            />
          </FormField>
          {totalFees > 0 ? (
            <FormField
              label="Fees prepaid by"
              error={form.formState.errors.feesPaidByUserId?.message}
            >
              <Select
                value={feesPaidByUserId ?? undefined}
                onValueChange={(value) =>
                  form.setValue("feesPaidByUserId", value, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger aria-label="Fees prepaid by" className="w-full">
                  <SelectValue placeholder="Select Admin" />
                </SelectTrigger>
                <SelectContent>
                  {admins.map((admin) => (
                    <SelectItem
                      key={String(admin.userId)}
                      value={String(admin.userId)}
                    >
                      {admin.profile.fullName?.trim() || "Admin"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
          <Button type="submit" className="w-full" loading={update.isPending}>
            Save changes
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { EditTournamentSheet };
