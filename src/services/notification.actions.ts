"use server";

import type { NotificationType } from "@/constants/domain/enums";
import { MVP_TEAM } from "@/constants/domain/enums";
import { ALERTS_OPEN_HREF } from "@/constants/alerts";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logging/logger";
import { sendWebPushToUsers } from "@/lib/push/send-web-push";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminNotificationRepository } from "@/repositories/admin";
import { createServerTeamRepository } from "@/repositories/server";
import { toDbJson } from "@/repositories/shared/brand";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";
import type { JsonValue } from "@/types/common";

export type BroadcastTeamNotificationInput = {
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, JsonValue>;
  /** Skip the member who triggered the event (e.g. the voter). */
  excludeUserId?: string | null;
  /** Broadcasts that only Admin may trigger (confirm, settlement, fund ask). */
  adminOnly?: boolean;
  /** Default all active members; use admins for pick-needed / incomplete alerts. */
  recipients?: "all" | "admins";
  /** When set, only these user ids receive the row (e.g. unpaid fee nudge). */
  userIds?: string[];
};

/**
 * Team-wide fan-out.
 *
 * RLS only lets Admins insert notification rows, so player-triggered broadcasts
 * (e.g. an availability flip) must run server-side with the service role after
 * re-checking membership. A single batched insert also keeps the triggering
 * mutation fast instead of one round trip per member.
 */
export async function broadcastTeamNotificationAction(
  input: BroadcastTeamNotificationInput,
): Promise<number> {
  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required", 401);

  const teams = await createServerTeamRepository();
  if (input.adminOnly) {
    await requireAdmin(teams, MVP_TEAM.id, user.id);
  } else {
    await requireActiveMembership(teams, MVP_TEAM.id, user.id);
  }

  const members = await teams.listMemberships({
    teamId: MVP_TEAM.id,
    status: "active",
    limit: 100,
  });
  const allow = input.userIds?.length
    ? new Set(input.userIds.map(String))
    : null;
  const recipients = members.items.filter((member) => {
    if (String(member.userId) === input.excludeUserId) return false;
    if (allow && !allow.has(String(member.userId))) return false;
    if (input.recipients === "admins") return member.role === "admin";
    return true;
  });
  if (recipients.length === 0) return 0;

  try {
    const notifications = createAdminNotificationRepository();
    const count = await notifications.createMany(
      recipients.map((member) => ({
        user_id: String(member.userId),
        team_id: MVP_TEAM.id,
        type: input.type,
        title: input.title,
        body: input.body,
        data: toDbJson(input.data ?? {}),
      })),
    );

    // OS push when PWA is backgrounded — never block the inbox insert.
    void sendWebPushToUsers(
      recipients.map((member) => String(member.userId)),
      {
        title: input.title,
        body: input.body,
        url: ALERTS_OPEN_HREF,
        tag: `crease-${input.type}`,
      },
    );

    return count;
  } catch (error) {
    // Notification delivery never fails the primary mutation.
    logger.warn("notification.broadcast_failed", {
      type: input.type,
      message: error instanceof Error ? error.message : "unknown",
    });
    return 0;
  }
}
