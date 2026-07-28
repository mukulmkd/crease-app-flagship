import { z } from "zod";

import { chargeStatusSchema } from "@/lib/validations/enums";

export const submitPaymentProofSchema = z.object({
  chargeId: z.string().uuid(),
  utr: z.string().trim().min(4).max(64),
  screenshotPath: z.string().trim().min(1).max(512),
});

export const markOfflinePaidSchema = z.object({
  chargeIds: z.array(z.string().uuid()).min(1),
});

export const chargeStatusUpdateSchema = z.object({
  chargeId: z.string().uuid(),
  status: chargeStatusSchema,
});
