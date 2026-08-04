"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { FormField } from "@/components/forms";
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
import { useCreateTournament, useTeamMembers } from "@/features/team/hooks";

const schema = z
  .object({
    name: z.string().trim().min(2, "Tournament name is required").max(120),
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

type CreateTournamentSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (tournamentId: string) => void;
};

function CreateTournamentSheet({
  open,
  onOpenChange,
  onCreated,
}: CreateTournamentSheetProps) {
  const createTournament = useCreateTournament();
  const adminsQuery = useTeamMembers({ role: "admin", status: "active" });
  const admins = adminsQuery.data?.items ?? [];
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      plannedMatchCount: 5,
      totalFeesInr: 0,
      feesPaidByUserId: null,
    },
  });

  const totalFees = useWatch({ control: form.control, name: "totalFeesInr" });
  const feesPaidByUserId = useWatch({
    control: form.control,
    name: "feesPaidByUserId",
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const tournament = await createTournament.mutateAsync({
        ...values,
        feesPaidByUserId:
          values.totalFeesInr > 0 ? values.feesPaidByUserId : null,
      });
      onCreated(tournament.id);
      form.reset();
      onOpenChange(false);
      toast.success({ title: "Tournament created" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            New tournament
          </BottomSheetTitle>
        </BottomSheetHeader>
        <form onSubmit={onSubmit} className="space-y-5 px-4 pb-6" noValidate>
          <FormField
            label="Tournament name"
            htmlFor="tournament-name"
            error={form.formState.errors.name?.message}
          >
            <Input
              id="tournament-name"
              autoFocus
              aria-invalid={Boolean(form.formState.errors.name)}
              {...form.register("name")}
            />
          </FormField>
          <FormField label="Number of matches" htmlFor="tournament-count">
            <Input
              id="tournament-count"
              type="number"
              inputMode="numeric"
              {...form.register("plannedMatchCount", { valueAsNumber: true })}
            />
          </FormField>
          <FormField label="Total tournament fees (₹)" htmlFor="tournament-fee">
            <Input
              id="tournament-fee"
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
          <p className="text-sm leading-5 text-muted-foreground">
            Entry fees are prepaid by an Admin (total ÷ matches, then split by
            squad). That Admin&apos;s share is credited per match; leftover
            credit is reimbursed with proof. Separate match/ground fees are
            collected per fixture and paid to organizers.
          </p>
          <Button
            type="submit"
            className="h-14 w-full"
            loading={createTournament.isPending}
          >
            Save tournament
          </Button>
          <BottomSheetClose asChild>
            <Button type="button" variant="ghost" className="w-full">
              Cancel
            </Button>
          </BottomSheetClose>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { CreateTournamentSheet };
