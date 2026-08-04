import { z } from "zod";

import {
  membershipRoleSchema,
  membershipStatusSchema,
} from "@/lib/validations/enums";
import {
  listQueryBaseSchema,
  nonEmptyStringSchema,
  optionalUrlSchema,
  uuidSchema,
} from "@/lib/validations/common";

/** MVP: team is seeded; settings update only. */
export const updateTeamSettingsSchema = z.object({
  name: nonEmptyStringSchema.min(2).max(80).optional(),
  logoUrl: optionalUrlSchema,
  upiVpa: z.string().trim().min(3).max(120).nullable().optional(),
  whatsappNotifyUrl: optionalUrlSchema,
  demoMode: z.boolean().optional(),
});

/** Exactly one Admin collects fees; UPI VPA is required on assign. */
export const assignPaymentCollectorSchema = z.object({
  userId: uuidSchema,
  upiVpa: z.string().trim().min(3).max(120),
});

export const addTeamMemberSchema = z.object({
  teamId: uuidSchema,
  phone: z.string().trim().min(8).max(20),
  fullName: nonEmptyStringSchema.min(2).max(100).optional(),
  role: membershipRoleSchema.default("player"),
});

export const updateMembershipSchema = z.object({
  membershipId: uuidSchema,
  role: membershipRoleSchema.optional(),
  status: membershipStatusSchema.optional(),
});

export const listMembersQuerySchema = listQueryBaseSchema.extend({
  teamId: uuidSchema,
  status: membershipStatusSchema.optional(),
  role: membershipRoleSchema.optional(),
});
