/**
 * Zod schemas for MVP domain enums.
 */
import { z } from "zod";

import {
  AUDIT_ACTIONS,
  AVAILABILITY_VOTES,
  CARPOOL_VOTES,
  CHARGE_STATUSES,
  CONTRIBUTION_ASK_STATUSES,
  CURRENCY_CODES,
  FUND_TXN_DIRECTIONS,
  MATCH_CLASSIFICATIONS,
  MATCH_START_TIMES,
  MATCH_STATUSES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
  NOTIFICATION_TYPES,
  POLL_STATUSES,
  POLL_TYPES,
  SETTLEMENT_STATUSES,
  TOURNAMENT_STATUSES,
} from "@/constants/domain/enums";

export const membershipRoleSchema = z.enum(MEMBERSHIP_ROLES);
export const membershipStatusSchema = z.enum(MEMBERSHIP_STATUSES);
export const matchClassificationSchema = z.enum(MATCH_CLASSIFICATIONS);
export const matchStatusSchema = z.enum(MATCH_STATUSES);
export const matchStartTimeSchema = z.enum(MATCH_START_TIMES);
export const tournamentStatusSchema = z.enum(TOURNAMENT_STATUSES);
export const pollTypeSchema = z.enum(POLL_TYPES);
export const pollStatusSchema = z.enum(POLL_STATUSES);
export const availabilityVoteSchema = z.enum(AVAILABILITY_VOTES);
export const carpoolVoteSchema = z.enum(CARPOOL_VOTES);
export const settlementStatusSchema = z.enum(SETTLEMENT_STATUSES);
export const chargeStatusSchema = z.enum(CHARGE_STATUSES);
export const fundTxnDirectionSchema = z.enum(FUND_TXN_DIRECTIONS);
export const contributionAskStatusSchema = z.enum(CONTRIBUTION_ASK_STATUSES);
export const notificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const auditActionSchema = z.enum(AUDIT_ACTIONS);
export const currencyCodeSchema = z.enum(CURRENCY_CODES);
