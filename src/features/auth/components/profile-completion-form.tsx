"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, UserRound } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_COUNTRY_CODE } from "@/constants/auth";
import {
  getMutationErrorMessage,
  useCompleteProfile,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  profileCompletionSchema,
  type ProfileCompletionInput,
} from "@/lib/validations/auth";
import { useAuth } from "@/providers/auth-provider";

function localDigitsFromE164(phone: string | null | undefined): string {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("91") && digits.length >= 12
    ? digits.slice(-10)
    : digits.slice(-10);
}

/**
 * Mandatory first-login profile — full name + confirmed mobile (+91).
 */
function ProfileCompletionForm() {
  const { user } = useAuth();
  const complete = useCompleteProfile();
  const form = useForm<ProfileCompletionInput>({
    resolver: zodResolver(profileCompletionSchema),
    defaultValues: {
      name: "",
      phone: localDigitsFromE164(user?.phone),
    },
    mode: "onChange",
  });

  useEffect(() => {
    const digits = localDigitsFromE164(user?.phone);
    if (digits && !form.getValues("phone")) {
      form.setValue("phone", digits, { shouldValidate: true });
    }
    const existingName =
      (typeof user?.user_metadata?.full_name === "string"
        ? user.user_metadata.full_name
        : null) ||
      (typeof user?.user_metadata?.name === "string"
        ? user.user_metadata.name
        : null);
    if (existingName && !form.getValues("name")) {
      form.setValue("name", existingName, { shouldValidate: true });
    }
  }, [user, form]);

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

      <FormField
        label="Mobile number"
        htmlFor="phone"
        error={form.formState.errors.phone?.message}
        required
      >
        <div className="flex h-14 items-center overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15">
          <span className="flex h-full items-center gap-1 border-r border-outline-variant/50 px-4 text-sm font-semibold text-foreground">
            {DEFAULT_COUNTRY_CODE}
          </span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="0000000000"
            maxLength={10}
            aria-required
            className="h-full rounded-none border-0 bg-transparent focus-visible:border-0 focus-visible:bg-transparent focus-visible:ring-0"
            {...form.register("phone", {
              onChange: (event) => {
                event.target.value = event.target.value
                  .replace(/\D/g, "")
                  .slice(0, 10);
              },
            })}
          />
        </div>
      </FormField>

      {complete.isError ? (
        <p className="text-sm text-destructive" role="alert">
          {getMutationErrorMessage(complete.error)}
        </p>
      ) : null}

      <Button
        type="submit"
        className="touch-target mt-auto h-14 w-full rounded-2xl"
        loading={complete.isPending}
        disabled={!form.formState.isValid}
      >
        Continue
      </Button>
    </form>
  );
}

export { ProfileCompletionForm };
