import type {
  AvailabilityVote,
  CarpoolVote,
  MatchClassification,
  MatchStatus,
  MembershipRole,
  MembershipStatus,
  NotificationType,
  PollStatus,
  PollType,
  TournamentStatus,
} from "@/constants/domain/enums";
import {
  brandId,
  brandIdOrNull,
  asJsonValue,
} from "@/repositories/shared/brand";
import type { Tables } from "@/types/database";
import type {
  Match,
  MatchPoll,
  Notification,
  PollVote,
  Profile,
  Team,
  TeamMembership,
  Tournament,
} from "@/types/models";

export function mapProfile(row: Tables<"profiles">): Profile {
  return {
    id: brandId<"ProfileId">(row.id),
    phone: row.phone,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    profileCompletedAt: row.profile_completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTeam(row: Tables<"teams">): Team {
  return {
    id: brandId<"TeamId">(row.id),
    name: row.name,
    slug: row.slug,
    logoUrl: row.logo_url,
    upiVpa: row.upi_vpa,
    whatsappNotifyUrl: row.whatsapp_notify_url,
    carpoolFeeInr: Number(row.carpool_fee_inr),
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTeamMembership(
  row: Tables<"team_memberships">,
): TeamMembership {
  return {
    id: brandId<"TeamMembershipId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    userId: brandId<"ProfileId">(row.user_id),
    role: row.role as MembershipRole,
    status: row.status as MembershipStatus,
    joinedAt: row.joined_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapTournament(row: Tables<"tournaments">): Tournament {
  return {
    id: brandId<"TournamentId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    name: row.name,
    plannedMatchCount: row.planned_match_count,
    totalFeesInr: Number(row.total_fees_inr),
    status: row.status as TournamentStatus,
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMatch(row: Tables<"matches">): Match {
  return {
    id: brandId<"MatchId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    matchDate: row.match_date,
    classification: row.classification as MatchClassification,
    tournamentId: brandIdOrNull<"TournamentId">(row.tournament_id),
    opposition: row.opposition,
    groundMapsUrl: row.ground_maps_url,
    startTime: row.start_time,
    matchFeesInr:
      row.match_fees_inr === null ? null : Number(row.match_fees_inr),
    status: row.status as MatchStatus,
    pollsFrozen: row.polls_frozen,
    confirmedAt: row.confirmed_at,
    createdBy: brandIdOrNull<"ProfileId">(row.created_by),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapMatchPoll(row: Tables<"polls">): MatchPoll {
  return {
    id: brandId<"PollId">(row.id),
    teamId: brandId<"TeamId">(row.team_id),
    matchId: brandId<"MatchId">(row.match_id),
    type: row.type as PollType,
    status: row.status as PollStatus,
    frozenAt: row.frozen_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapPollVote(row: Tables<"poll_votes">): PollVote {
  return {
    id: brandId<"PollVoteId">(row.id),
    pollId: brandId<"PollId">(row.poll_id),
    userId: brandId<"ProfileId">(row.user_id),
    availability: row.availability as AvailabilityVote | null,
    carpool: row.carpool as CarpoolVote | null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapNotification(row: Tables<"notifications">): Notification {
  return {
    id: brandId<"NotificationId">(row.id),
    teamId: brandIdOrNull<"TeamId">(row.team_id),
    userId: brandIdOrNull<"ProfileId">(row.user_id),
    type: row.type as NotificationType,
    title: row.title,
    body: row.body,
    data: asJsonValue(row.data),
    readAt: row.read_at,
    createdAt: row.created_at,
  };
}

export function mapAuditLog(row: Tables<"audit_logs">) {
  return {
    id: brandId<"AuditLogId">(row.id),
    teamId: brandIdOrNull<"TeamId">(row.team_id),
    actorId: brandIdOrNull<"ProfileId">(row.actor_id),
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    metadata: asJsonValue(row.metadata),
    createdAt: row.created_at,
  };
}
