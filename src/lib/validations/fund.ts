import { z } from "zod";

import { FUND_CONTRIBUTION_ASK_INR } from "@/constants/domain/enums";

export const addExpenseSchema = z.object({
  amountInr: z.number().positive(),
  category: z.string().trim().min(1).max(64).default("other"),
  note: z.string().trim().max(500).nullable().optional(),
});

export const createContributionAskSchema = z.object({
  amountPerPlayerInr: z
    .number()
    .positive("Enter amount per player")
    .default(FUND_CONTRIBUTION_ASK_INR),
  note: z.string().trim().max(500).nullable().optional(),
});

export const recordContributionSchema = z.object({
  userId: z.string().uuid(),
  amountInr: z.number().positive("Enter a contribution amount"),
  note: z.string().trim().max(500).nullable().optional(),
  askId: z.string().uuid().nullable().optional(),
});
