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
import { addTeamMemberAction } from "@/services/team-member.actions";
import type {
  AddTeamMemberDto,
  CreateTournamentDto,
  CreateWeekendMatchesDto,
  ListTeamMembersQuery,
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
