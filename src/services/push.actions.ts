"use server";

import { MVP_TEAM } from "@/constants/domain/enums";
import { AppError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PushSubscriptionRepository } from "@/repositories/push-subscription.repository";
import { createServerTeamRepository } from "@/repositories/server";
import { requireActiveMembership } from "@/services/shared/membership";

export type SavePushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  userAgent?: string | null;
};

export async function savePushSubscriptionAction(
  input: SavePushSubscriptionInput,
): Promise<void> {
  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required", 401);

  const teams = await createServerTeamRepository();
  await requireActiveMembership(teams, MVP_TEAM.id, user.id);

  if (!input.endpoint?.trim() || !input.keys?.p256dh || !input.keys?.auth) {
    throw new AppError("VALIDATION", "Invalid push subscription", 400);
  }

  const repo = new PushSubscriptionRepository(server);
  await repo.upsert({
    user_id: user.id,
    team_id: MVP_TEAM.id,
    endpoint: input.endpoint.trim(),
    p256dh: input.keys.p256dh,
    auth: input.keys.auth,
    user_agent: input.userAgent?.trim() || null,
  });
}

export async function deletePushSubscriptionAction(
  endpoint: string,
): Promise<void> {
  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required", 401);

  const teams = await createServerTeamRepository();
  await requireActiveMembership(teams, MVP_TEAM.id, user.id);

  const repo = new PushSubscriptionRepository(server);
  await repo.deleteByEndpoint(user.id, endpoint.trim());
}
