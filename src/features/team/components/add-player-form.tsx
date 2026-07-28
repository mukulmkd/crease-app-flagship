"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddTeamMember } from "@/features/team/hooks";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";

const schema = z.object({
  phone: z.string().trim().min(10).max(15),
  fullName: z.string().trim().min(2).max(100).optional().or(z.literal("")),
  role: z.enum(["admin", "player"]),
});

type FormValues = z.infer<typeof schema>;

/**
 * Admin adds a squad member by phone — gate for app access.
 */
function AddPlayerForm({ onAdded }: { onAdded?: () => void }) {
  const addMember = useAddTeamMember();
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { phone: "", fullName: "", role: "player" },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await addMember.mutateAsync({
        phone: values.phone,
        fullName: values.fullName || undefined,
        role: values.role,
      });
      toast.success({ title: "Player added" });
      form.reset({ phone: "", fullName: "", role: "player" });
      onAdded?.();
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <FormField
        label="Mobile number"
        htmlFor="phone"
        error={form.formState.errors.phone?.message}
      >
        <Input
          id="phone"
          inputMode="tel"
          autoComplete="tel"
          placeholder="9999900003"
          className="h-12"
          {...form.register("phone")}
        />
      </FormField>

      <FormField
        label="Full name (optional)"
        htmlFor="fullName"
        error={form.formState.errors.fullName?.message}
      >
        <Input
          id="fullName"
          className="h-12"
          placeholder="Player name"
          {...form.register("fullName")}
        />
      </FormField>

      <FormField label="Role" htmlFor="role">
        <Controller
          control={form.control}
          name="role"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger id="role" className="h-12 w-full">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="player">Player</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </FormField>

      <BodySm>
        Until a player is added here, they cannot access the app after login.
      </BodySm>

      <Button
        type="submit"
        className="touch-target h-12 w-full"
        disabled={addMember.isPending}
      >
        {addMember.isPending ? "Adding…" : "Add player"}
      </Button>
    </form>
  );
}

export { AddPlayerForm };
