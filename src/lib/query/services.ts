/**
 * Lazy browser service singletons.
 */

import {
  createBrowserDashboardService,
  createBrowserFundService,
  createBrowserMatchService,
  createBrowserPaymentService,
  createBrowserTeamService,
  type DashboardService,
  type FundService,
  type MatchService,
  type PaymentService,
  type TeamService,
} from "@/services";
import {
  createBrowserNotificationService,
  type NotificationService,
} from "@/services/notification.service";

let teamService: TeamService | null = null;
let matchService: MatchService | null = null;
let dashboardService: DashboardService | null = null;
let paymentService: PaymentService | null = null;
let fundService: FundService | null = null;
let notificationService: NotificationService | null = null;

export function getTeamService(): TeamService {
  return (teamService ??= createBrowserTeamService());
}

export function getMatchService(): MatchService {
  return (matchService ??= createBrowserMatchService());
}

export function getDashboardService(): DashboardService {
  return (dashboardService ??= createBrowserDashboardService());
}

export function getPaymentService(): PaymentService {
  return (paymentService ??= createBrowserPaymentService());
}

export function getFundService(): FundService {
  return (fundService ??= createBrowserFundService());
}

export function getNotificationService(): NotificationService {
  return (notificationService ??= createBrowserNotificationService());
}
