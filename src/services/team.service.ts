import { MVP_TEAM } from "@/constants/domain/enums";
import { PERMISSIONS } from "@/constants/domain/team-permissions";
import { requirePermission } from "@/lib/rbac/team-permissions";
import {
  assignPaymentCollectorSchema,
  listMembersQuerySchema,
  updateMembershipSchema,
  updateTeamSettingsSchema,
} from "@/lib/validations/identity";
import { createBrowserTeamRepository } from "@/repositories";
import type { TeamRepository } from "@/repositories/team.repository";
import type {
  AssignPaymentCollectorDto,
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
import { teamLogoStoragePath } from "@/utils/team-logo";

type Actor = ServiceActor | { actorId: ProfileId | string };

/**
 * Team service — Ranches Thunders membership + settings.
 * Adding members by phone uses the server action (service role).
 */
export class TeamService extends BaseService {
  protected readonly serviceName = "team.service";

  constructor(private readonly teams: TeamRepository) {
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
      const patch: {
        name?: string;
        logo_url?: string | null;
        upi_vpa?: string | null;
        whatsapp_notify_url?: string | null;
        demo_mode?: boolean;
      } = {};
      if (parsed.name !== undefined) patch.name = parsed.name;
      if (parsed.logoUrl !== undefined) patch.logo_url = parsed.logoUrl;
      if (parsed.upiVpa !== undefined) patch.upi_vpa = parsed.upiVpa;
      if (parsed.whatsappNotifyUrl !== undefined) {
        patch.whatsapp_notify_url = parsed.whatsappNotifyUrl;
      }
      if (parsed.demoMode !== undefined) patch.demo_mode = parsed.demoMode;
      return this.teams.update(MVP_TEAM.id, patch);
    });
  }

  /**
   * Exactly one Admin collects weekend UPI. Sets team.upi_vpa to their VPA.
   * Call PaymentService.autoSettleCollectorDues after this so their own lines close.
   */
  async assignPaymentCollector(
    input: AssignPaymentCollectorDto,
    actor: Actor,
  ): Promise<Team> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TEAM_SETTINGS_EDIT);
      const parsed = assignPaymentCollectorSchema.parse(input);

      const target = await this.teams.findMembership(
        MVP_TEAM.id,
        parsed.userId,
      );
      if (!target || target.status !== "active" || target.role !== "admin") {
        throw this.conflict("Collector must be an active Admin");
      }

      return this.teams.update(MVP_TEAM.id, {
        collector_user_id: parsed.userId,
        upi_vpa: parsed.upiVpa,
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
        const team = await this.teams.getMvpTeam();
        if (
          team.collectorUserId &&
          String(team.collectorUserId) === String(target.userId)
        ) {
          throw this.conflict(
            "Assign another payment collector before demoting or removing this Admin",
          );
        }
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

  /** Admin upload — square-cropped JPEG path stored on `teams.logo_url`. */
  async updateTeamLogo(blob: Blob, actor: Actor): Promise<Team> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TEAM_SETTINGS_EDIT);

      const existing = await this.teams.getMvpTeam();
      const previousPath = teamLogoStoragePath(existing.logoUrl);
      const nextPath = await this.teams.uploadLogo(MVP_TEAM.id, blob);
      const team = await this.teams.update(MVP_TEAM.id, {
        logo_url: nextPath,
      });

      if (previousPath && previousPath !== nextPath) {
        try {
          await this.teams.deleteLogo(previousPath);
        } catch (error) {
          this.warn("updateTeamLogo.delete_old_failed", {
            path: previousPath,
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }

      return team;
    });
  }

  async removeTeamLogo(actor: Actor): Promise<Team> {
    return this.run(async () => {
      const membership = await requireAdmin(
        this.teams,
        MVP_TEAM.id,
        actor.actorId,
      );
      requirePermission(membership.role, PERMISSIONS.TEAM_SETTINGS_EDIT);

      const existing = await this.teams.getMvpTeam();
      const previousPath = teamLogoStoragePath(existing.logoUrl);
      const team = await this.teams.update(MVP_TEAM.id, { logo_url: null });

      if (previousPath) {
        try {
          await this.teams.deleteLogo(previousPath);
        } catch (error) {
          this.warn("removeTeamLogo.delete_failed", {
            path: previousPath,
            message: error instanceof Error ? error.message : "unknown",
          });
        }
      }

      return team;
    });
  }
}

export function createBrowserTeamService(): TeamService {
  return new TeamService(createBrowserTeamRepository());
}
