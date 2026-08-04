import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import type { TablesInsert } from "@/types/database";

export type PushSubscriptionRow = {
  id: string;
  userId: string;
  teamId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
};

function mapRow(row: {
  id: string;
  user_id: string;
  team_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  user_agent: string | null;
}): PushSubscriptionRow {
  return {
    id: row.id,
    userId: row.user_id,
    teamId: row.team_id,
    endpoint: row.endpoint,
    p256dh: row.p256dh,
    auth: row.auth,
    userAgent: row.user_agent,
  };
}

export class PushSubscriptionRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async upsert(
    input: TablesInsert<"push_subscriptions">,
  ): Promise<PushSubscriptionRow> {
    const { data, error } = await this.client
      .from("push_subscriptions")
      .upsert(input, { onConflict: "endpoint" })
      .select("*")
      .single();
    this.assertOk(error, "pushSubscription.upsert");
    return mapRow(this.requireData(data, "pushSubscription.upsert"));
  }

  async deleteByEndpoint(userId: string, endpoint: string): Promise<void> {
    const { error } = await this.client
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId)
      .eq("endpoint", endpoint);
    this.assertOk(error, "pushSubscription.deleteByEndpoint");
  }

  async listByUserIds(userIds: string[]): Promise<PushSubscriptionRow[]> {
    const unique = [...new Set(userIds.map(String))];
    if (unique.length === 0) return [];
    const { data, error } = await this.client
      .from("push_subscriptions")
      .select("*")
      .in("user_id", unique);
    this.assertOk(error, "pushSubscription.listByUserIds");
    return (data ?? []).map(mapRow);
  }

  async deleteById(id: string): Promise<void> {
    const { error } = await this.client
      .from("push_subscriptions")
      .delete()
      .eq("id", id);
    this.assertOk(error, "pushSubscription.deleteById");
  }
}

export function createAdminPushSubscriptionRepository(
  client: TypedSupabaseClient,
): PushSubscriptionRepository {
  return new PushSubscriptionRepository(client);
}
