export type ListKeyParams = Record<string, unknown> | undefined;

export const queryKeys = {
  root: ["crease"] as const,

  auth: {
    all: () => [...queryKeys.root, "auth"] as const,
    session: () => [...queryKeys.auth.all(), "session"] as const,
  },

  teams: {
    all: () => [...queryKeys.root, "teams"] as const,
    detail: () => [...queryKeys.teams.all(), "detail"] as const,
    members: (params?: ListKeyParams) =>
      [...queryKeys.teams.all(), "members", params ?? {}] as const,
    myMembership: () => [...queryKeys.teams.all(), "my-membership"] as const,
  },

  matches: {
    all: () => [...queryKeys.root, "matches"] as const,
    lists: () => [...queryKeys.matches.all(), "list"] as const,
    list: (params?: ListKeyParams) =>
      [...queryKeys.matches.lists(), params ?? {}] as const,
    detail: (matchId: string) =>
      [...queryKeys.matches.all(), "detail", matchId] as const,
    polls: (matchId: string) =>
      [...queryKeys.matches.detail(matchId), "polls"] as const,
  },

  tournaments: {
    all: () => [...queryKeys.root, "tournaments"] as const,
    list: () => [...queryKeys.tournaments.all(), "list"] as const,
  },

  notifications: {
    all: () => [...queryKeys.root, "notifications"] as const,
    list: (params?: ListKeyParams) =>
      [...queryKeys.notifications.all(), "list", params ?? {}] as const,
  },

  dashboard: {
    all: () => [...queryKeys.root, "dashboard"] as const,
    snapshot: () => [...queryKeys.dashboard.all(), "snapshot"] as const,
  },
};
