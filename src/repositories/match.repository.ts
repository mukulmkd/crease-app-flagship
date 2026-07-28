import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import {
  mapMatch,
  mapMatchPoll,
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
import type { Match, MatchPoll, PollVote, Tournament } from "@/types/models";

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

  async upsertVote(input: TablesInsert<"poll_votes">): Promise<PollVote> {
    const { data, error } = await this.client
      .from("poll_votes")
      .upsert(input, { onConflict: "poll_id,user_id" })
      .select("*")
      .single();
    this.assertOk(error, "poll.upsertVote");
    return mapPollVote(this.requireData(data, "poll.upsertVote"));
  }
}

export function createBrowserMatchRepository(): MatchRepository {
  return new MatchRepository(createBrowserSupabaseClient());
}
