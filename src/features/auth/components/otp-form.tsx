"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Clock } from "lucide-react";
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

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col gap-6">
      <div className="space-y-2 pt-2">
        <h1 className="text-headline font-bold tracking-tight">
          Verify Number
        </h1>
        <p className="text-body-sm text-muted-foreground">
          Enter the code sent to{" "}
          <span className="font-medium text-foreground">
            {phone ? formatPhoneDisplay(phone) : "your phone"}
          </span>
        </p>
        {getClientDevAuthOtp() ? (
          <p className="rounded-md bg-muted/60 px-3 py-2 text-caption text-muted-foreground">
            Dev OTP: use{" "}
            <span className="font-mono font-medium text-foreground">
              {getClientDevAuthOtp()}
            </span>{" "}
            for seeded numbers
          </p>
        ) : null}
      </div>

      <Controller
        control={form.control}
        name="token"
        render={({ field }) => (
          <InputOTP
            maxLength={OTP_LENGTH}
            value={field.value}
            onChange={field.onChange}
            containerClassName="justify-center"
            autoFocus
          >
            <InputOTPGroup className="gap-2">
              {Array.from({ length: OTP_LENGTH }).map((_, index) => (
                <InputOTPSlot
                  key={index}
                  index={index}
                  className="size-12 rounded-xl border-0 bg-surface-container-highest text-lg"
                />
              ))}
            </InputOTPGroup>
          </InputOTP>
        )}
      />

      {form.formState.errors.token ? (
        <p className="text-center text-sm text-destructive" role="alert">
          {form.formState.errors.token.message}
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
            "font-medium",
            canResend
              ? "text-primary"
              : "cursor-not-allowed text-muted-foreground/60",
          )}
          disabled={!canResend}
          onClick={() => {
            if (!phone) return;
            resend.mutate(phone, {
              onSuccess: () => setSecondsLeft(OTP_RESEND_SECONDS),
            });
          }}
        >
          Resend Code
        </button>
      </div>

      <div className="relative mt-auto overflow-hidden rounded-2xl bg-surface-container-high">
        <div className="flex min-h-36 items-end bg-gradient-to-br from-primary/80 to-primary-container p-4">
          <p className="text-sm font-medium text-primary-foreground">
            Secure verification for your Crease account
          </p>
        </div>
      </div>

      {(verify.isError || resend.isError) && (
        <p className="text-center text-sm text-destructive" role="alert">
          {getMutationErrorMessage(verify.error ?? resend.error)}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        className="h-14 w-full rounded-full text-base"
        disabled={verify.isPending}
      >
        {verify.isPending ? "Verifying…" : "Verify & Continue"}
        <ArrowRight aria-hidden />
      </Button>
    </form>
  );
}

export { OtpForm };
export type { OtpFormProps };
