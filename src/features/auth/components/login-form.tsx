"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";

import { FormField } from "@/components/forms/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEFAULT_COUNTRY_CODE } from "@/constants/auth";
import { getClientDevAuthOtp } from "@/constants/dev-auth";
import {
  getMutationErrorMessage,
  useSendOtp,
} from "@/features/auth/hooks/use-auth-mutations";
import { loginFormSchema, type LoginFormInput } from "@/lib/validations/auth";

/**
 * Member-only mobile OTP login.
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
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-7">
      <div className="space-y-4 pt-8">
        <div aria-hidden className="flex items-center gap-2">
          <span className="h-1 w-12 bg-primary" />
          <span className="h-1 w-4 bg-tertiary" />
        </div>
        <h1 className="font-heading text-5xl leading-[0.95] font-semibold tracking-tight">
          Your team.
          <br />
          Match ready.
        </h1>
        <p className="max-w-sm text-base leading-6 text-muted-foreground">
          Weekend matches, squad availability and payments — in one place.
        </p>
        {devOtp ? (
          <p className="rounded-lg border border-outline-variant bg-surface-container-low px-3 py-2 text-caption text-muted-foreground">
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
            placeholder="000 000 0000"
            maxLength={10}
            aria-invalid={Boolean(form.formState.errors.phone) || undefined}
            aria-describedby={
              form.formState.errors.phone ? "phone-error" : undefined
            }
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

      <div className="mt-auto overflow-hidden rounded-2xl bg-clubhouse p-5 text-white">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-tertiary" aria-hidden />
          <div>
            <p className="font-heading text-xl font-semibold">Members only</p>
            <p className="mt-1 text-sm leading-5 text-white/70">
              Only active Ranches Thunders members can enter.
            </p>
          </div>
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
        className="h-14 w-full text-base"
        loading={sendOtp.isPending}
      >
        Send OTP
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}

export { LoginForm };
