/**
 * Server-only repository factories.
 * Import from `@/repositories/server` — never from Client Components.
 */
import { createServerRepository } from "@/repositories/factory.server";
import { AuditLogRepository } from "@/repositories/audit-log.repository";
import { MatchRepository } from "@/repositories/match.repository";
import { NotificationRepository } from "@/repositories/notification.repository";
import { TeamRepository } from "@/repositories/team.repository";
import { UserRepository } from "@/repositories/user.repository";

export { createServerRepository } from "@/repositories/factory.server";
export { createServerAuthRepository } from "@/repositories/auth.repository.server";

export async function createServerUserRepository() {
  return createServerRepository(UserRepository);
}
export async function createServerTeamRepository() {
  return createServerRepository(TeamRepository);
}
export async function createServerMatchRepository() {
  return createServerRepository(MatchRepository);
}
export async function createServerNotificationRepository() {
  return createServerRepository(NotificationRepository);
}
export async function createServerAuditLogRepository() {
  return createServerRepository(AuditLogRepository);
}
