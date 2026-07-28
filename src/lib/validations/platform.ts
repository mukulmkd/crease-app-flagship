import { z } from "zod";

import {
  auditActionSchema,
  notificationTypeSchema,
} from "@/lib/validations/enums";
import {
  isoDateTimeSchema,
  listQueryBaseSchema,
  nonEmptyStringSchema,
  uuidSchema,
} from "@/lib/validations/common";

export const createNotificationSchema = z.object({
  userId: uuidSchema,
  teamId: uuidSchema.nullable().optional(),
  type: notificationTypeSchema,
  title: nonEmptyStringSchema.max(160),
  body: z.string().trim().min(1).max(2000),
  data: z.record(z.string(), z.unknown()).optional(),
});

export const markNotificationReadSchema = z.object({
  readAt: isoDateTimeSchema.nullable().optional(),
});

export const listNotificationsQuerySchema = listQueryBaseSchema.extend({
  userId: uuidSchema.optional(),
  teamId: uuidSchema.optional(),
  unreadOnly: z.boolean().optional(),
  type: notificationTypeSchema.optional(),
});

export const createAuditLogSchema = z.object({
  actorId: uuidSchema.nullable().optional(),
  teamId: uuidSchema.nullable().optional(),
  action: auditActionSchema,
  entityType: z.string().min(1),
  entityId: z.string().min(1).nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type MarkNotificationReadInput = z.infer<
  typeof markNotificationReadSchema
>;
export type CreateAuditLogInput = z.infer<typeof createAuditLogSchema>;
