/**
 * Dev-only phone OTP fixtures for Ranches Thunders MVP.
 * Used by seed script + optional AUTH_DEV_FIXED_OTP bypass (no SMS provider).
 * Opt-in via env on local and Vercel; remove AUTH_DEV_FIXED_OTP /
 * NEXT_PUBLIC_AUTH_DEV_OTP to disable.
 */

import { MVP_TEAM } from "@/constants/domain/enums";

export const DEV_AUTH_FIXED_OTP = "123456";

export type DevAuthPersona = {
  phone: string;
  localPhone: string;
  fullName: string;
  email: string;
  membershipRole: "admin" | "player";
};

export const DEV_TEAM = {
  id: MVP_TEAM.id,
  name: MVP_TEAM.name,
  slug: MVP_TEAM.slug,
} as const;

export const DEV_TEAM_ID = MVP_TEAM.id;

export const DEV_AUTH_PERSONAS: readonly DevAuthPersona[] = [
  {
    phone: "+919999900001",
    localPhone: "9999900001",
    fullName: "Demo Admin",
    email: "demo.admin@crease.dev",
    membershipRole: "admin",
  },
  {
    phone: "+919999900002",
    localPhone: "9999900002",
    fullName: "Rohit Sharma",
    email: "rohit.sharma@crease.dev",
    membershipRole: "admin",
  },
  {
    phone: "+919999900003",
    localPhone: "9999900003",
    fullName: "Virat Kohli",
    email: "virat.kohli@crease.dev",
    membershipRole: "player",
  },
  {
    phone: "+919999900004",
    localPhone: "9999900004",
    fullName: "Jasprit Bumrah",
    email: "jasprit.bumrah@crease.dev",
    membershipRole: "player",
  },
] as const;

export function isDevAuthPhone(phone: string): boolean {
  const normalized = phone.replace(/\s/g, "");
  return DEV_AUTH_PERSONAS.some(
    (p) =>
      p.phone === normalized ||
      p.localPhone === normalized.replace(/\D/g, "").slice(-10),
  );
}

export function isClientDevAuthEnabled(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_AUTH_DEV_OTP?.trim());
}

export function getClientDevAuthOtp(): string | null {
  const value = process.env.NEXT_PUBLIC_AUTH_DEV_OTP?.trim();
  return value || null;
}
