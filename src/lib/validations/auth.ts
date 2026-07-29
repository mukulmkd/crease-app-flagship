import { z } from "zod";

import { OTP_LENGTH } from "@/constants/auth";

const localPhoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");

export const loginFormSchema = z.object({
  phone: localPhoneSchema,
});

export const otpVerifySchema = z.object({
  phone: z.string().min(10),
  token: z
    .string()
    .length(OTP_LENGTH, `OTP must be ${OTP_LENGTH} digits`)
    .regex(
      new RegExp(`^[0-9]{${OTP_LENGTH}}$`),
      "OTP must contain only numbers",
    ),
});

export const profileCompletionSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),
  phone: localPhoneSchema,
});

/** Editable profile fields after onboarding — phone stays identity-bound. */
export const updateOwnProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Enter your full name")
    .max(100, "Name is too long"),
});

export type LoginFormInput = z.infer<typeof loginFormSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type ProfileCompletionInput = z.infer<typeof profileCompletionSchema>;
export type UpdateOwnProfileInput = z.infer<typeof updateOwnProfileSchema>;
