import { MVP_TEAM, squadLimits } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  castAvailabilityVoteSchema,
  castCarpoolVoteSchema,
  cancelMatchSchema,
  completeMatchSchema,
  createMatchSchema,
  createTournamentSchema,
  enableMatchPollsSchema,
  finalizePlayingSquadSchema,
  freezePollsSchema,
  saveCarpoolAssignmentsSchema,
  seedDemoCarpoolSchema,
  updateMatchSchema,
  updateTournamentSchema,
} from "@/lib/validations/match";
import type { MatchRepository } from "@/repositories/match.repository";
import type { TeamRepository } from "@/repositories/team.repository";
import {
  createBrowserMatchRepository,
  createBrowserTeamRepository,
} from "@/repositories";
import type {
  CastAvailabilityVoteDto,
  CastCarpoolVoteDto,
  CreateMatchDto,
  CreateTournamentDto,
  CreateWeekendMatchesDto,
  UpdateMatchDto,
  UpdateTournamentDto,
} from "@/types/dto";
import type { MatchId, Paginated, ProfileId } from "@/types/common";
import type {
  Match,
  MatchCarpoolRide,
  MatchPoll,
  MatchTournamentContext,
  PollVote,
  Tournament,
  TournamentSummary,
} from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";
import { seedDemoAvailabilityVotesAction } from "@/services/match.actions";
import { broadcastTeamNotificationAction } from "@/services/notification.actions";
import { createBrowserPaymentService } from "@/services/payment.service";
import {
  isImmediateWeekendDate,
  isMatchStartedIst,
  todayIsoDate,
  tournamentMatchFeePoolInr,
  weekendContainingDate,
} from "@/utils";

type Actor = ServiceActor | { actorId: ProfileId | string };

export type MatchPollSummary = {
  poll: MatchPoll;
  yesCount: number;
  noCount: number;
  carpoolCount: number;
  selfCount: number;
  votes: PollVote[];
  myVote: PollVote | null;
};

export type MatchPollsSnapshot = {
  match: Match;
  availability: MatchPollSummary | null;
  carpool: MatchPollSummary | null;
  roster: Array<{
    userId: string;
    fullName: string | null;
    availability: "yes" | "no" | null;
    carpool: "carpool" | "self" | null;
    inSquad: boolean;
  }>;
  /** Availability locked (Admin early freeze or match day − 1 cron). */
  availabilityFrozen: boolean;
  /** Carpool locked once kickoff starts (or poll status frozen/closed). */
  carpoolFrozen: boolean;
  /** Finalized playing 11–12 (fees charge these only). */
  squadFinalized: boolean;
  squadUserIds: string[];
};

function isWeekendDate(isoDate: string): boolean {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return false;
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  return weekday === 0 || weekday === 6;
}

