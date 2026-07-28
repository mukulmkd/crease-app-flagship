import { MVP_TEAM, SQUAD_MAX } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  confirmMatchSchema,
  createMatchSchema,
  createTournamentSchema,
} from "@/lib/validations/match";
import type { NotificationRepository } from "@/repositories/notification.repository";
import type { MatchRepository } from "@/repositories/match.repository";
import type { TeamRepository } from "@/repositories/team.repository";
import {
  createBrowserMatchRepository,
  createBrowserNotificationRepository,
  createBrowserTeamRepository,
} from "@/repositories";
import type {
  CreateMatchDto,
  CreateTournamentDto,
  CreateWeekendMatchesDto,
} from "@/types/dto";
import type { MatchId, Paginated, ProfileId } from "@/types/common";
import type { Match, MatchPoll, Tournament } from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";
import { enqueueNotification } from "@/services/shared/notify";

type Actor = ServiceActor | { actorId: ProfileId | string };

function isWeekendDate(isoDate: string): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

/**
 * Weekend match Admin flow — create, tournament sheet, confirm → polls + notify.
 */
export class MatchService extends BaseService {
  protected readonly serviceName = "match.service";

  constructor(
    private readonly matches: MatchRepository,
    private readonly teams: TeamRepository,
    private readonly notifications: NotificationRepository,
  ) {
    super();
  }

  async listMatches(actor: Actor): Promise<Paginated<Match>> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.matches.listMatches({
        teamId: MVP_TEAM.id,
        limit: 50,
        sortBy: "match_date",
        sortDirection: "desc",
      });
    });
  }

  async getMatch(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.matches.findMatchByIdOrThrow(matchId);
    });
  }

  async listTournaments(actor: Actor): Promise<Paginated<Tournament>> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.matches.listTournaments(MVP_TEAM.id);
    });
  }

  async createTournament(
    input: CreateTournamentDto,
    actor: Actor,
  ): Promise<Tournament> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TOURNAMENT_CREATE);
      const parsed = createTournamentSchema.parse(input);
      return this.matches.createTournament({
        team_id: MVP_TEAM.id,
        name: parsed.name,
        planned_match_count: parsed.plannedMatchCount,
        total_fees_inr: parsed.totalFeesInr,
        status: "active",
        created_by: actor.actorId,
      });
    });
  }

  async createMatch(input: CreateMatchDto, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CREATE);
      const parsed = createMatchSchema.parse(input);
      if (!isWeekendDate(parsed.matchDate)) {
        throw this.validation("Match date must be Saturday or Sunday");
      }
      if (parsed.classification === "tournament" && !parsed.tournamentId) {
        throw this.validation("Tournament match requires a tournament");
      }
      if (parsed.classification === "warmup" && parsed.tournamentId) {
        throw this.validation("Warmup matches cannot link a tournament");
      }

      const match = await this.matches.createMatch({
        team_id: MVP_TEAM.id,
        match_date: parsed.matchDate,
        classification: parsed.classification,
        tournament_id: parsed.tournamentId ?? null,
        opposition: parsed.opposition ?? null,
        ground_maps_url: parsed.groundMapsUrl || null,
        start_time: parsed.startTime ?? null,
        match_fees_inr: parsed.matchFeesInr ?? null,
        status: "pending_confirm",
        created_by: actor.actorId,
      });

      await this.ensureDraftPolls(match.id);
      return match;
    });
  }

  /** Create one or more independently configured weekend matches. */
  async createWeekendMatches(
    input: CreateWeekendMatchesDto,
    actor: Actor,
  ): Promise<Match[]> {
    return this.run(async () => {
      if (!input.matches?.length) {
        throw this.validation("Select at least one weekend day");
      }
      const created: Match[] = [];
      for (const entry of input.matches) {
        const match = await this.createMatch(entry, actor);
        created.push(match);
      }
      return created;
    });
  }

  async confirmMatch(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CONFIRM);
      confirmMatchSchema.parse({ matchId });

      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.status === "confirmed") return match;
      if (match.status === "cancelled" || match.status === "completed") {
        throw this.conflict("Cannot confirm a cancelled or completed match");
      }

      await this.ensureDraftPolls(match.id);
      const polls = await this.matches.listPollsForMatch(match.id);
      for (const poll of polls) {
        if (poll.status === "draft") {
          await this.matches.updatePoll(poll.id, { status: "active" });
        }
      }

      const confirmed = await this.matches.updateMatch(match.id, {
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
      });

      await this.notifyMembersToVote(confirmed);
      // WhatsApp group hook — fire-and-forget placeholder (URL on team settings)
      void this.notifyWhatsApp(confirmed);

      return confirmed;
    });
  }

  async getPollsForMatch(matchId: string, actor: Actor): Promise<MatchPoll[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.matches.listPollsForMatch(matchId);
    });
  }

  private async ensureDraftPolls(matchId: MatchId | string): Promise<void> {
    for (const type of ["availability", "carpool"] as const) {
      const existing = await this.matches.findPoll(matchId, type);
      if (!existing) {
        await this.matches.createPoll({
          team_id: MVP_TEAM.id,
          match_id: String(matchId),
          type,
          status: "draft",
        });
      }
    }
  }

  private async notifyMembersToVote(match: Match): Promise<void> {
    const members = await this.teams.listMemberships({
      teamId: MVP_TEAM.id,
      status: "active",
      limit: 100,
    });
    const when = match.matchDate;
    for (const member of members.items) {
      await enqueueNotification(this.notifications, {
        userId: member.userId,
        teamId: MVP_TEAM.id,
        type: "match",
        title: "Match confirmed — please vote",
        body: `Availability and carpool polls are open for ${when}. Squad target ${SQUAD_MAX} max.`,
        data: { matchId: match.id },
      });
    }
  }

  private async notifyWhatsApp(match: Match): Promise<void> {
    const team = await this.teams.getMvpTeam();
    if (!team.whatsappNotifyUrl) return;
    try {
      await fetch(team.whatsappNotifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `Ranches Thunders match confirmed for ${match.matchDate}. Vote availability + carpool in Crease.`,
          matchId: match.id,
        }),
      });
    } catch {
      // Non-blocking
    }
  }
}

export function createBrowserMatchService(): MatchService {
  return new MatchService(
    createBrowserMatchRepository(),
    createBrowserTeamRepository(),
    createBrowserNotificationRepository(),
  );
}
