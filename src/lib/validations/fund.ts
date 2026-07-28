import { z } from "zod";

import { FUND_CONTRIBUTION_ASK_INR } from "@/constants/domain/enums";

export const addExpenseSchema = z.object({
  amountInr: z.number().positive(),
  category: z.string().trim().min(1).max(64).default("other"),
  note: z.string().trim().max(500).nullable().optional(),
});

export const fundOpeningBalanceSchema = z.object({
  amountInr: z.number(),
  note: z.string().trim().max(500).optional(),
});

export const createContributionAskSchema = z.object({
  amountPerPlayerInr: z.number().positive().default(FUND_CONTRIBUTION_ASK_INR),
  note: z.string().trim().max(500).nullable().optional(),
});
