"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  getMatchService,
  getTeamService,
  invalidateQueries,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";
import { patchPollSnapshot } from "@/features/team/lib/poll-cache";
import { addTeamMemberAction } from "@/services/team-member.actions";
import type {
  AddTeamMemberDto,
  CastAvailabilityVoteDto,
  CastCarpoolVoteDto,
  CreateTournamentDto,
  CreateWeekendMatchesDto,
  ListTeamMembersQuery,
  OverrideVoteDto,
  UpdateMatchDto,
  UpdateMembershipDto,
  UpdateTeamSettingsDto,
} from "@/types/dto";

export function useMvpTeam() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.teams.detail(),
    queryFn: () => {
      requireActor(actor);
      return getTeamService().getTeam(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useMyMembership() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.teams.myMembership(),
    queryFn: () => {
      requireActor(actor);
      return getTeamService().getMyMembership(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useTeamMembers(query: ListTeamMembersQuery = {}) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.teams.members(query),
    queryFn: () => {
      requireActor(actor);
      return getTeamService().listMembers(query, actor);
    },
    enabled: Boolean(actor),
  });
}

export function useAddTeamMember() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: AddTeamMemberDto) => addTeamMemberAction(input),
    onSuccess: async () => {
      await invalidateQueries.teamMembers(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useUpdateMembership() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMembershipDto) => {
      requireActor(actor);
      return getTeamService().updateMembership(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.teamMembers(client);
    },
  });
}

export function useUpdateTeamSettings() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateTeamSettingsDto) => {
      requireActor(actor);
      return getTeamService().updateSettings(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.teams(client);
    },
  });
}

export function useMatches() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.matches.list(),
    queryFn: () => {
      requireActor(actor);
      return getMatchService().listMatches(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useMatch(matchId: string | undefined) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.matches.detail(matchId ?? ""),
    queryFn: () => {
      requireActor(actor);
      return getMatchService().getMatch(matchId!, actor);
    },
    enabled: Boolean(matchId && actor),
  });
}

export function useTournaments() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.tournaments.list(),
    queryFn: () => {
      requireActor(actor);
      return getMatchService().listTournaments(actor);
    },
    enabled: Boolean(actor),
  });
}

export function useTournament(tournamentId: string | null | undefined) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.tournaments.detail(tournamentId ?? ""),
    queryFn: () => {
      requireActor(actor);
      return getMatchService().getTournament(tournamentId!, actor);
    },
    enabled: Boolean(tournamentId && actor),
  });
}

export function useCreateTournament() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTournamentDto) => {
      requireActor(actor);
      return getMatchService().createTournament(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.tournaments(client);
    },
  });
}

export function useCreateWeekendMatches() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWeekendMatchesDto) => {
      requireActor(actor);
      return getMatchService().createWeekendMatches(input, actor);
    },
    onSuccess: async () => {
      await invalidateQueries.matches(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useConfirmMatch() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => {
      requireActor(actor);
      return getMatchService().confirmMatch(matchId, actor);
    },
    onSuccess: async (_data, matchId) => {
      await invalidateQueries.match(client, matchId);
      await invalidateQueries.matches(client);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useEnableMatchPolls() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => {
      requireActor(actor);
      return getMatchService().enableMatchPolls(matchId, actor);
    },
    onSuccess: async (_data, matchId) => {
      await invalidateQueries.match(client, matchId);
      await invalidateQueries.matchPolls(client, matchId);
      await invalidateQueries.matches(client);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useMatchPolls(matchId: string | undefined) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.matches.polls(matchId ?? ""),
    queryFn: () => {
      requireActor(actor);
      return getMatchService().getMatchPolls(matchId!, actor);
    },
    enabled: Boolean(matchId && actor),
  });
}

export function useCastAvailabilityVote() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CastAvailabilityVoteDto) => {
      requireActor(actor);
      return getMatchService().castAvailabilityVote(input, actor);
    },
    onMutate: (input) => {
      if (!actor) return;
      patchPollSnapshot(client, {
        matchId: input.matchId,
        userId: actor.actorId,
        patch: { kind: "availability", vote: input.vote },
      });
    },
    // Refresh in the background — the tap already reflects the new vote.
    onSettled: (_data, _error, input) => {
      void invalidateQueries.matchPolls(client, input.matchId);
      void invalidateQueries.dashboard(client);
      void invalidateQueries.notifications(client);
    },
  });
}

