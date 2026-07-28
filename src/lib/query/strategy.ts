/**
 * Invalidation strategy (canonical):
 *
 * 1. Prefer hierarchical keys from `queryKeys` — never hardcode key arrays in features.
 * 2. Mutations call `invalidateQueries.*` helpers after success (or via useOptimisticMutation settle).
 * 3. Domain writes invalidate:
 *    - detail key of the changed entity
 *    - related list keys for that team/scope
 *    - cross-domain keys when side effects exist (e.g. payment create → notifications)
 * 4. Auth sign-out clears the entire client cache.
 * 5. Optimistic mutations snapshot → patch → rollback on error → invalidate on settle.
 *
 * Scope cheat sheet:
 * | Mutation              | Invalidate                                      |
 * |-----------------------|-------------------------------------------------|
 * | team create/join/leave| teams.all / team.detail                         |
 * | membership change     | team.detail (covers members)                    |
 * | poll CRUD / vote      | pollMutation (detail + team lists + dashboard)  |
 * | event CRUD / lifecycle| eventMutation (detail + lists + avail/transport + dashboard) |
 * | availability RSVP     | availabilityMutation (event + team + dashboard) |
 * | transport offer/request| transportMutation (event + assignment + dashboard)|
 * | tournament / match    | tournaments.all + tournament.detail             |
 * | expense approve/reject| expenses list (optimistic) + lists              |
 * | payment mark paid     | payments list (optimistic) + lists              |
 * | notification read     | notifications list (optimistic)                 |
 * | sign out              | queryClient.clear()                             |
 */
export {};
