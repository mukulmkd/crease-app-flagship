/**
 * Service layer — business logic.
 * UI → Hook → Service → Repository → Supabase
 */

export { TeamService, createBrowserTeamService } from "@/services/team.service";

export {
  MatchService,
  createBrowserMatchService,
} from "@/services/match.service";

export {
  DashboardService,
  createBrowserDashboardService,
} from "@/services/dashboard.service";

export {
  PaymentService,
  createBrowserPaymentService,
} from "@/services/payment.service";

export { FundService, createBrowserFundService } from "@/services/fund.service";