function ordinal(value: number): string {
  const mod100 = value % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

/**
 * Weekend match Admin flow — create, tournament sheet, confirm → polls + notify.
 */
export class MatchService extends BaseService {
  protected readonly serviceName = "match.service";

  constructor(
    private readonly matches: MatchRepository,
    private readonly teams: TeamRepository,
  ) {
    super();
  }

  async listMatches(actor: Actor): Promise<Paginated<Match>> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.matches.listMatches({
        teamId: MVP_TEAM.id,
        limit: 100,
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

  /**
   * Tournament fee pool + progress for one fixture (match N of planned,
   * remaining unsettled, squad size for fee split).
   */
  async getMatchTournamentContext(
    matchId: string,
    actor: Actor,
  ): Promise<MatchTournamentContext> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.teamId !== MVP_TEAM.id) {
        throw this.notFound("Match not found");
      }
      if (match.classification !== "tournament" || !match.tournamentId) {
        throw this.validation("Match is not linked to a tournament");
      }
      const tournament = await this.matches.findTournamentById(
        match.tournamentId,
      );
      if (!tournament || tournament.teamId !== MVP_TEAM.id) {
        throw this.notFound("Tournament not found");
      }

      const fixtures = (
        await this.matches.listMatchesForTournament(tournament.id)
      ).filter((row) => row.status !== "cancelled");
      const index = fixtures.findIndex(
        (row) => String(row.id) === String(match.id),
      );
      const settledMatchCount = fixtures.filter((row) =>
        Boolean(row.feesSettledAt),
      ).length;

      let squadSize: number | null = null;
      if (match.squadFinalizedAt) {
        const squad = await this.matches.listSquadMembers(match.id);
        squadSize = squad.length;
      }

      return {
        tournament,
        matchNumber: index >= 0 ? index + 1 : 0,
        plannedMatchCount: tournament.plannedMatchCount,
        remainingMatchCount: Math.max(
          0,
          tournament.plannedMatchCount - settledMatchCount,
        ),
        feePoolPerMatchInr: tournamentMatchFeePoolInr(tournament),
        squadSize,
      };
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
      const feesPaidByUserId = await this.resolveTournamentFeesPayer(
        parsed.totalFeesInr,
        parsed.feesPaidByUserId,
      );
      return this.matches.createTournament({
        team_id: MVP_TEAM.id,
        name: parsed.name,
        planned_match_count: parsed.plannedMatchCount,
        total_fees_inr: parsed.totalFeesInr,
        fees_paid_by_user_id: feesPaidByUserId,
        status: "active",
        created_by: actor.actorId,
      });
    });
  }

  /**
   * Admin may edit name / planned count / total fees while the tournament is
   * still active (not yet moved to Past after the last match fees settle).
   */
  async updateTournament(
    input: UpdateTournamentDto,
    actor: Actor,
  ): Promise<Tournament> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TOURNAMENT_EDIT);
      const parsed = updateTournamentSchema.parse(input);
      const tournament = await this.matches.findTournamentById(
        parsed.tournamentId,
      );
      if (!tournament) throw this.notFound("Tournament not found");
      if (
        tournament.status === "completed" ||
        tournament.status === "cancelled"
      ) {
        throw this.conflict("Past tournaments cannot be edited");
      }

      const fixtures = await this.matches.listMatchesForTournament(
        tournament.id,
      );
      const settledCount = fixtures.filter(
        (m) => m.status !== "cancelled" && m.feesSettledAt,
      ).length;
      const nextPlanned =
        parsed.plannedMatchCount ?? tournament.plannedMatchCount;
      if (nextPlanned < settledCount) {
        throw this.conflict(
          `Planned matches cannot be below ${settledCount} already settled`,
        );
      }

      const nextFees =
        parsed.totalFeesInr !== undefined
          ? parsed.totalFeesInr
          : tournament.totalFeesInr;
      const nextPayerRaw =
        parsed.feesPaidByUserId !== undefined
          ? parsed.feesPaidByUserId
          : tournament.feesPaidByUserId
            ? String(tournament.feesPaidByUserId)
            : null;
      const feesPaidByUserId = await this.resolveTournamentFeesPayer(
        nextFees,
        nextPayerRaw,
      );

      const updated = await this.matches.updateTournament(tournament.id, {
        ...(parsed.name !== undefined ? { name: parsed.name } : {}),
        ...(parsed.plannedMatchCount !== undefined
          ? { planned_match_count: parsed.plannedMatchCount }
          : {}),
        ...(parsed.totalFeesInr !== undefined
          ? { total_fees_inr: parsed.totalFeesInr }
          : {}),
        fees_paid_by_user_id: feesPaidByUserId,
      });

      // Per-match ground fees stay on the match row; settlement re-reads the
      // tournament pool live when planned count / total fees change.
      if (
        settledCount >= updated.plannedMatchCount &&
        updated.plannedMatchCount > 0
      ) {
        return this.matches.updateTournament(updated.id, {
          status: "completed",
        });
      }
      return updated;
    });
  }

  async listTournamentSummaries(actor: Actor): Promise<TournamentSummary[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const page = await this.matches.listTournaments(MVP_TEAM.id);
      const summaries: TournamentSummary[] = [];
      for (const tournament of page.items) {
        const fixtures = await this.matches.listMatchesForTournament(
          tournament.id,
        );
        const activeFixtures = fixtures.filter((m) => m.status !== "cancelled");
        const settledMatchCount = activeFixtures.filter((m) =>
          Boolean(m.feesSettledAt),
        ).length;
        summaries.push({
          tournament,
          settledMatchCount,
          remainingMatchCount: Math.max(
            0,
            tournament.plannedMatchCount - settledMatchCount,
          ),
          scheduledMatchCount: activeFixtures.length,
          feePoolPerMatchInr: tournamentMatchFeePoolInr(tournament),
        });
      }
      return summaries;
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

      await this.assertMatchDateAvailable(parsed.matchDate);

      const pollsEnabled =
        parsed.pollsEnabled ?? isImmediateWeekendDate(parsed.matchDate);
      const demoMode = await this.isDemoMode();
      // Production publishes only the current/upcoming weekend. Demo-mode past
      // fixtures remain immediate so Admin can run the post-match payment E2E.
      const publishImmediately =
        isImmediateWeekendDate(parsed.matchDate) ||
        (demoMode && parsed.matchDate < todayIsoDate());
      const now = new Date().toISOString();

      const match = await this.matches.createMatch({
        team_id: MVP_TEAM.id,
        match_date: parsed.matchDate,
        classification: parsed.classification,
        tournament_id: parsed.tournamentId ?? null,
        opposition: parsed.opposition ?? null,
        ground_maps_url: parsed.groundMapsUrl || null,
        start_time: parsed.startTime ?? null,
        match_fees_inr: parsed.matchFeesInr ?? null,
        status: publishImmediately ? "confirmed" : "pending_confirm",
        confirmed_at: publishImmediately ? now : null,
        polls_enabled: pollsEnabled,
        created_by: actor.actorId,
      });

      await this.ensureDraftPolls(match.id);
      if (publishImmediately && match.pollsEnabled) {
        await this.activatePolls(match.id);
        await this.notifyMembersToVote(match);
        void this.notifyWhatsApp(match);
      }
      return match;
    });
  }

  async createWeekendMatches(
    input: CreateWeekendMatchesDto,
    actor: Actor,
  ): Promise<Match[]> {
    return this.run(async () => {
      if (!input.matches?.length) {
        throw this.validation("Select at least one weekend day");
      }

      const dates = input.matches.map((match) => match.matchDate);
      if (new Set(dates).size !== dates.length) {
        throw this.conflict("Select each weekend day only once");
      }

      // Validate the whole weekend before creating either day, avoiding a
      // partial Saturday create when Sunday already exists.
      for (const matchDate of dates) {
        await this.assertMatchDateAvailable(matchDate);
      }

      const created: Match[] = [];
      for (const entry of input.matches) {
        const match = await this.createMatch(entry, actor);
        created.push(match);
      }
      return created;
    });
  }

  async updateMatch(input: UpdateMatchDto, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_EDIT);
      const parsed = updateMatchSchema.parse(input);
      const match = await this.matches.findMatchByIdOrThrow(parsed.matchId);
      if (match.status === "cancelled" || match.status === "completed") {
        throw this.conflict("Cannot edit a cancelled or completed match");
      }
      const demoMode = await this.isDemoMode();
      if (!demoMode && match.matchDate < todayIsoDate()) {
        throw this.conflict("Past matches are read-only");
      }

      if (parsed.matchDate !== undefined) {
        if (!demoMode) {
          throw this.forbidden("Match date can only be changed in demo mode");
        }
        if (!isWeekendDate(parsed.matchDate)) {
          throw this.validation("Match date must be Saturday or Sunday");
        }
        if (parsed.matchDate !== match.matchDate) {
          await this.assertMatchDateAvailable(parsed.matchDate, match.id);
        }
      }

      const classification = parsed.classification ?? match.classification;
      const tournamentId =
        parsed.tournamentId !== undefined
          ? parsed.tournamentId
          : match.tournamentId;
      if (classification === "tournament" && !tournamentId) {
        throw this.validation("Tournament match requires a tournament");
      }
      if (classification === "warmup" && tournamentId) {
        throw this.validation("Warmup matches cannot link a tournament");
      }

      return this.matches.updateMatch(match.id, {
        ...(parsed.matchDate !== undefined
          ? { match_date: parsed.matchDate }
          : {}),
        classification,
        tournament_id: classification === "warmup" ? null : tournamentId,
        opposition:
          parsed.opposition !== undefined
            ? parsed.opposition
            : match.opposition,
        ground_maps_url:
          parsed.groundMapsUrl !== undefined
            ? parsed.groundMapsUrl || null
            : match.groundMapsUrl,
        start_time:
          parsed.startTime !== undefined ? parsed.startTime : match.startTime,
        match_fees_inr:
          parsed.matchFeesInr !== undefined
            ? parsed.matchFeesInr
            : match.matchFeesInr,
        polls_enabled:
          parsed.pollsEnabled !== undefined
            ? parsed.pollsEnabled
            : match.pollsEnabled,
      });
    });
  }

  /**
   * Admin turns on polls for a match (typically a future-weekend fixture).
   * If already confirmed, activates draft polls and notifies the squad.
   */
  async enableMatchPolls(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CONFIRM);
      enableMatchPollsSchema.parse({ matchId });

      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.status === "cancelled" || match.status === "completed") {
        throw this.conflict("Cannot enable polls on a finished match");
      }

      await this.ensureDraftPolls(match.id);
      const enabled = await this.matches.updateMatch(match.id, {
        polls_enabled: true,
      });

      if (enabled.status === "confirmed") {
        await this.activatePolls(enabled.id);
        await this.notifyMembersToVote(enabled);
        void this.notifyWhatsApp(enabled);
      }

      return enabled;
    });
  }

  async getMatchPolls(
    matchId: string,
    actor: Actor,
  ): Promise<MatchPollsSnapshot> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      const match = await this.matches.findMatchByIdOrThrow(matchId);
      const polls = await this.matches.listPollsForMatch(matchId);
      const availabilityPoll =
        polls.find((p) => p.type === "availability") ?? null;
      const carpoolPoll = polls.find((p) => p.type === "carpool") ?? null;

      const availability = availabilityPoll
        ? await this.buildPollSummary(availabilityPoll, actor.actorId)
        : null;
      const carpool = carpoolPoll
        ? await this.buildPollSummary(carpoolPoll, actor.actorId)
        : null;

      const members = await this.teams.listMembershipsWithProfiles({
        teamId: MVP_TEAM.id,
        status: "active",
        limit: 100,
      });

      const availByUser = new Map(
        (availability?.votes ?? []).map((v) => [String(v.userId), v]),
      );
      const carpoolByUser = new Map(
        (carpool?.votes ?? []).map((v) => [String(v.userId), v]),
      );
      const squadMembers = await this.matches.listSquadMembers(match.id);
      const squadUserIds = squadMembers.map((m) => String(m.userId));
      const squadSet = new Set(squadUserIds);

      const roster = members.items.map((m) => {
        const uid = String(m.userId);
        return {
          userId: uid,
          fullName: m.profile.fullName,
          availability: availByUser.get(uid)?.availability ?? null,
          carpool: carpoolByUser.get(uid)?.carpool ?? null,
          inSquad: squadSet.has(uid),
        };
      });

      const availabilityFrozen =
        match.pollsFrozen ||
        availability?.poll.status === "frozen" ||
        availability?.poll.status === "closed";
      const demoMode = await this.isDemoMode();
      const carpoolFrozen =
        carpool?.poll.status === "frozen" ||
        carpool?.poll.status === "closed" ||
        (!demoMode && isMatchStartedIst(match.matchDate, match.startTime));

      return {
        match,
        availability,
        carpool,
        roster,
        availabilityFrozen,
        carpoolFrozen,
        squadFinalized: Boolean(match.squadFinalizedAt),
        squadUserIds,
      };
    });
  }

  async castAvailabilityVote(
    input: CastAvailabilityVoteDto,
    actor: Actor,
  ): Promise<PollVote> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.POLL_VOTE);
      const parsed = castAvailabilityVoteSchema.parse(input);
      const match = await this.matches.findMatchByIdOrThrow(parsed.matchId);
      if (match.status !== "confirmed") {
        throw this.conflict("Polls open after the match is confirmed");
      }
      if (!match.pollsEnabled) {
        throw this.conflict("Polls are not enabled for this match yet");
      }

      const poll = await this.matches.findPoll(match.id, "availability");
      if (!poll || poll.status === "draft") {
        throw this.conflict("Availability poll is not open");
      }

      const isOverride =
        match.pollsFrozen ||
        poll.status === "frozen" ||
        poll.status === "closed";
      if (isOverride) {
        requirePermission(membership.role, PERMISSIONS.MATCH_POLL_OVERRIDE);
      }

      const previous = await this.matches.findVote(poll.id, actor.actorId);

      const vote = await this.matches.upsertVote({
        poll_id: String(poll.id),
        user_id: actor.actorId,
        availability: parsed.vote,
        carpool: null,
      });

      if (previous?.availability === "yes" && parsed.vote === "no") {
        // Fan-out is best-effort: never make the voter wait on it.
        void this.notifyAvailabilityFlip(match, actor.actorId);
      }

      if (
        parsed.vote === "yes" &&
        previous?.availability !== "yes" &&
        !match.pollsFrozen &&
        !match.squadFinalizationPendingAt
      ) {
        const yesCount = await this.matches.countAvailabilityYes(poll.id);
        const { max } = await this.getSquadLimits();
        if (yesCount > max) {
          // Player-triggered fan-out is best-effort and must not delay voting.
          void this.notifyAdminOversubscribedVote(match, yesCount);
        }
      }

      return vote;
    });
  }

  async castCarpoolVote(
    input: CastCarpoolVoteDto,
    actor: Actor,
  ): Promise<PollVote> {
    return this.run(async () => {
      const membership = await requireActiveMembership(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.POLL_VOTE);
      const parsed = castCarpoolVoteSchema.parse(input);
      const match = await this.matches.findMatchByIdOrThrow(parsed.matchId);
      if (match.status !== "confirmed") {
        throw this.conflict("Polls open after the match is confirmed");
      }
      if (!match.pollsEnabled) {
        throw this.conflict("Polls are not enabled for this match yet");
      }

      const poll = await this.matches.findPoll(match.id, "carpool");
      if (!poll || poll.status === "draft") {
        throw this.conflict("Carpool poll is not open");
      }

      // Carpool stays open after availability freeze; locks at kickoff
      // (kickoff lock skipped in demo so past-date fixtures stay votable).
      const demoMode = await this.isDemoMode();
      const isOverride =
        poll.status === "frozen" ||
        poll.status === "closed" ||
        (!demoMode && isMatchStartedIst(match.matchDate, match.startTime));
      if (isOverride) {
        requirePermission(membership.role, PERMISSIONS.MATCH_POLL_OVERRIDE);
      }

      return this.matches.upsertVote({
        poll_id: String(poll.id),
        user_id: actor.actorId,
        availability: null,
        carpool: parsed.vote,
      });
    });
  }

  /**
   * Admin early freeze — locks availability only.
   * Carpool stays open until match kickoff.
   */
  async freezePollsForMatch(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_POLL_OVERRIDE);
      freezePollsSchema.parse({ matchId });
      return this.freezeAvailabilityInternal(matchId);
    });
  }

  /** Used by Cron (service-role) and Admin — freezes availability + maybe auto-squad. */
  async freezeAvailabilityInternal(matchId: string): Promise<Match> {
    const match = await this.matches.findMatchByIdOrThrow(matchId);
    if (match.pollsFrozen && match.squadFinalizedAt) return match;

    const availability = await this.matches.findPoll(match.id, "availability");
    const now = new Date().toISOString();
    const yesUserIds = availability
      ? (await this.matches.listVotes(availability.id))
          .filter((v) => v.availability === "yes")
          .map((v) => String(v.userId))
      : [];
    const yesCount = yesUserIds.length;

    const { min, max } = await this.getSquadLimits();

    // Below minimum, this is a request for more players—not a lock. Mark the
    // pending state so Admin can recruit and explicitly confirm the XI/XII.
    if (yesCount < min) {
      const pending = match.squadFinalizationPendingAt
        ? match
        : await this.matches.updateMatch(match.id, {
            polls_frozen: false,
            squad_finalization_pending_at: now,
          });
      if (!match.squadFinalizationPendingAt) {
        await this.notifyAdminIncomplete(pending, yesCount);
      }
      return pending;
    }

    if (
      availability &&
      (availability.status === "active" || availability.status === "draft")
    ) {
      await this.matches.updatePoll(availability.id, {
        status: "frozen",
        frozen_at: now,
      });
    }

    let frozen = match.pollsFrozen
      ? match
      : await this.matches.updateMatch(match.id, {
          polls_frozen: true,
          squad_finalization_pending_at: null,
        });

    if (yesCount >= min && yesCount <= max) {
      frozen = await this.writeFinalizedSquad(frozen, yesUserIds);
      await this.notifySquadFinalized(frozen, yesCount);
      return frozen;
    }

    return frozen;
  }

  /**
   * Admin picks final 11–12 from the availability pool after oversubscription.
   */
  async finalizePlayingSquad(
    input: { matchId: string; userIds: string[] },
    actor: Actor,
  ): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_POLL_OVERRIDE);
      const parsed = finalizePlayingSquadSchema.parse(input);

      const match = await this.matches.findMatchByIdOrThrow(parsed.matchId);
      if (match.status !== "confirmed") {
        throw this.conflict("Only confirmed matches can finalize a squad");
      }

      const availability = await this.matches.findPoll(
        match.id,
        "availability",
      );
      if (!availability) throw this.notFound("Availability poll not found");

      const demoMode = await this.isDemoMode();
      const { min, max } = await this.getSquadLimits();
      if (parsed.userIds.length < min || parsed.userIds.length > max) {
        throw this.validation(`Playing squad must be ${min}–${max} players`);
      }

      // Demo: Admin may pick any active member. RLS blocks voting for someone
      // else, so the yes votes are seeded by a service-role Server Action.
      if (demoMode) {
        const members = await this.teams.listMemberships({
          teamId: MVP_TEAM.id,
          status: "active",
          limit: 100,
        });
        const activeIds = new Set(members.items.map((m) => String(m.userId)));
        for (const userId of parsed.userIds) {
          if (!activeIds.has(userId)) {
            throw this.validation(
              "Every selected player must be an active member",
            );
          }
        }
        await seedDemoAvailabilityVotesAction({
          matchId: String(match.id),
          userIds: parsed.userIds,
        });
      } else {
        const yesSet = new Set(
          (await this.matches.listVotes(availability.id))
            .filter((v) => v.availability === "yes")
            .map((v) => String(v.userId)),
        );
        for (const userId of parsed.userIds) {
          if (!yesSet.has(userId)) {
            throw this.validation(
              "Every selected player must have voted available",
            );
          }
        }
      }

      if (
        availability.status === "active" ||
        availability.status === "draft" ||
        !match.pollsFrozen
      ) {
        const now = new Date().toISOString();
        if (
          availability.status === "active" ||
          availability.status === "draft"
        ) {
          await this.matches.updatePoll(availability.id, {
            status: "frozen",
            frozen_at: now,
          });
        }
        if (!match.pollsFrozen) {
          await this.matches.updateMatch(match.id, { polls_frozen: true });
        }
      }

      const finalized = await this.writeFinalizedSquad(match, parsed.userIds);
      await this.notifySquadFinalized(finalized, parsed.userIds.length);
      return finalized;
    });
  }

  /**
   * Admin reopen — unlocks availability so players can vote again.
   * Clears any finalized squad so fees cannot use a stale roster.
   */
  async unfreezePollsForMatch(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_POLL_OVERRIDE);
      freezePollsSchema.parse({ matchId });

      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.status !== "confirmed") {
        throw this.conflict("Only confirmed matches can reopen availability");
      }
      if (
        !(await this.isDemoMode()) &&
        isMatchStartedIst(match.matchDate, match.startTime)
      ) {
        throw this.conflict("Cannot unfreeze after the match has started");
      }
      if (!match.pollsFrozen && !match.squadFinalizedAt) return match;

      const availability = await this.matches.findPoll(
        match.id,
        "availability",
      );
      if (availability && availability.status === "frozen") {
        await this.matches.updatePoll(availability.id, {
          status: "active",
          frozen_at: null,
        });
      }

      await this.matches.clearSquadMembers(match.id);
      const opened = await this.matches.updateMatch(match.id, {
        polls_frozen: false,
        squad_finalization_pending_at: null,
        squad_finalized_at: null,
      });
      await this.notifyAvailabilityReopened(opened);
      return opened;
    });
  }

  /** Mark match completed after kickoff + carpool assignment (Admin only). */
  async completeMatch(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CONFIRM);
      completeMatchSchema.parse({ matchId });
      const completed = await this.completeMatchInternal(matchId);

      // Completion is the billing trigger. Regeneration is silent and preserves
      // paid/offline/waived charges while adding this newly completed fixture.
      const weekStartDate = weekendContainingDate(completed.matchDate).saturday;
      await createBrowserPaymentService().generateWeekendSettlementInternal(
        weekStartDate,
      );

      return completed;
    });
  }

  async completeMatchInternal(matchId: string): Promise<Match> {
    const match = await this.matches.findMatchByIdOrThrow(matchId);
    if (match.status === "completed") return match;
    if (match.status !== "confirmed") {
      throw this.conflict("Only confirmed matches can be completed");
    }
    const demoMode = await this.isDemoMode();
    if (!demoMode && !isMatchStartedIst(match.matchDate, match.startTime)) {
      throw this.conflict("Cannot complete a match before kickoff");
    }
    if (!match.pollsFrozen) {
      throw this.conflict("Freeze availability before completing the match");
    }
    if (!match.carpoolAssignedAt) {
      throw this.conflict(
        "Assign carpool rides (or save nobody carpooled) before completing",
      );
    }
    if (!match.squadFinalizedAt) {
      throw this.conflict("Finalize the playing squad before completing");
    }

    await this.freezeCarpoolIfStartedInternal(matchId);
    return this.matches.updateMatch(match.id, { status: "completed" });
  }

  /** Cancel a confirmed match — no fees are generated. */
  async cancelMatch(matchId: string, actor: Actor): Promise<Match> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CONFIRM);
      cancelMatchSchema.parse({ matchId });

      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.status === "cancelled") return match;
      if (
        match.status !== "confirmed" &&
        match.status !== "pending_confirm" &&
        match.status !== "draft"
      ) {
        throw this.conflict("Only scheduled matches can be cancelled");
      }

      const polls = await this.matches.listPollsForMatch(match.id);
      const now = new Date().toISOString();
      for (const poll of polls) {
        if (poll.status !== "closed") {
          await this.matches.updatePoll(poll.id, {
            status: "closed",
            frozen_at: poll.frozenAt ?? now,
          });
        }
      }

      return this.matches.updateMatch(match.id, {
        status: "cancelled",
        polls_frozen: true,
      });
    });
  }

  async listCarpoolAssignments(
    matchId: string,
    actor: Actor,
  ): Promise<MatchCarpoolRide[]> {
    return this.run(async () => {
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      await this.matches.findMatchByIdOrThrow(matchId);
      return this.matches.listCarpoolRides(matchId);
    });
  }

  /**
   * Admin saves post-match driver/passenger rides.
   * Empty rides[] means nobody carpooled (still sets carpool_assigned_at).
   */
  async saveCarpoolAssignments(
    input: {
      matchId: string;
      rides: { driverUserId: string; passengerUserIds: string[] }[];
    },
    actor: Actor,
  ): Promise<{ match: Match; rides: MatchCarpoolRide[] }> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CONFIRM);
      const parsed = saveCarpoolAssignmentsSchema.parse(input);

      const match = await this.matches.findMatchByIdOrThrow(parsed.matchId);
      if (match.status !== "confirmed") {
        throw this.conflict(
          "Carpool can only be assigned on confirmed matches",
        );
      }
      const demoMode = await this.isDemoMode();
      if (!demoMode && !isMatchStartedIst(match.matchDate, match.startTime)) {
        throw this.conflict("Wait until kickoff before assigning carpool");
      }
      if (!match.squadFinalizedAt) {
        throw this.conflict(
          "Finalize the playing squad before assigning carpool",
        );
      }

      if ((await this.matches.listSquadMembers(match.id)).length === 0) {
        throw this.conflict("Playing squad is empty");
      }

      // Drivers/passengers may be any active member — not only the playing squad.
      const members = await this.teams.listMemberships({
        teamId: MVP_TEAM.id,
        status: "active",
        limit: 100,
      });
      const memberIds = new Set(members.items.map((m) => String(m.userId)));

      const drivers = new Set<string>();
      const passengers = new Set<string>();

      for (const ride of parsed.rides) {
        if (!memberIds.has(ride.driverUserId)) {
          throw this.conflict("Driver must be an active team member");
        }
        if (drivers.has(ride.driverUserId)) {
          throw this.conflict("Duplicate driver in carpool assignment");
        }
        drivers.add(ride.driverUserId);

        const uniquePassengers = [...new Set(ride.passengerUserIds)];
        if (uniquePassengers.length === 0) {
          throw this.conflict("Each driver must have at least one passenger");
        }
        for (const passengerId of uniquePassengers) {
          if (!memberIds.has(passengerId)) {
            throw this.conflict("Passenger must be an active team member");
          }
          if (passengerId === ride.driverUserId) {
            throw this.conflict("Driver cannot also be their own passenger");
          }
          if (passengers.has(passengerId) || drivers.has(passengerId)) {
            throw this.conflict(
              "A player can only appear once as driver or passenger",
            );
          }
          passengers.add(passengerId);
        }
      }

      // Drivers must not also be listed as passengers across rides.
      for (const driverId of drivers) {
        if (passengers.has(driverId)) {
          throw this.conflict("A driver cannot also be a passenger");
        }
      }

      const rides = await this.matches.replaceCarpoolRides(
        match.id,
        parsed.rides.map((ride) => ({
          driverUserId: ride.driverUserId,
          passengerUserIds: [...new Set(ride.passengerUserIds)],
        })),
      );

      const updated = await this.matches.updateMatch(match.id, {
        carpool_assigned_at: new Date().toISOString(),
      });

      return { match: updated, rides };
    });
  }

  private async writeFinalizedSquad(
    match: Match,
    userIds: string[],
  ): Promise<Match> {
    const unique = [...new Set(userIds)];
    await this.matches.replaceSquadMembers(match.id, unique);
    return this.matches.updateMatch(match.id, {
      polls_frozen: true,
      squad_finalization_pending_at: null,
      squad_finalized_at: new Date().toISOString(),
    });
  }

  /** Cron helper — freeze carpool once kickoff has passed. */
  async freezeCarpoolIfStartedInternal(matchId: string): Promise<boolean> {
    const match = await this.matches.findMatchByIdOrThrow(matchId);
    if (!isMatchStartedIst(match.matchDate, match.startTime)) return false;

    const carpool = await this.matches.findPoll(match.id, "carpool");
    if (
      !carpool ||
      carpool.status === "frozen" ||
      carpool.status === "closed"
    ) {
      return false;
    }

    await this.matches.updatePoll(carpool.id, {
      status: "frozen",
      frozen_at: new Date().toISOString(),
    });
    return true;
  }

  private async activatePolls(matchId: MatchId | string): Promise<void> {
    const polls = await this.matches.listPollsForMatch(matchId);
    for (const poll of polls) {
      if (poll.status === "draft") {
        await this.matches.updatePoll(poll.id, { status: "active" });
      }
    }
  }

  private async buildPollSummary(
    poll: MatchPoll,
    actorId: string,
  ): Promise<MatchPollSummary> {
    const votes = await this.matches.listVotes(poll.id);
    const myVote =
      votes.find((v) => String(v.userId) === actorId) ??
      (await this.matches.findVote(poll.id, actorId));

    return {
      poll,
      yesCount: votes.filter((v) => v.availability === "yes").length,
      noCount: votes.filter((v) => v.availability === "no").length,
      carpoolCount: votes.filter((v) => v.carpool === "carpool").length,
      selfCount: votes.filter((v) => v.carpool === "self").length,
      votes,
      myVote,
    };
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

  private async assertMatchDateAvailable(
    matchDate: string,
    exceptMatchId?: string,
  ): Promise<void> {
    const existing = await this.matches.findMatchByDate(MVP_TEAM.id, matchDate);
    if (existing && String(existing.id) !== exceptMatchId) {
      throw this.conflict(
        `A match is already scheduled for ${matchDate}. Edit the existing match instead.`,
      );
    }
  }

  /**
   * Demo mode: assign a simple ride — first squad member drives, others ride.
   * With fewer than 2 players, saves "nobody carpooled".
   */
  async seedDemoCarpool(
    matchId: string,
    actor: Actor,
  ): Promise<{ match: Match; rides: MatchCarpoolRide[] }> {
    return this.run(async () => {
      if (!(await this.isDemoMode())) {
        throw this.forbidden("Dummy carpool is only available in demo mode");
      }
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.MATCH_CONFIRM);
      seedDemoCarpoolSchema.parse({ matchId });

      const match = await this.matches.findMatchByIdOrThrow(matchId);
      if (match.status !== "confirmed") {
        throw this.conflict("Confirm the match before assigning carpool");
      }
      if (!match.squadFinalizedAt) {
        throw this.conflict("Finalize the playing squad first");
      }

      const squad = await this.matches.listSquadMembers(match.id);
      const ids = squad.map((m) => String(m.userId));
      const rides =
        ids.length >= 2
          ? [
              {
                driverUserId: ids[0]!,
                passengerUserIds: ids.slice(1),
              },
            ]
          : [];

      return this.saveCarpoolAssignments({ matchId, rides }, actor);
    });
  }

  private async isDemoMode(): Promise<boolean> {
    const team = await this.teams.getMvpTeam();
    return Boolean(team.demoMode);
  }

  private async getSquadLimits(): Promise<{ min: number; max: number }> {
    return squadLimits(await this.isDemoMode());
  }

  private async notifyMembersToVote(match: Match): Promise<void> {
    const { min, max } = await this.getSquadLimits();
    await broadcastTeamNotificationAction({
      type: "match",
      title: "New match — please vote",
      body: `Availability and carpool polls are open for ${match.matchDate}. Target playing squad is ${min}–${max}.`,
      data: { matchId: match.id },
      adminOnly: true,
    });
  }

  private async notifyAvailabilityFlip(
    match: Match,
    fromUserId: string,
  ): Promise<void> {
    try {
      await broadcastTeamNotificationAction({
        type: "poll",
        title: "Squad spot opened",
        body: `Someone dropped out for ${match.matchDate}. Vote if you can play.`,
        data: { matchId: match.id, event: "vote_submitted", fromUserId },
        excludeUserId: fromUserId,
      });
    } catch {
      // Non-blocking
    }
  }

  private async notifySquadFinalized(
    match: Match,
    squadCount: number,
  ): Promise<void> {
    const carpool = await this.matches.findPoll(match.id, "carpool");
    const carpoolVotes = carpool
      ? (await this.matches.listVotes(carpool.id)).filter(
          (v) => v.carpool === "carpool",
        ).length
      : 0;

    await broadcastTeamNotificationAction({
      type: "poll",
      title: "Playing squad locked",
      body: `${squadCount} selected · ${carpoolVotes} carpool so far for ${match.matchDate}. Travel votes stay open until kickoff.`,
      data: {
        matchId: match.id,
        event: "squad_finalized",
        squadCount,
      },
      adminOnly: true,
    });
    void this.postWhatsAppText(
      `Crease: playing squad locked for ${match.matchDate}. ${squadCount} selected. Carpool stays open until kickoff.`,
    );
  }

  private async notifyAdminOversubscribedVote(
    match: Match,
    yesCount: number,
  ): Promise<void> {
    try {
      await broadcastTeamNotificationAction({
        type: "poll",
        title: `${ordinal(yesCount)} player voted available`,
        body: `${yesCount} players are now available for ${match.matchDate}. Finalize the playing squad before freeze time.`,
        data: {
          matchId: match.id,
          event: "squad_oversubscribed",
          yesCount,
        },
        recipients: "admins",
      });
    } catch {
      // Never make the player wait on Admin-only fan-out.
    }
  }

  private async notifyAdminIncomplete(
    match: Match,
    yesCount: number,
  ): Promise<void> {
    const { min, max } = await this.getSquadLimits();
    await broadcastTeamNotificationAction({
      type: "poll",
      title: "Short squad — voting stays open",
      body: `Only ${yesCount} available for ${match.matchDate}. Recruit more players, then confirm the playing ${min}–${max}.`,
      data: {
        matchId: match.id,
        event: "squad_incomplete",
        yesCount,
      },
      adminOnly: true,
      recipients: "admins",
    });
  }

  private async notifyAvailabilityReopened(match: Match): Promise<void> {
    await broadcastTeamNotificationAction({
      type: "poll",
      title: "Squad voting reopened",
      body: `Admin unlocked availability for ${match.matchDate}. Update your vote if needed.`,
      data: { matchId: match.id, event: "availability_reopened" },
      adminOnly: true,
    });
  }

  private async notifyWhatsApp(match: Match): Promise<void> {
    void this.postWhatsAppText(
      `Ranches Thunders match on ${match.matchDate}. Vote availability + carpool in Crease.`,
    );
  }

  private async postWhatsAppText(
    text: string,
    phones?: string[],
  ): Promise<void> {
    const team = await this.teams.getMvpTeam();
    if (!team.whatsappNotifyUrl) return;
    try {
      await fetch(team.whatsappNotifyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          ...(phones && phones.length > 0 ? { phones } : {}),
        }),
      });
    } catch {
      // Non-blocking
    }
  }

  /** Entry fees > 0 require an active Admin payer; zero fees clear the field. */
  private async resolveTournamentFeesPayer(
    totalFeesInr: number,
    feesPaidByUserId: string | null,
  ): Promise<string | null> {
    if (totalFeesInr <= 0) return null;
    if (!feesPaidByUserId) {
      throw this.validation("Select which Admin prepaid the tournament fees");
    }
    const payer = await this.teams.findMembership(
      MVP_TEAM.id,
      feesPaidByUserId,
    );
    if (!payer || payer.status !== "active" || payer.role !== "admin") {
      throw this.validation("Tournament fees payer must be an active Admin");
    }
    return feesPaidByUserId;
  }
}

export function createBrowserMatchService(): MatchService {
  return new MatchService(
    createBrowserMatchRepository(),
    createBrowserTeamRepository(),
  );
}
