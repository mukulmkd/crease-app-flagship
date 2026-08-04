import { z } from "zod";

import {
  availabilityVoteSchema,
  carpoolVoteSchema,
  matchClassificationSchema,
  matchStartTimeSchema,
} from "@/lib/validations/enums";

export const createTournamentSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    plannedMatchCount: z.number().int().positive(),
    totalFeesInr: z.number().nonnegative(),
    feesPaidByUserId: z.string().uuid().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.totalFeesInr > 0 && !value.feesPaidByUserId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feesPaidByUserId"],
        message: "Select which Admin prepaid the tournament fees",
      });
    }
  });

export const updateTournamentSchema = z
  .object({
    tournamentId: z.string().uuid(),
    name: z.string().trim().min(2).max(120).optional(),
    plannedMatchCount: z.number().int().positive().optional(),
    totalFeesInr: z.number().nonnegative().optional(),
    feesPaidByUserId: z.string().uuid().nullable().optional(),
  })
  .superRefine((value, ctx) => {
    if (
      value.totalFeesInr !== undefined &&
      value.totalFeesInr > 0 &&
      value.feesPaidByUserId === null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["feesPaidByUserId"],
        message: "Select which Admin prepaid the tournament fees",
      });
    }
  });

export const createMatchSchema = z.object({
  matchDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  classification: matchClassificationSchema,
  tournamentId: z.string().uuid().nullable().optional(),
  opposition: z.string().trim().max(120).nullable().optional(),
  groundMapsUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  startTime: matchStartTimeSchema.nullable().optional(),
  matchFeesInr: z.number().nonnegative().nullable().optional(),
  pollsEnabled: z.boolean().optional(),
});

export const updateMatchSchema = z.object({
  matchId: z.string().uuid(),
  matchDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  classification: matchClassificationSchema.optional(),
  tournamentId: z.string().uuid().nullable().optional(),
  opposition: z.string().trim().max(120).nullable().optional(),
  groundMapsUrl: z
    .union([z.string().url(), z.literal(""), z.null()])
    .optional(),
  startTime: matchStartTimeSchema.nullable().optional(),
  matchFeesInr: z.number().nonnegative().nullable().optional(),
  pollsEnabled: z.boolean().optional(),
});

export const enableMatchPollsSchema = z.object({
  matchId: z.string().uuid(),
});

export const castAvailabilityVoteSchema = z.object({
  matchId: z.string().uuid(),
  vote: availabilityVoteSchema,
});

export const castCarpoolVoteSchema = z.object({
  matchId: z.string().uuid(),
  vote: carpoolVoteSchema,
});

export const freezePollsSchema = z.object({
  matchId: z.string().uuid(),
});

export const finalizePlayingSquadSchema = z.object({
  matchId: z.string().uuid(),
  // Bounds enforced in MatchService against production vs demo_mode limits.
  userIds: z.array(z.string().uuid()).min(1).max(12),
});

const carpoolRideInputSchema = z.object({
  driverUserId: z.string().uuid(),
  passengerUserIds: z.array(z.string().uuid()),
});

export const saveCarpoolAssignmentsSchema = z.object({
  matchId: z.string().uuid(),
  rides: z.array(carpoolRideInputSchema),
});

/** Demo mode: one-tap dummy driver + passengers from the playing squad. */
export const seedDemoCarpoolSchema = z.object({
  matchId: z.string().uuid(),
});

export const completeMatchSchema = z.object({
  matchId: z.string().uuid(),
});

export const cancelMatchSchema = z.object({
  matchId: z.string().uuid(),
});
