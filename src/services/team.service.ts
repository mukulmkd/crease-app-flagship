import { MVP_TEAM } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  listMembersQuerySchema,
  updateMembershipSchema,
  updateTeamSettingsSchema,
} from "@/lib/validations/identity";
import type { AuditLogRepository } from "@/repositories/audit-log.repository";
import type { NotificationRepository } from "@/repositories/notification.repository";
import {
  createBrowserAuditLogRepository,
  createBrowserNotificationRepository,
  createBrowserTeamRepository,
  createBrowserUserRepository,
} from "@/repositories";
import type { TeamRepository } from "@/repositories/team.repository";
import type { UserRepository } from "@/repositories/user.repository";
import type {
  AddTeamMemberDto,
  ListTeamMembersQuery,
  UpdateMembershipDto,
  UpdateTeamSettingsDto,
} from "@/types/dto";
import type { Paginated, ProfileId } from "@/types/common";
import type {
  Team,
  TeamMembership,
  TeamMembershipWithProfile,
} from "@/types/models";
import { BaseService, type ServiceActor } from "@/services/base.service";
import {
  requireActiveMembership,
  requireAdmin,
} from "@/services/shared/membership";

type Actor = ServiceActor | { actorId: ProfileId | string };

/**
 * Team service — Ranches Thunders membership + settings.
 * Adding members by phone uses the server action (service role).
 */
export class TeamService extends BaseService {
  protected readonly serviceName = "team.service";

  constructor(
    private readonly teams: TeamRepository,
    private readonly users: UserRepository,
    private readonly notifications: NotificationRepository,
    private readonly audits: AuditLogRepository,
  ) {
    super();
  }

  async getTeam(actor: Actor): Promise<Team> {
    return this.run(async () => {
      const team = await this.teams.getMvpTeam();
      await requireActiveMembership(this.teams, team.id, actor.actorId);
      return team;
    });
  }

  async getMyMembership(actor: Actor): Promise<TeamMembership> {
    return this.run(async () => {
      const team = await this.teams.getMvpTeam();
      return requireActiveMembership(this.teams, team.id, actor.actorId);
    });
  }

  async listMembers(
    query: ListTeamMembersQuery,
    actor: Actor,
  ): Promise<Paginated<TeamMembershipWithProfile>> {
    return this.run(async () => {
      const parsed = listMembersQuerySchema.parse({
        ...query,
        teamId: MVP_TEAM.id,
      });
      await requireActiveMembership(this.teams, MVP_TEAM.id, actor.actorId);
      return this.teams.listMembershipsWithProfiles({
        teamId: MVP_TEAM.id,
        status: parsed.status,
        role: parsed.role,
        limit: parsed.limit,
        cursor: parsed.cursor,
      });
    });
  }

  async updateSettings(
    input: UpdateTeamSettingsDto,
    actor: Actor,
  ): Promise<Team> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TEAM_SETTINGS_EDIT);
      const parsed = updateTeamSettingsSchema.parse(input);
      return this.teams.update(MVP_TEAM.id, {
        name: parsed.name,
        logo_url: parsed.logoUrl,
        upi_vpa: parsed.upiVpa,
        whatsapp_notify_url: parsed.whatsappNotifyUrl,
      });
    });
  }

  async updateMembership(
    input: UpdateMembershipDto,
    actor: Actor,
  ): Promise<TeamMembership> {
    return this.run(async () => {
      const admin = await requireAdmin(this.teams, MVP_TEAM.id, actor.actorId);
      requirePermission(admin.role, PERMISSIONS.TEAM_MEMBER_REMOVE);
      const parsed = updateMembershipSchema.parse(input);

      const page = await this.teams.listMemberships({
        teamId: MVP_TEAM.id,
        limit: 100,
      });
      const target = page.items.find((m) => m.id === parsed.membershipId);
      if (!target) throw this.notFound("Membership not found");

      if (
        target.role === "admin" &&
        target.status === "active" &&
        (parsed.role === "player" ||
          parsed.status === "left" ||
          parsed.status === "suspended")
      ) {
        const admins = await this.teams.countActiveAdmins(MVP_TEAM.id);
        if (admins <= 1) {
          throw this.conflict("Cannot remove or demote the last Admin");
        }
      }

      return this.teams.updateMembership(parsed.membershipId, {
        role: parsed.role,
        status: parsed.status,
      });
    });
  }
}

export function createBrowserTeamService(): TeamService {
  return new TeamService(
    createBrowserTeamRepository(),
    createBrowserUserRepository(),
    createBrowserNotificationRepository(),
    createBrowserAuditLogRepository(),
  );
}

/** Re-export for hooks that still expect add-member typing. */
export type { AddTeamMemberDto };
