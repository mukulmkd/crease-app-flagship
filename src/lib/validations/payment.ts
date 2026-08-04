import { z } from "zod";

/** One UPI proof applied to every pending charge for a weekend settlement. */
export const submitWeekendPaymentProofSchema = z.object({
  settlementId: z.string().uuid(),
  utr: z.string().trim().min(4).max(64),
  screenshotPath: z.string().trim().min(1).max(512),
});

export const submitReimbursementProofSchema = z.object({
  reimbursementId: z.string().uuid(),
  utr: z.string().trim().min(4).max(64),
  screenshotPath: z.string().trim().min(1).max(512),
});

export const submitOrganizerPayoutProofSchema = z.object({
  payoutId: z.string().uuid(),
  payeeName: z.string().trim().min(2).max(120),
  utr: z.string().trim().min(4).max(64),
  screenshotPath: z.string().trim().min(1).max(512),
});

/** One organizer for the whole weekend — applies the same proof to all pending payouts. */
export const submitSharedOrganizerPayoutProofSchema = z.object({
  settlementId: z.string().uuid(),
  payeeName: z.string().trim().min(2).max(120),
  utr: z.string().trim().min(4).max(64),
  screenshotPath: z.string().trim().min(1).max(512),
});

export const setOrganizerPayoutModeSchema = z.object({
  settlementId: z.string().uuid(),
  mode: z.enum(["per_match", "shared"]),
});

export const markOfflinePaidSchema = z.object({
  chargeIds: z.array(z.string().uuid()).min(1),
  utr: z.string().trim().min(4).max(64),
  screenshotPath: z.string().trim().min(1).max(512),
});

export const generateSettlementSchema = z.object({
  weekStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const confirmSettlementSchema = z.object({
  settlementId: z.string().uuid(),
});

/** Admin nudge unpaid players for one weekend settlement. */
export const nudgeUnpaidWeekendSchema = z.object({
  settlementId: z.string().uuid(),
});
