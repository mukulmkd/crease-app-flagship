/**
 * Service layer — business logic.
 * UI → Hook → Service → Repository → Supabase
 */
export { BaseService, type ServiceActor } from "@/services/base.service";

export * as authService from "@/services/auth";

export { TeamService, createBrowserTeamService } from "@/services/team.service";

export {
  MatchService,
  createBrowserMatchService,
} from "@/services/match.service";

export {
  DashboardService,
  createBrowserDashboardService,
  type DashboardSnapshot,
} from "@/services/dashboard.service";
