/**
 * Lazy browser service singletons.
 */

import {
  createBrowserDashboardService,
  createBrowserMatchService,
  createBrowserTeamService,
  type DashboardService,
  type MatchService,
  type TeamService,
} from "@/services";

let teamService: TeamService | null = null;
let matchService: MatchService | null = null;
let dashboardService: DashboardService | null = null;

export function getTeamService(): TeamService {
  return (teamService ??= createBrowserTeamService());
}

export function getMatchService(): MatchService {
  return (matchService ??= createBrowserMatchService());
}

export function getDashboardService(): DashboardService {
  return (dashboardService ??= createBrowserDashboardService());
}
