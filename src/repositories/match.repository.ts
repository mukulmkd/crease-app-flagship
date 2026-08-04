import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import {
  mapMatch,
  mapMatchCarpoolRide,
  mapMatchPoll,
  mapMatchSquadMember,
  mapPollVote,
  mapTournament,
} from "@/repositories/shared/mappers";
import type { RepositoryListParams } from "@/repositories/shared/pagination";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import type {
  MatchId,
  Paginated,
  PollId,
  TeamId,
  TournamentId,
} from "@/types/common";
import type { MatchStatus, PollType } from "@/constants/domain/enums";
import type {
  Match,
  MatchCarpoolRide,
  MatchPoll,
  MatchSquadMember,
  PollVote,
  Tournament,
} from "@/types/models";

export type MatchListFilter = RepositoryListParams & {
  teamId?: TeamId | string;
  status?: MatchStatus;
  fromDate?: string;
  toDate?: string;
};

/**
 * Matches, tournaments, and match polls — CRUD only.
 */
export class MatchRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async findMatchById(id: MatchId | string): Promise<Match | null> {
    const { data, error } = await this.client
      .from("matches")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "match.findById");
    return data ? mapMatch(data) : null;
  }

  async findMatchByIdOrThrow(id: MatchId | string): Promise<Match> {
    const match = await this.findMatchById(id);
    if (!match) throw new AppError("NOT_FOUND", "Match not found", 404);
    return match;
  }

  async listMatchesByIds(ids: string[]): Promise<Match[]> {
    const unique = [...new Set(ids.filter(Boolean))];
    if (unique.length === 0) return [];
    const { data, error } = await this.client
      .from("matches")
      .select("*")
      .in("id", unique);
    this.assertOk(error, "match.listByIds");
    return (data ?? []).map(mapMatch);
  }

  async findMatchByDate(
    teamId: TeamId | string,
    matchDate: string,
  ): Promise<Match | null> {
    const { data, error } = await this.client
      .from("matches")
      .select("*")
      .eq("team_id", teamId)
      .eq("match_date", matchDate)
      .maybeSingle();
    this.assertOk(error, "match.findByDate");
    return data ? mapMatch(data) : null;
  }

  async listMatches(filter: MatchListFilter = {}): Promise<Paginated<Match>> {
    const { limit, offset, from, to } = this.pageRange(filter);
    const { column, ascending } = this.sort(filter, "match_date");

    let query = this.client.from("matches").select("*");
    if (filter.teamId) query = query.eq("team_id", filter.teamId);
    if (filter.status) query = query.eq("status", filter.status);
    if (filter.fromDate) query = query.gte("match_date", filter.fromDate);
    if (filter.toDate) query = query.lte("match_date", filter.toDate);

    const { data, error } = await query
      .order(column, { ascending: ascending === false ? false : true })
      .order("id", { ascending: true })
      .range(from, to);

    this.assertOk(error, "match.list");
    return this.paginate((data ?? []).map(mapMatch), limit, offset);
  }

  async createMatch(input: TablesInsert<"matches">): Promise<Match> {
    const { data, error } = await this.client
      .from("matches")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "match.create");
    return mapMatch(this.requireData(data, "match.create"));
  }

  async updateMatch(
    id: MatchId | string,
    input: TablesUpdate<"matches">,
  ): Promise<Match> {
    const { data, error } = await this.client
      .from("matches")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "match.update");
    return mapMatch(this.requireData(data, "match.update"));
  }

  async listTournaments(
    teamId: TeamId | string,
  ): Promise<Paginated<Tournament>> {
    const { data, error } = await this.client
      .from("tournaments")
      .select("*")
      .eq("team_id", teamId)
      .order("created_at", { ascending: false })
      .limit(50);
    this.assertOk(error, "tournament.list");
    return this.paginate((data ?? []).map(mapTournament), 50, 0);
  }

  async findTournamentById(
    id: TournamentId | string,
  ): Promise<Tournament | null> {
    const { data, error } = await this.client
      .from("tournaments")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "tournament.findById");
    return data ? mapTournament(data) : null;
  }

  async createTournament(
    input: TablesInsert<"tournaments">,
  ): Promise<Tournament> {
    const { data, error } = await this.client
      .from("tournaments")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "tournament.create");
    return mapTournament(this.requireData(data, "tournament.create"));
  }

  async updateTournament(
    id: TournamentId | string,
    input: TablesUpdate<"tournaments">,
  ): Promise<Tournament> {
    const { data, error } = await this.client
      .from("tournaments")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "tournament.update");
    return mapTournament(this.requireData(data, "tournament.update"));
  }

  async listMatchesForTournament(
    tournamentId: TournamentId | string,
  ): Promise<Match[]> {
    const { data, error } = await this.client
      .from("matches")
      .select("*")
      .eq("tournament_id", tournamentId)
      .order("match_date", { ascending: true })
      .order("id", { ascending: true });
    this.assertOk(error, "match.listForTournament");
    return (data ?? []).map(mapMatch);
  }

  async markMatchesFeesSettled(
    matchIds: string[],
    settledAt: string,
  ): Promise<void> {
    const unique = [...new Set(matchIds.filter(Boolean))];
    if (unique.length === 0) return;
    const { error } = await this.client
      .from("matches")
      .update({ fees_settled_at: settledAt })
      .in("id", unique)
      .is("fees_settled_at", null);
    this.assertOk(error, "match.markFeesSettled");
  }

  async findPoll(
    matchId: MatchId | string,
    type: PollType,
  ): Promise<MatchPoll | null> {
    const { data, error } = await this.client
      .from("polls")
      .select("*")
      .eq("match_id", matchId)
      .eq("type", type)
      .maybeSingle();
    this.assertOk(error, "poll.find");
    return data ? mapMatchPoll(data) : null;
  }

  async listPollsForMatch(matchId: MatchId | string): Promise<MatchPoll[]> {
    const { data, error } = await this.client
      .from("polls")
      .select("*")
      .eq("match_id", matchId);
    this.assertOk(error, "poll.listForMatch");
    return (data ?? []).map(mapMatchPoll);
  }

  async createPoll(input: TablesInsert<"polls">): Promise<MatchPoll> {
    const { data, error } = await this.client
      .from("polls")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "poll.create");
    return mapMatchPoll(this.requireData(data, "poll.create"));
  }

  async updatePoll(
    id: PollId | string,
    input: TablesUpdate<"polls">,
  ): Promise<MatchPoll> {
    const { data, error } = await this.client
      .from("polls")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "poll.update");
    return mapMatchPoll(this.requireData(data, "poll.update"));
  }

  async listVotes(pollId: PollId | string): Promise<PollVote[]> {
    const { data, error } = await this.client
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId);
    this.assertOk(error, "poll.listVotes");
    return (data ?? []).map(mapPollVote);
  }

  async findVote(
    pollId: PollId | string,
    userId: string,
  ): Promise<PollVote | null> {
    const { data, error } = await this.client
      .from("poll_votes")
      .select("*")
      .eq("poll_id", pollId)
      .eq("user_id", userId)
      .maybeSingle();
    this.assertOk(error, "poll.findVote");
    return data ? mapPollVote(data) : null;
  }

  async countAvailabilityYes(pollId: PollId | string): Promise<number> {
    const { count, error } = await this.client
      .from("poll_votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", pollId)
      .eq("availability", "yes");
    this.assertOk(error, "poll.countAvailabilityYes");
    return count ?? 0;
  }

  async upsertVote(input: TablesInsert<"poll_votes">): Promise<PollVote> {
    const { data, error } = await this.client
      .from("poll_votes")
      .upsert(input, { onConflict: "poll_id,user_id" })
      .select("*")
      .single();
    this.assertOk(error, "poll.upsertVote");
    return mapPollVote(this.requireData(data, "poll.upsertVote"));
  }

  async listSquadMembers(
    matchId: MatchId | string,
  ): Promise<MatchSquadMember[]> {
    const { data, error } = await this.client
      .from("match_squad_members")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    this.assertOk(error, "squad.list");
    return (data ?? []).map(mapMatchSquadMember);
  }

  async replaceSquadMembers(
    matchId: MatchId | string,
    userIds: string[],
  ): Promise<MatchSquadMember[]> {
    const { error: deleteError } = await this.client
      .from("match_squad_members")
      .delete()
      .eq("match_id", matchId);
    this.assertOk(deleteError, "squad.clear");

    if (userIds.length === 0) return [];

    const { data, error } = await this.client
      .from("match_squad_members")
      .insert(
        userIds.map((userId) => ({
          match_id: String(matchId),
          user_id: userId,
        })),
      )
      .select("*");
    this.assertOk(error, "squad.insert");
    return (data ?? []).map(mapMatchSquadMember);
  }

  async clearSquadMembers(matchId: MatchId | string): Promise<void> {
    const { error } = await this.client
      .from("match_squad_members")
      .delete()
      .eq("match_id", matchId);
    this.assertOk(error, "squad.clear");
  }

  async listCarpoolRides(
    matchId: MatchId | string,
  ): Promise<MatchCarpoolRide[]> {
    const { data: rides, error } = await this.client
      .from("match_carpool_rides")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    this.assertOk(error, "carpool.listRides");

    if (!rides?.length) return [];

    const rideIds = rides.map((r) => r.id);
    const { data: passengers, error: passengerError } = await this.client
      .from("match_carpool_passengers")
      .select("*")
      .in("ride_id", rideIds);
    this.assertOk(passengerError, "carpool.listPassengers");

    const byRide = new Map<string, string[]>();
    for (const row of passengers ?? []) {
      const list = byRide.get(row.ride_id) ?? [];
      list.push(row.passenger_user_id);
      byRide.set(row.ride_id, list);
    }

    return rides.map((ride) =>
      mapMatchCarpoolRide(ride, byRide.get(ride.id) ?? []),
    );
  }

  async replaceCarpoolRides(
    matchId: MatchId | string,
    rides: { driverUserId: string; passengerUserIds: string[] }[],
  ): Promise<MatchCarpoolRide[]> {
    const { error: deleteError } = await this.client
      .from("match_carpool_rides")
      .delete()
      .eq("match_id", matchId);
    this.assertOk(deleteError, "carpool.clearRides");

    if (rides.length === 0) return [];

    const inserted: MatchCarpoolRide[] = [];
    for (const ride of rides) {
      const { data, error } = await this.client
        .from("match_carpool_rides")
        .insert({
          match_id: String(matchId),
          driver_user_id: ride.driverUserId,
        })
        .select("*")
        .single();
      this.assertOk(error, "carpool.insertRide");
      const rideRow = this.requireData(data, "carpool.insertRide");

      if (ride.passengerUserIds.length > 0) {
        const { error: passengerError } = await this.client
          .from("match_carpool_passengers")
          .insert(
            ride.passengerUserIds.map((passengerUserId) => ({
              ride_id: rideRow.id,
              match_id: String(matchId),
              passenger_user_id: passengerUserId,
            })),
          );
        this.assertOk(passengerError, "carpool.insertPassengers");
      }

      inserted.push(mapMatchCarpoolRide(rideRow, ride.passengerUserIds));
    }

    return inserted;
  }
}

export function createBrowserMatchRepository(): MatchRepository {
  return new MatchRepository(createBrowserSupabaseClient());
}
