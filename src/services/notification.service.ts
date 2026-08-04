import { MVP_TEAM } from "@/constants/domain/enums";
import type { NotificationRepository } from "@/repositories/notification.repository";
import type { TeamRepository } from "@/repositories/team.repository";
import {
  createBrowserNotificationRepository,
  createBrowserTeamRepository,
} from "@/repositories";
import type { Paginated, ProfileId } from "@/types/common";
import type { Notification } from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import { requireActiveMembership } from "@/services/shared/membership";

type Actor = ServiceActor | { actorId: ProfileId | string };

export class NotificationService extends BaseService {
  protected readonly serviceName = "notification.service";

  constructor(
    private readonly notifications: NotificationRepository,
    private readonly teams: TeamRepository,
  ) {
    super();
  }

  async listMine(
    actor: Actor,
    opts: { unreadOnly?: boolean; limit?: number } = {},
  ): Promise<Paginated<Notification>> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.notifications.list({
        userId: actor.actorId,
        teamId: MVP_TEAM.id,
        unreadOnly: opts.unreadOnly,
        limit: opts.limit ?? 40,
        sortBy: "created_at",
        sortDirection: "desc",
      });
    });
  }

  async unreadCount(actor: Actor): Promise<number> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const page = await this.notifications.list({
        userId: actor.actorId,
        teamId: MVP_TEAM.id,
        unreadOnly: true,
        limit: 100,
      });
      return page.items.length;
    });
  }

  async markRead(notificationId: string, actor: Actor): Promise<Notification> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const row = await this.notifications.findByIdOrThrow(notificationId);
      if (row.userId && String(row.userId) !== actor.actorId) {
        throw this.forbidden("Cannot mark another user's notification");
      }
      if (row.readAt) return row;
      return this.notifications.update(notificationId, {
        read_at: new Date().toISOString(),
      });
    });
  }

  async markAllRead(actor: Actor): Promise<number> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.notifications.markAllReadForUser(actor.actorId);
    });
  }

  /**
   * Subscribe to new inbox rows for this member (Realtime). Returns unsubscribe.
   * Membership is checked once up front; RLS still filters the stream.
   */
  async subscribeMine(
    actor: Actor,
    onInsert: (notification: Notification) => void,
  ): Promise<() => void> {
    await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
    return this.notifications.subscribeToUserInserts(actor.actorId, onInsert);
  }
}

export function createBrowserNotificationService(): NotificationService {
  return new NotificationService(
    createBrowserNotificationRepository(),
    createBrowserTeamRepository(),
  );
}
