import type { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "@/lib/query/keys";

export const invalidateQueries = {
  auth(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.auth.all() });
  },
  teams(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.teams.all() });
  },
  teamMembers(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.teams.members() });
  },
  matches(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.matches.all() });
  },
  match(client: QueryClient, matchId: string) {
    return client.invalidateQueries({
      queryKey: queryKeys.matches.detail(matchId),
    });
  },
  matchPolls(client: QueryClient, matchId: string) {
    return client.invalidateQueries({
      queryKey: queryKeys.matches.polls(matchId),
    });
  },
  tournaments(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.tournaments.all() });
  },
  notifications(client: QueryClient) {
    return client.invalidateQueries({
      queryKey: queryKeys.notifications.all(),
    });
  },
  dashboard(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.dashboard.all() });
  },
  payments(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.payments.all() });
  },
  fund(client: QueryClient) {
    return client.invalidateQueries({ queryKey: queryKeys.fund.all() });
  },
};
