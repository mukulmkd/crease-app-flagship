import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import { mapTeam, mapTeamMembership } from "@/repositories/shared/mappers";
import type { RepositoryListParams } from "@/repositories/shared/pagination";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import type {
  Paginated,
  ProfileId,
  TeamId,
  TeamMembershipId,
} from "@/types/common";
import type {
  MembershipRole,
  MembershipStatus,
} from "@/constants/domain/enums";
import type {
  Team,
  TeamMembership,
  TeamMembershipWithProfile,
} from "@/types/models";
import { MVP_TEAM } from "@/constants/domain/enums";
import { TEAM_LOGOS_BUCKET } from "@/utils/team-logo";

export type MembershipListFilter = RepositoryListParams & {
  teamId?: TeamId | string;
  userId?: ProfileId | string;
  role?: MembershipRole;
  status?: MembershipStatus;
};

/**
 * Teams + memberships CRUD for Ranches Thunders MVP.
 */
export class TeamRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async getMvpTeam(): Promise<Team> {
    const team = await this.findById(MVP_TEAM.id);
    if (team) return team;
    const bySlug = await this.findBySlug(MVP_TEAM.slug);
    if (!bySlug)
      throw new AppError("NOT_FOUND", "Ranches Thunders not found", 404);
    return bySlug;
  }

  async findById(id: TeamId | string): Promise<Team | null> {
    const { data, error } = await this.client
      .from("teams")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "team.findById");
    return data ? mapTeam(data) : null;
  }

  async findBySlug(slug: string): Promise<Team | null> {
    const { data, error } = await this.client
      .from("teams")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    this.assertOk(error, "team.findBySlug");
    return data ? mapTeam(data) : null;
  }

  async update(
    id: TeamId | string,
    input: TablesUpdate<"teams">,
  ): Promise<Team> {
    const { data, error } = await this.client
      .from("teams")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "team.update");
    return mapTeam(this.requireData(data, "team.update"));
  }

  async findMembership(
    teamId: TeamId | string,
    userId: ProfileId | string,
  ): Promise<TeamMembership | null> {
    const { data, error } = await this.client
      .from("team_memberships")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", userId)
      .maybeSingle();
    this.assertOk(error, "team.findMembership");
    return data ? mapTeamMembership(data) : null;
  }

  async listMemberships(
    filter: MembershipListFilter = {},
  ): Promise<Paginated<TeamMembership>> {
    const { limit, offset, from, to } = this.pageRange(filter);
    const { column, ascending } = this.sort(filter, "joined_at");

    let query = this.client.from("team_memberships").select("*");
    if (filter.teamId) query = query.eq("team_id", filter.teamId);
    if (filter.userId) query = query.eq("user_id", filter.userId);
    if (filter.role) query = query.eq("role", filter.role);
    if (filter.status) query = query.eq("status", filter.status);

    const { data, error } = await query
      .order(column, { ascending })
      .order("id", { ascending })
      .range(from, to);

    this.assertOk(error, "team.listMemberships");
    return this.paginate((data ?? []).map(mapTeamMembership), limit, offset);
  }

  async listMembershipsWithProfiles(
    filter: MembershipListFilter = {},
  ): Promise<Paginated<TeamMembershipWithProfile>> {
    const { limit, offset, from, to } = this.pageRange(filter);
    const { column, ascending } = this.sort(filter, "joined_at");

    let query = this.client
      .from("team_memberships")
      .select("*, profiles:user_id(id, full_name, avatar_url, phone)");
    if (filter.teamId) query = query.eq("team_id", filter.teamId);
    if (filter.userId) query = query.eq("user_id", filter.userId);
    if (filter.role) query = query.eq("role", filter.role);
    if (filter.status) query = query.eq("status", filter.status);

    const { data, error } = await query
      .order(column, { ascending })
      .order("id", { ascending })
      .range(from, to);

    this.assertOk(error, "team.listMembershipsWithProfiles");

    const items = (data ?? []).map((row) => {
      const membership = mapTeamMembership(row);
      const joined = row as unknown as {
        profiles?:
          | {
              id: string;
              full_name: string | null;
              avatar_url: string | null;
              phone: string | null;
            }
          | Array<{
              id: string;
              full_name: string | null;
              avatar_url: string | null;
              phone: string | null;
            }>
          | null;
      };
      const profileRow = Array.isArray(joined.profiles)
        ? joined.profiles[0]
        : joined.profiles;
      return {
        ...membership,
        profile: {
          id: brandProfileId(profileRow?.id ?? String(membership.userId)),
          fullName: profileRow?.full_name ?? null,
          avatarUrl: profileRow?.avatar_url ?? null,
          phone: profileRow?.phone ?? null,
        },
      } satisfies TeamMembershipWithProfile;
    });

    return this.paginate(items, limit, offset);
  }

  async createMembership(
    input: TablesInsert<"team_memberships">,
  ): Promise<TeamMembership> {
    const { data, error } = await this.client
      .from("team_memberships")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "team.createMembership");
    return mapTeamMembership(this.requireData(data, "team.createMembership"));
  }

  async updateMembership(
    id: TeamMembershipId | string,
    input: TablesUpdate<"team_memberships">,
  ): Promise<TeamMembership> {
    const { data, error } = await this.client
      .from("team_memberships")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "team.updateMembership");
    return mapTeamMembership(this.requireData(data, "team.updateMembership"));
  }

  async countActiveAdmins(teamId: TeamId | string): Promise<number> {
    const { count, error } = await this.client
      .from("team_memberships")
      .select("*", { count: "exact", head: true })
      .eq("team_id", teamId)
      .eq("role", "admin")
      .eq("status", "active");
    this.assertOk(error, "team.countActiveAdmins");
    return count ?? 0;
  }

  /** Upload a compressed logo under `{teamId}/{timestamp}.jpg`. */
  async uploadLogo(teamId: TeamId | string, blob: Blob): Promise<string> {
    const path = `${teamId}/${Date.now()}.jpg`;
    const { error } = await this.client.storage
      .from(TEAM_LOGOS_BUCKET)
      .upload(path, blob, { contentType: "image/jpeg", upsert: false });
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
    return path;
  }

  /** Delete a previous logo object in the team-logos bucket. */
  async deleteLogo(path: string): Promise<void> {
    const { error } = await this.client.storage
      .from(TEAM_LOGOS_BUCKET)
      .remove([path]);
    if (error) {
      throw new AppError("EXTERNAL", error.message, 502, error);
    }
  }
}

function brandProfileId(id: string): ProfileId {
  return id as ProfileId;
}

export function createBrowserTeamRepository(): TeamRepository {
  return new TeamRepository(createBrowserSupabaseClient());
}
