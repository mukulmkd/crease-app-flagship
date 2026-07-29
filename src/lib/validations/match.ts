import { z } from "zod";

import {
  availabilityVoteSchema,
  carpoolVoteSchema,
  matchClassificationSchema,
  matchStartTimeSchema,
  matchStatusSchema,
  pollTypeSchema,
  tournamentStatusSchema,
} from "@/lib/validations/enums";

export const createTournamentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  plannedMatchCount: z.number().int().positive(),
  totalFeesInr: z.number().nonnegative(),
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

export const confirmMatchSchema = z.object({
  matchId: z.string().uuid(),
});

export const updateMatchSchema = z.object({
  matchId: z.string().uuid(),
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

export const overrideVoteSchema = z.object({
  matchId: z.string().uuid(),
  userId: z.string().uuid(),
  availability: availabilityVoteSchema.optional(),
  carpool: carpoolVoteSchema.optional(),
});

export const freezePollsSchema = z.object({
  matchId: z.string().uuid(),
});

export const unfreezePollsSchema = freezePollsSchema;

export const finalizePlayingSquadSchema = z.object({
  matchId: z.string().uuid(),
  userIds: z.array(z.string().uuid()).min(11).max(12),
});

export const carpoolRideInputSchema = z.object({
  driverUserId: z.string().uuid(),
  passengerUserIds: z.array(z.string().uuid()),
});

export const saveCarpoolAssignmentsSchema = z.object({
  matchId: z.string().uuid(),
  rides: z.array(carpoolRideInputSchema),
});

export const completeMatchSchema = z.object({
  matchId: z.string().uuid(),
});

export const cancelMatchSchema = z.object({
  matchId: z.string().uuid(),
});

export const matchStatusUpdateSchema = z.object({
  matchId: z.string().uuid(),
  status: matchStatusSchema,
});

export const pollTypeOnlySchema = pollTypeSchema;
export const tournamentStatusOnlySchema = tournamentStatusSchema;
