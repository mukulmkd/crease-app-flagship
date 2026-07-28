/**
 * Central query-key factory. Feature hooks should compose keys from here
 * to keep cache invalidation consistent.
 *
 * Example (when features exist):
 *   queryKeys.teams.detail(teamId)
 */
export const queryKeys = {
  root: ["crease"] as const,
  auth: {
    session: () => [...queryKeys.root, "auth", "session"] as const,
  },
} as const;
