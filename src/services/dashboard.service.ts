import { MVP_TEAM } from "@/constants/domain/enums";
import {
  createBrowserFundRepository,
  createBrowserMatchRepository,
  createBrowserNotificationRepository,
  createBrowserPaymentRepository,
  createBrowserTeamRepository,
  type FundRepository,
  type MatchRepository,
  type NotificationRepository,
  type PaymentRepository,
  type TeamRepository,
} from "@/repositories";
import { BaseService, type ServiceActor } from "@/services/base.service";
import { requireActiveMembership } from "@/services/shared/membership";
import type { ProfileId } from "@/types/common";
import type { Match, Notification, TeamMembership } from "@/types/models";
import { nextWeekendDates, todayIsoDate } from "@/utils";

export type DashboardPollSummary = {
  matchId: string;
  yesCount: number;
  carpoolCount: number;
};

export type DashboardSnapshot = {
  membership: TeamMembership;
  weekendMatches: Match[];
  /** Confirmed/pending fixtures after this weekend. */
  moreUpcomingMatches: Match[];
  upcomingMatches: Match[];
  pollSummaries: DashboardPollSummary[];
  unpaidCount: number;
  unpaidTotalInr: number;
  fundBalanceInr: number;
  recentNotifications: Notification[];
};

type Actor = ServiceActor | { actorId: ProfileId | string };

/**
 * Lightweight Admin/Player home snapshot.
 */
export class DashboardService extends BaseService {
  protected readonly serviceName = "dashboard.service";

  constructor(
    private readonly teams: TeamRepository,
    private readonly matches: MatchRepository,
    private readonly payments: PaymentRepository,
    private readonly funds: FundRepository,
    private readonly notifications: NotificationRepository,
  ) {
    super();
  }

  async getSnapshot(actor: Actor): Promise<DashboardSnapshot> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );

      const weekend = nextWeekendDates();
      const page = await this.matches.listMatches({
        teamId: MVP_TEAM.id,
        fromDate: todayIsoDate(),
        limit: 40,
        sortBy: "match_date",
        sortDirection: "asc",
      });

      const upcomingMatches = page.items.filter(
        (m) => m.status === "confirmed" || m.status === "pending_confirm",
      );

      const weekendMatches = upcomingMatches.filter(
        (m) =>
          m.matchDate === weekend.saturday || m.matchDate === weekend.sunday,
      );
      const moreUpcomingMatches = upcomingMatches.filter(
        (m) =>
          m.matchDate !== weekend.saturday && m.matchDate !== weekend.sunday,
      );

      const pollSummaries: DashboardPollSummary[] = [];
      for (const match of [...weekendMatches, ...moreUpcomingMatches]) {
        if (match.status !== "confirmed" || !match.pollsEnabled) {
          pollSummaries.push({
            matchId: match.id,
            yesCount: 0,
            carpoolCount: 0,
          });
          continue;
        }
        const avail = await this.matches.findPoll(match.id, "availability");
        const carpool = await this.matches.findPoll(match.id, "carpool");
        const yesCount = avail
          ? await this.matches.countAvailabilityYes(avail.id)
          : 0;
        const carpoolCount = carpool
          ? (await this.matches.listVotes(carpool.id)).filter(
              (v) => v.carpool === "carpool",
            ).length
          : 0;
        pollSummaries.push({
          matchId: match.id,
          yesCount,
          carpoolCount,
        });
      }

      const pending = await this.payments.listTeamCharges(
        MVP_TEAM.id,
        "pending",
      );
      const account = await this.funds.getAccount(MVP_TEAM.id);
      const notifPage = await this.notifications.list({
        userId: actor.actorId,
        teamId: MVP_TEAM.id,
        limit: 5,
        sortBy: "created_at",
        sortDirection: "desc",
      });

      return {
        membership,
        weekendMatches,
        moreUpcomingMatches,
        upcomingMatches,
        pollSummaries,
        unpaidCount: pending.length,
        unpaidTotalInr: pending.reduce((s, c) => s + c.totalInr, 0),
        fundBalanceInr: account?.balanceInr ?? 0,
        recentNotifications: notifPage.items,
      };
    });
  }
}

export function createBrowserDashboardService(): DashboardService {
  return new DashboardService(
    createBrowserTeamRepository(),
    createBrowserMatchRepository(),
    createBrowserPaymentRepository(),
    createBrowserFundRepository(),
    createBrowserNotificationRepository(),
  );
}
