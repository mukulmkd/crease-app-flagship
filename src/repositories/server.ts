/**
 * Server-only repository factories.
 * Import from `@/repositories/server` — never from Client Components.
 */
import { createServerRepository } from "@/repositories/factory.server";
import { TeamRepository } from "@/repositories/team.repository";

export async function createServerTeamRepository() {
  return createServerRepository(TeamRepository);
}
