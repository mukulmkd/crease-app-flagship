/**
 * Zod schemas for MVP domain enums used by form/service validation.
 */
import { z } from "zod";

import {
  AVAILABILITY_VOTES,
  CARPOOL_VOTES,
  MATCH_CLASSIFICATIONS,
  MATCH_START_TIMES,
  MEMBERSHIP_ROLES,
  MEMBERSHIP_STATUSES,
} from "@/constants/domain/enums";

export const membershipRoleSchema = z.enum(MEMBERSHIP_ROLES);
export const membershipStatusSchema = z.enum(MEMBERSHIP_STATUSES);
export const matchClassificationSchema = z.enum(MATCH_CLASSIFICATIONS);
export const matchStartTimeSchema = z.enum(MATCH_START_TIMES);
export const availabilityVoteSchema = z.enum(AVAILABILITY_VOTES);
export const carpoolVoteSchema = z.enum(CARPOOL_VOTES);
