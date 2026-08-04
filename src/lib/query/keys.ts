export type ListKeyParams = Record<string, unknown> | undefined;

export const queryKeys = {
  root: ["crease"] as const,

  auth: {
    all: () => [...queryKeys.root, "auth"] as const,
    profile: () => [...queryKeys.auth.all(), "profile"] as const,
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
    carpoolAssignments: (matchId: string) =>
      [...queryKeys.matches.detail(matchId), "carpool-assignments"] as const,
  },

  tournaments: {
    all: () => [...queryKeys.root, "tournaments"] as const,
    list: () => [...queryKeys.tournaments.all(), "list"] as const,
  },

  notifications: {
    all: () => [...queryKeys.root, "notifications"] as const,
    list: (params?: ListKeyParams) =>
      [...queryKeys.notifications.all(), "list", params ?? {}] as const,
    unreadCount: () =>
      [...queryKeys.notifications.all(), "unread-count"] as const,
  },

  payments: {
    all: () => [...queryKeys.root, "payments"] as const,
    myWeekendDues: () =>
      [...queryKeys.payments.all(), "my-weekend-dues"] as const,
    adminWeekendDues: () =>
      [...queryKeys.payments.all(), "admin-weekend-dues"] as const,
    settlements: () => [...queryKeys.payments.all(), "settlements"] as const,
    weekendFeeGenerateStatus: (weekStartDate: string) =>
      [
        ...queryKeys.payments.all(),
        "fee-generate-status",
        weekStartDate,
      ] as const,
    adminReimbursements: () =>
      [...queryKeys.payments.all(), "admin-reimbursements"] as const,
    matchReport: (matchId: string) =>
      [...queryKeys.payments.all(), "match-report", matchId] as const,
    matchCollectionStatuses: () =>
      [...queryKeys.payments.all(), "match-collection-statuses"] as const,
    weekendSummary: (settlementId: string) =>
      [...queryKeys.payments.all(), "weekend-summary", settlementId] as const,
  },

  fund: {
    all: () => [...queryKeys.root, "fund"] as const,
    hub: () => [...queryKeys.fund.all(), "hub"] as const,
  },

  dashboard: {
    all: () => [...queryKeys.root, "dashboard"] as const,
    snapshot: () => [...queryKeys.dashboard.all(), "snapshot"] as const,
  },
};
