import webpush from "web-push";

import { ALERTS_OPEN_HREF } from "@/constants/alerts";
import { isWebPushConfigured } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createAdminPushSubscriptionRepository } from "@/repositories/push-subscription.repository";

export type WebPushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  notificationId?: string;
};

function safeEndpointHost(endpoint: string): string | undefined {
  try {
    return new URL(endpoint).host;
  } catch {
    return undefined;
  }
}

function configureVapid(): boolean {
  if (!isWebPushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT?.trim() || "mailto:admin@crease.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.trim(),
    process.env.VAPID_PRIVATE_KEY!.trim(),
  );
  return true;
}

/**
 * Fire-and-forget OS push for the given users. Never throws to callers —
 * notification inserts must succeed even if push delivery fails.
 */
export async function sendWebPushToUsers(
  userIds: string[],
  payload: WebPushPayload,
): Promise<number> {
  if (!configureVapid()) return 0;
  const unique = [...new Set(userIds.map(String))];
  if (unique.length === 0) return 0;

  try {
    const admin = createAdminSupabaseClient();
    const repo = createAdminPushSubscriptionRepository(admin);
    const rows = await repo.listByUserIds(unique);
    if (rows.length === 0) return 0;

    const body = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url ?? ALERTS_OPEN_HREF,
      tag: payload.tag,
      notificationId: payload.notificationId,
    });

    let sent = 0;
    await Promise.all(
      rows.map(async (row) => {
        try {
          // TTL + urgency help Apple (web.push.apple.com) accept and deliver.
          await webpush.sendNotification(
            {
              endpoint: row.endpoint,
              keys: { p256dh: row.p256dh, auth: row.auth },
            },
            body,
            {
              TTL: 60 * 60 * 24,
              urgency: "high",
              contentEncoding: "aes128gcm",
            },
          );
          sent += 1;
        } catch (error) {
          const statusCode =
            error && typeof error === "object" && "statusCode" in error
              ? Number((error as { statusCode: number }).statusCode)
              : 0;
          const bodyText =
            error && typeof error === "object" && "body" in error
              ? String((error as { body: unknown }).body)
              : undefined;
          // Gone / expired subscription — drop it.
          if (statusCode === 404 || statusCode === 410) {
            await repo.deleteById(row.id).catch(() => undefined);
          } else {
            logger.warn("web_push.send_failed", {
              userId: row.userId,
              endpointHost: safeEndpointHost(row.endpoint),
              statusCode: statusCode || undefined,
              body: bodyText?.slice(0, 200),
              message: error instanceof Error ? error.message : "unknown",
            });
          }
        }
      }),
    );
    return sent;
  } catch (error) {
    logger.warn("web_push.dispatch_failed", {
      message: error instanceof Error ? error.message : "unknown",
    });
    return 0;
  }
}
