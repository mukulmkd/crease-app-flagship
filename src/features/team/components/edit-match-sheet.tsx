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
import { useUpdateMatch } from "@/features/team/hooks";
import type { Match } from "@/types/models";

const editSchema = z.object({
  opposition: z.string().trim().max(120).optional(),
  groundMapsUrl: z.string().trim().optional(),
  matchFeesInr: z.number().nonnegative().optional(),
});

type EditValues = z.infer<typeof editSchema>;

type EditMatchSheetProps = {
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditMatchSheet({ match, open, onOpenChange }: EditMatchSheetProps) {
  const updateMatch = useUpdateMatch();
  const [startTime, setStartTime] = useState<"06:30:00" | "09:30:00">(
    match.startTime === "09:30:00" ? "09:30:00" : "06:30:00",
  );
  const form = useForm<EditValues>({
    resolver: zodResolver(editSchema),
    defaultValues: {
      opposition: match.opposition ?? "",
      groundMapsUrl: match.groundMapsUrl ?? "",
      matchFeesInr: match.matchFeesInr ?? undefined,
    },
  });

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
            Edit match
          </BottomSheetTitle>
          <BottomSheetDescription>
            Update fixture details before or after confirm.
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await updateMatch.mutateAsync({
                matchId: match.id,
                opposition: values.opposition || null,
                groundMapsUrl: values.groundMapsUrl || null,
                startTime,
                matchFeesInr: values.matchFeesInr ?? null,
              });
              toast.success({ title: "Match updated" });
              onOpenChange(false);
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <FormField
            label="Opposition"
            error={form.formState.errors.opposition?.message}
          >
            <Input {...form.register("opposition")} placeholder="Lions XI" />
          </FormField>
          <FormField
            label="Ground Maps URL"
            error={form.formState.errors.groundMapsUrl?.message}
          >
            <Input
              {...form.register("groundMapsUrl")}
              placeholder="https://maps.google.com/…"
            />
          </FormField>
          <div className="space-y-2">
            <p className="text-sm font-medium">Start time</p>
            <SegmentedControl
              aria-label="Start time"
              options={[
                { value: "06:30:00", label: "6:30 AM" },
                { value: "09:30:00", label: "9:30 AM" },
              ]}
              value={startTime}
              onValueChange={setStartTime}
            />
          </div>
          <FormField
            label="Match fees (INR)"
            error={form.formState.errors.matchFeesInr?.message}
          >
            <Input
              type="number"
              inputMode="decimal"
              {...form.register("matchFeesInr", { valueAsNumber: true })}
            />
          </FormField>
          <Button
            type="submit"
            className="w-full"
            loading={updateMatch.isPending}
          >
            Save changes
          </Button>
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { EditMatchSheet };
