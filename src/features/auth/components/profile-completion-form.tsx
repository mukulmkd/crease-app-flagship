"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, UserRound } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMutationErrorMessage,
  useCompleteProfile,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  profileCompletionSchema,
  type ProfileCompletionInput,
} from "@/lib/validations/auth";

/**
 * Mandatory first-login profile — name only for MVP.
 */
function ProfileCompletionForm() {
  const complete = useCompleteProfile();
  const form = useForm<ProfileCompletionInput>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = form.handleSubmit((values) => {
    complete.mutate(values);
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="flex flex-col items-center gap-2 pt-2">
        <div className="relative">
          <div className="flex size-28 items-center justify-center rounded-full bg-surface-container-highest text-muted-foreground">
            <UserRound className="size-14" strokeWidth={1.25} aria-hidden />
          </div>
          <span className="absolute right-0 bottom-0 flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
            <Camera className="size-5" aria-hidden />
          </span>
        </div>
        <p className="text-sm text-muted-foreground">Add Profile Photo</p>
        <p className="text-caption text-muted-foreground">
          Photo upload comes with storage setup
        </p>
      </div>

      <FormField
        label="Full Name"
        htmlFor="name"
        error={form.formState.errors.name?.message}
        required
      >
        <Input
          id="name"
          autoComplete="name"
          placeholder="Enter your full name"
          className="h-14 rounded-2xl border-0 bg-surface-container-highest px-4 focus-visible:border-b-2"
          {...form.register("name")}
        />
      </FormField>

      {complete.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getMutationErrorMessage(complete.error)}
        </p>
      ) : null}

      <Button
        type="submit"
        className="touch-target mt-auto h-14 w-full rounded-2xl"
        disabled={complete.isPending || !form.formState.isValid}
      >
        {complete.isPending ? "Saving…" : "Continue"}
      </Button>
    </form>
  );
}

export { ProfileCompletionForm };
