import type { NotificationType } from "@/constants/domain/enums";
import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import { mapNotification } from "@/repositories/shared/mappers";
import type { RepositoryListParams } from "@/repositories/shared/pagination";
import type { Tables, TablesInsert, TablesUpdate } from "@/types/database";
import type {
  NotificationId,
  Paginated,
  ProfileId,
  TeamId,
} from "@/types/common";
import type { Notification } from "@/types/models";

export type NotificationListFilter = RepositoryListParams & {
  userId?: ProfileId | string;
  teamId?: TeamId | string;
  type?: NotificationType;
  unreadOnly?: boolean;
};

export class NotificationRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async findById(id: NotificationId | string): Promise<Notification | null> {
    const { data, error } = await this.client
      .from("notifications")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "notification.findById");
    return data ? mapNotification(data) : null;
  }

  async list(
    filter: NotificationListFilter = {},
  ): Promise<Paginated<Notification>> {
    const { limit, offset, from, to } = this.pageRange(filter);
    const { column, ascending } = this.sort(filter, "created_at");

    let query = this.client.from("notifications").select("*");
    if (filter.userId) query = query.eq("user_id", filter.userId);
    if (filter.teamId) query = query.eq("team_id", filter.teamId);
    if (filter.type) query = query.eq("type", filter.type);
    if (filter.unreadOnly) query = query.is("read_at", null);

    const { data, error } = await query
      .order(column, { ascending: ascending === false ? false : true })
      .order("id", { ascending: true })
      .range(from, to);

    this.assertOk(error, "notification.list");
    return this.paginate((data ?? []).map(mapNotification), limit, offset);
  }

  async createMany(rows: TablesInsert<"notifications">[]): Promise<number> {
    if (rows.length === 0) return 0;
    const { error } = await this.client.from("notifications").insert(rows);
    this.assertOk(error, "notification.createMany");
    return rows.length;
  }

  async update(
    id: NotificationId | string,
    input: TablesUpdate<"notifications">,
  ): Promise<Notification> {
    const { data, error } = await this.client
      .from("notifications")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "notification.update");
    return mapNotification(this.requireData(data, "notification.update"));
  }

  async findByIdOrThrow(id: NotificationId | string): Promise<Notification> {
    const row = await this.findById(id);
    if (!row) throw new AppError("NOT_FOUND", "Notification not found", 404);
    return row;
  }

  /**
   * Live INSERT stream for one member. Caller must unsubscribe on unmount.
   * Relies on `notifications` being in `supabase_realtime` + RLS.
   */
  subscribeToUserInserts(
    userId: ProfileId | string,
    onInsert: (notification: Notification) => void,
  ): () => void {
    const channel = this.client
      .channel(`notifications-inserts:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          onInsert(mapNotification(payload.new as Tables<"notifications">));
        },
      )
      .subscribe();

    return () => {
      void this.client.removeChannel(channel);
    };
  }
}

export function createBrowserNotificationRepository(): NotificationRepository {
  return new NotificationRepository(createBrowserSupabaseClient());
}
