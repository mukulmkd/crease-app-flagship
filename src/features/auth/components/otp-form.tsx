"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Clock, Info, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { OTP_LENGTH, OTP_RESEND_SECONDS } from "@/constants/auth";
import { getClientDevAuthOtp } from "@/constants/dev-auth";
import {
  getMutationErrorMessage,
  readAuthPhone,
  useResendOtp,
  useVerifyOtp,
} from "@/features/auth/hooks/use-auth-mutations";
import { formatPhoneDisplay } from "@/lib/auth/utils";
import { otpVerifySchema, type OtpVerifyInput } from "@/lib/validations/auth";
import { cn } from "@/utils";

type OtpFormProps = {
  phone: string;
};

function OtpForm({ phone: phoneProp }: OtpFormProps) {
  const phone = phoneProp || readAuthPhone() || "";
  const verify = useVerifyOtp();
  const resend = useResendOtp();
  const [secondsLeft, setSecondsLeft] = useState(OTP_RESEND_SECONDS);

  const form = useForm<OtpVerifyInput>({
    resolver: zodResolver(otpVerifySchema),
    defaultValues: { phone, token: "" },
  });

  useEffect(() => {
    form.setValue("phone", phone);
  }, [phone, form]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [secondsLeft]);

  const timerLabel = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const ss = String(secondsLeft % 60).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const onSubmit = form.handleSubmit((values) => {
    verify.mutate(values);
  });

  const canResend = secondsLeft <= 0 && !resend.isPending;
  const tokenError = form.formState.errors.token?.message;
  const otpDescribedBy = [
    tokenError ? "otp-token-error" : null,
    verify.isError ? "otp-verify-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-7">
      <div className="space-y-3 pt-8">
        <div aria-hidden className="h-1 w-16 bg-tertiary" />
        <h1 className="font-heading text-4xl font-semibold tracking-tight">
          Check your phone
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Enter the code sent to{" "}
          <span className="font-medium text-foreground">
            {phone ? formatPhoneDisplay(phone) : "your phone"}
          </span>
        </p>
        {getClientDevAuthOtp() ? (
          <p className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-3 text-sm text-muted-foreground">
            <Info className="size-4 shrink-0 text-primary" aria-hidden />
            Demo OTP:{" "}
            <span className="font-mono font-medium text-foreground">
              {getClientDevAuthOtp()}
            </span>
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="otp-token" className="sr-only">
          Verification code
        </label>
        <Controller
          control={form.control}
          name="token"
          render={({ field }) => (
            <InputOTP
              id="otp-token"
              maxLength={OTP_LENGTH}
              value={field.value}
              onChange={field.onChange}
              containerClassName="justify-center"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-invalid={Boolean(tokenError) || verify.isError || undefined}
              aria-describedby={otpDescribedBy || undefined}
              autoFocus
            >
              <InputOTPGroup className="gap-1">
                {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    aria-invalid={
                      Boolean(tokenError) || verify.isError || undefined
                    }
                    className="size-11 rounded-xl border border-outline-variant bg-surface-container-lowest text-lg focus-within:border-primary focus-within:bg-accent"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>
          )}
        />
      </div>

      {tokenError ? (
        <p
          id="otp-token-error"
          className="text-center text-sm text-destructive"
          role="alert"
        >
          {tokenError}
        </p>
      ) : null}

      <div className="flex flex-col items-center gap-1 text-sm text-muted-foreground">
        <p className="inline-flex items-center gap-1.5">
          <Clock className="size-4" aria-hidden />
          {secondsLeft > 0 ? (
            <>
              Resend code in <span className="font-medium">{timerLabel}</span>
            </>
          ) : (
            "You can resend the code now"
          )}
        </p>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 font-medium",
            canResend || resend.isPending
              ? "text-primary"
              : "cursor-not-allowed text-muted-foreground/60",
          )}
          disabled={!canResend}
          aria-busy={resend.isPending || undefined}
          onClick={() => {
            if (!phone) return;
            resend.mutate(phone, {
              onSuccess: () => setSecondsLeft(OTP_RESEND_SECONDS),
            });
          }}
        >
          {resend.isPending ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden />
          ) : null}
          {resend.isPending ? "Sending…" : "Resend Code"}
        </button>
        <Button asChild type="button" variant="link" className="h-10">
          <Link href="/login">Change number</Link>
        </Button>
      </div>

      <div className="mt-auto border-y border-outline-variant py-4">
        <p className="text-center text-sm text-muted-foreground">
          Secure verification for Ranches Thunders
        </p>
      </div>

      {(verify.isError || resend.isError) && (
        <p
          id={verify.isError ? "otp-verify-error" : undefined}
          className="text-center text-sm text-destructive"
          role="alert"
        >
          {getMutationErrorMessage(verify.error ?? resend.error)}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full text-base"
        loading={verify.isPending}
      >
        Verify & Continue
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}

export { OtpForm };
export type { OtpFormProps };
