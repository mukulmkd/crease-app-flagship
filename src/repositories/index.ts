export { BaseRepository } from "@/repositories/base.repository";
export {
  createBrowserRepository,
  createRepositoryWithClient,
} from "@/repositories/factory";
export type { RepositoryConstructor } from "@/repositories/factory";

export {
  AuthRepository,
  createBrowserAuthRepository,
} from "@/repositories/auth.repository";
export type {
  AuthStateCallback,
  CompleteProfilePayload,
} from "@/repositories/auth.repository";

export {
  UserRepository,
  createBrowserUserRepository,
} from "@/repositories/user.repository";

export {
  TeamRepository,
  createBrowserTeamRepository,
} from "@/repositories/team.repository";
export type { MembershipListFilter } from "@/repositories/team.repository";

export {
  MatchRepository,
  createBrowserMatchRepository,
} from "@/repositories/match.repository";
export type { MatchListFilter } from "@/repositories/match.repository";

export {
  NotificationRepository,
  createBrowserNotificationRepository,
} from "@/repositories/notification.repository";
export type { NotificationListFilter } from "@/repositories/notification.repository";

export {
  PaymentRepository,
  createBrowserPaymentRepository,
} from "@/repositories/payment.repository";

export {
  FundRepository,
  createBrowserFundRepository,
} from "@/repositories/fund.repository";

export {
  AuditLogRepository,
  createBrowserAuditLogRepository,
} from "@/repositories/audit-log.repository";
export type { AuditLogListFilter } from "@/repositories/audit-log.repository";

export type { RepositoryListParams } from "@/repositories/shared/pagination";
