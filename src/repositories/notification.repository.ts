import type { NotificationType } from "@/constants/domain/enums";
import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import { mapNotification } from "@/repositories/shared/mappers";
import type { RepositoryListParams } from "@/repositories/shared/pagination";
import type { TablesInsert, TablesUpdate } from "@/types/database";
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

  async create(input: TablesInsert<"notifications">): Promise<Notification> {
    const { data, error } = await this.client
      .from("notifications")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "notification.create");
    return mapNotification(this.requireData(data, "notification.create"));
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

  async existsByIdempotencyKey(params: {
    userId: string;
    idempotencyKey: string;
  }): Promise<boolean> {
    const { data, error } = await this.client
      .from("notifications")
      .select("id")
      .eq("user_id", params.userId)
      .contains("data", { idempotencyKey: params.idempotencyKey })
      .limit(1);
    this.assertOk(error, "notification.existsByIdempotencyKey");
    return (data?.length ?? 0) > 0;
  }

  async findByIdOrThrow(id: NotificationId | string): Promise<Notification> {
    const row = await this.findById(id);
    if (!row) throw new AppError("NOT_FOUND", "Notification not found", 404);
    return row;
  }
}

export function createBrowserNotificationRepository(): NotificationRepository {
  return new NotificationRepository(createBrowserSupabaseClient());
}
