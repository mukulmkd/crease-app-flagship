import { MVP_TEAM } from "@/constants/domain/enums";
import {
  createBrowserMatchRepository,
  createBrowserTeamRepository,
  type MatchRepository,
  type TeamRepository,
} from "@/repositories";
import { BaseService, type ServiceActor } from "@/services/base.service";
import { requireActiveMembership } from "@/services/shared/membership";
import type { ProfileId } from "@/types/common";
import type { Match, TeamMembership } from "@/types/models";

export type DashboardSnapshot = {
  membership: TeamMembership;
  upcomingMatches: Match[];
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

      const today = new Date().toISOString().slice(0, 10);
      const page = await this.matches.listMatches({
        teamId: MVP_TEAM.id,
        fromDate: today,
        limit: 6,
        sortBy: "match_date",
        sortDirection: "asc",
      });

      return {
        membership,
        upcomingMatches: page.items.filter(
          (m) => m.status === "confirmed" || m.status === "pending_confirm",
        ),
      };
    });
  }
}

export function createBrowserDashboardService(): DashboardService {
  return new DashboardService(
    createBrowserTeamRepository(),
    createBrowserMatchRepository(),
  );
}
