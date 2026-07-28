"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Smartphone } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OTP_LENGTH, DEFAULT_COUNTRY_CODE } from "@/constants/auth";
import { getClientDevAuthOtp } from "@/constants/dev-auth";
import {
  getMutationErrorMessage,
  useSendOtp,
} from "@/features/auth/hooks/use-auth-mutations";
import { loginFormSchema, type LoginFormInput } from "@/lib/validations/auth";

/**
 * Stitch login — phone + Send OTP.
 */
function LoginForm() {
  const sendOtp = useSendOtp();
  const form = useForm<LoginFormInput>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { phone: "" },
    mode: "onSubmit",
  });

  const onSubmit = form.handleSubmit((values) => {
    sendOtp.mutate(values);
  });

  const devOtp = getClientDevAuthOtp();

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="space-y-2 pt-2">
        <h1 className="text-headline font-bold tracking-tight">
          Enter your number
        </h1>
        <p className="text-body-sm text-muted-foreground">
          We will send a {OTP_LENGTH}-digit code to verify.
        </p>
        {devOtp ? (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-caption text-muted-foreground">
            Dev logins:{" "}
            <span className="font-mono text-foreground">9999900001</span>{" "}
            (admin) …{" "}
            <span className="font-mono text-foreground">9999900004</span> · OTP{" "}
            <span className="font-mono text-foreground">{devOtp}</span>
          </p>
        ) : null}
      </div>

      <FormField
        label="Mobile number"
        htmlFor="phone"
        error={form.formState.errors.phone?.message}
      >
        <div className="flex h-14 items-center overflow-hidden rounded-2xl bg-surface-container-highest">
          <span className="flex h-full items-center gap-1 border-r border-outline-variant/50 px-4 text-sm font-semibold text-foreground">
            {DEFAULT_COUNTRY_CODE}
          </span>
          <Input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="000 000 0000"
            maxLength={10}
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

      <div className="flex flex-1 flex-col items-center justify-center py-6">
        <div className="flex size-28 items-center justify-center rounded-3xl bg-surface-container text-muted-foreground">
          <Smartphone className="size-14" strokeWidth={1.25} aria-hidden />
        </div>
      </div>

      {sendOtp.isError ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {getMutationErrorMessage(sendOtp.error)}
        </p>
      ) : null}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full rounded-full text-base"
        disabled={sendOtp.isPending}
      >
        {sendOtp.isPending ? "Sending…" : "Send OTP"}
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}

export { LoginForm };