export function useCastCarpoolVote() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: CastCarpoolVoteDto) => {
      requireActor(actor);
      return getMatchService().castCarpoolVote(input, actor);
    },
    onMutate: (input) => {
      if (!actor) return;
      patchPollSnapshot(client, {
        matchId: input.matchId,
        userId: actor.actorId,
        patch: { kind: "carpool", vote: input.vote },
      });
    },
    onSettled: (_data, _error, input) => {
      void invalidateQueries.matchPolls(client, input.matchId);
      void invalidateQueries.dashboard(client);
    },
  });
}

export function useOverrideVote() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: OverrideVoteDto) => {
      requireActor(actor);
      return getMatchService().overrideVote(input, actor);
    },
    onSuccess: async (_data, input) => {
      await invalidateQueries.matchPolls(client, input.matchId);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useUpdateMatch() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateMatchDto) => {
      requireActor(actor);
      return getMatchService().updateMatch(input, actor);
    },
    onSuccess: async (_data, input) => {
      await invalidateQueries.match(client, input.matchId);
      await invalidateQueries.matches(client);
      await invalidateQueries.dashboard(client);
    },
  });
}

export function useFreezePolls() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => {
      requireActor(actor);
      return getMatchService().freezePollsForMatch(matchId, actor);
    },
    onSuccess: async (_data, matchId) => {
      await invalidateQueries.match(client, matchId);
      await invalidateQueries.matchPolls(client, matchId);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useUnfreezePolls() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => {
      requireActor(actor);
      return getMatchService().unfreezePollsForMatch(matchId, actor);
    },
    onSuccess: async (_data, matchId) => {
      await invalidateQueries.match(client, matchId);
      await invalidateQueries.matchPolls(client, matchId);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useFinalizePlayingSquad() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: { matchId: string; userIds: string[] }) => {
      requireActor(actor);
      return getMatchService().finalizePlayingSquad(input, actor);
    },
    onSuccess: async (_data, input) => {
      await invalidateQueries.match(client, input.matchId);
      await invalidateQueries.matchPolls(client, input.matchId);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.notifications(client);
    },
  });
}

export function useCompleteMatch() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => {
      requireActor(actor);
      return getMatchService().completeMatch(matchId, actor);
    },
    onSuccess: async (_data, matchId) => {
      await invalidateQueries.match(client, matchId);
      await invalidateQueries.matches(client);
      await invalidateQueries.matchPolls(client, matchId);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.payments(client);
    },
  });
}

export function useCancelMatch() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (matchId: string) => {
      requireActor(actor);
      return getMatchService().cancelMatch(matchId, actor);
    },
    onSuccess: async (_data, matchId) => {
      await invalidateQueries.match(client, matchId);
      await invalidateQueries.matches(client);
      await invalidateQueries.matchPolls(client, matchId);
      await invalidateQueries.dashboard(client);
      await invalidateQueries.payments(client);
    },
  });
}

export function useCarpoolAssignments(matchId: string | undefined) {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.matches.carpoolAssignments(matchId ?? ""),
    queryFn: () => {
      requireActor(actor);
      return getMatchService().listCarpoolAssignments(matchId!, actor);
    },
    enabled: Boolean(matchId && actor),
  });
}

export function useSaveCarpoolAssignments() {
  const actor = useActor();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      matchId: string;
      rides: { driverUserId: string; passengerUserIds: string[] }[];
    }) => {
      requireActor(actor);
      return getMatchService().saveCarpoolAssignments(input, actor);
    },
    onSuccess: async (_data, input) => {
      await invalidateQueries.match(client, input.matchId);
      await client.invalidateQueries({
        queryKey: queryKeys.matches.carpoolAssignments(input.matchId),
      });
      await invalidateQueries.matchPolls(client, input.matchId);
      await invalidateQueries.dashboard(client);
    },
  });
}
