"use server";

import { MVP_TEAM } from "@/constants/domain/enums";
import { AppError } from "@/lib/errors";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminMatchRepository } from "@/repositories/admin";
import { createServerTeamRepository } from "@/repositories/server";
import { requireAdmin } from "@/services/shared/membership";

export type SeedDemoAvailabilityInput = {
  matchId: string;
  userIds: string[];
};

/**
 * Demo mode only — mark members available on another player's behalf.
 *
 * RLS lets a member insert only their own poll vote, so filling a demo squad
 * must run server-side with the service role after re-checking Admin + demo mode.
 */
export async function seedDemoAvailabilityVotesAction(
  input: SeedDemoAvailabilityInput,
): Promise<number> {
  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required", 401);

  const teams = await createServerTeamRepository();
  await requireAdmin(teams, MVP_TEAM.id, user.id);

  const team = await teams.getMvpTeam();
  if (!team.demoMode) {
    throw new AppError(
      "FORBIDDEN",
      "Seeding votes is only available in demo mode",
      403,
    );
  }

  const members = await teams.listMemberships({
    teamId: MVP_TEAM.id,
    status: "active",
    limit: 100,
  });
  const activeIds = new Set(
    members.items.map((member) => String(member.userId)),
  );
  const targets = [...new Set(input.userIds)].filter((id) => activeIds.has(id));
  if (targets.length === 0) return 0;

  const matches = createAdminMatchRepository();
  const match = await matches.findMatchByIdOrThrow(input.matchId);
  if (String(match.teamId) !== MVP_TEAM.id) {
    throw new AppError("NOT_FOUND", "Match not found", 404);
  }

  const poll = await matches.findPoll(match.id, "availability");
  if (!poll)
    throw new AppError("NOT_FOUND", "Availability poll not found", 404);

  for (const userId of targets) {
    await matches.upsertVote({
      poll_id: String(poll.id),
      user_id: userId,
      availability: "yes",
      carpool: null,
    });
  }

  return targets.length;
}
