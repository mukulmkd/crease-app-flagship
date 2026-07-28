import { logger } from "@/lib/logging/logger";
import type { NotificationRepository } from "@/repositories/notification.repository";
import { toDbJson } from "@/repositories/shared/brand";
import type { CreateNotificationDto } from "@/types/dto";

type EnqueueOptions = {
  idempotencyKey?: string;
};

/**
 * Best-effort notification write. Failures never fail the primary operation.
 */
export async function enqueueNotification(
  notifications: NotificationRepository,
  input: CreateNotificationDto,
  options: EnqueueOptions = {},
): Promise<void> {
  try {
    const idempotencyKey = options.idempotencyKey;
    if (idempotencyKey) {
      const exists = await notifications.existsByIdempotencyKey({
        userId: String(input.userId),
        idempotencyKey,
      });
      if (exists) return;
    }

    const data = {
      ...((input.data as Record<string, unknown> | undefined) ?? {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
    };

    await notifications.create({
      user_id: String(input.userId),
      team_id: input.teamId ? String(input.teamId) : null,
      type: input.type,
      title: input.title,
      body: input.body,
      data: toDbJson(data),
    });
  } catch (error) {
    logger.warn("notification.enqueue_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
