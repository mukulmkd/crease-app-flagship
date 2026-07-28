import type { MembershipRole } from "@/constants/domain/enums";
import type { TeamRepository } from "@/repositories/team.repository";
import type { ProfileId, TeamId } from "@/types/common";
import type { TeamMembership } from "@/types/models";
import { forbidden, notFound } from "@/services/shared/errors";

export function isAdminRole(role: MembershipRole): boolean {
  return role === "admin";
}

export async function requireActiveMembership(
  teamRepo: TeamRepository,
  teamId: TeamId | string,
  userId: ProfileId | string,
): Promise<TeamMembership> {
  const membership = await teamRepo.findMembership(teamId, userId);
  if (!membership || membership.status !== "active") {
    throw forbidden("You are not an active member of this team");
  }
  return membership;
}

export async function requireAdmin(
  teamRepo: TeamRepository,
  teamId: TeamId | string,
  actorId: ProfileId | string,
): Promise<TeamMembership> {
  const membership = await requireActiveMembership(teamRepo, teamId, actorId);
  if (!isAdminRole(membership.role)) {
    throw forbidden("Admin role required");
  }
  return membership;
}

export async function requireTeamExists(
  teamRepo: TeamRepository,
  teamId: TeamId | string,
) {
  const team = await teamRepo.findById(teamId);
  if (!team) throw notFound("Team not found");
  return team;
}
