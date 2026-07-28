import { z } from "zod";

import { CURRENCY_CODES, DEFAULT_CURRENCY } from "@/constants/domain/enums";

export const uuidSchema = z.string().uuid();

export const isoDateTimeSchema = z
  .string()
  .datetime({ offset: true })
  .or(z.string().datetime());

/** YYYY-MM-DD */
export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");

export const paginationSchema = z.object({
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const sortDirectionSchema = z.enum(["asc", "desc"]);

export const listQueryBaseSchema = paginationSchema.extend({
  sortBy: z.string().min(1).optional(),
  sortDirection: sortDirectionSchema.optional(),
});

export const currencySchema = z.enum(CURRENCY_CODES);

export const amountPaiseSchema = z
  .number()
  .int("Amount must be whole paise")
  .nonnegative("Amount cannot be negative");

export const positiveAmountPaiseSchema = z
  .number()
  .int("Amount must be whole paise")
  .positive("Amount must be greater than zero");

export const moneySchema = z.object({
  amountPaise: amountPaiseSchema,
  currency: currencySchema.default(DEFAULT_CURRENCY),
});

export const optionalUrlSchema = z.string().url().nullable().optional();

export const nonEmptyStringSchema = z.string().trim().min(1);

export type PaginationInput = z.infer<typeof paginationSchema>;
export type ListQueryBaseInput = z.infer<typeof listQueryBaseSchema>;
export type MoneyInput = z.infer<typeof moneySchema>;
