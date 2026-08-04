import { z } from "zod";

export const uuidSchema = z.string().uuid();

const paginationSchema = z.object({
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

const sortDirectionSchema = z.enum(["asc", "desc"]);

export const listQueryBaseSchema = paginationSchema.extend({
  sortBy: z.string().min(1).optional(),
  sortDirection: sortDirectionSchema.optional(),
});

export const optionalUrlSchema = z.string().url().nullable().optional();

export const nonEmptyStringSchema = z.string().trim().min(1);
