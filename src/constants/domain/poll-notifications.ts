/**
 * Poll in-app notification events (payload.event).
 * Titles are user-facing; services decide when to enqueue.
 */
export const POLL_NOTIFICATION_EVENTS = [
  "created",
  "vote_submitted",
  "closed",
  "reminder",
  "cancelled",
] as const;

export type PollNotificationEvent = (typeof POLL_NOTIFICATION_EVENTS)[number];

export const POLL_NOTIFICATION_TITLES: Record<PollNotificationEvent, string> = {
  created: "Poll Created",
  vote_submitted: "Vote Submitted",
  closed: "Poll Closed",
  reminder: "Poll Reminder",
  cancelled: "Poll Cancelled",
};

/** Stable key — services skip enqueue when a matching row exists. */
export function pollNotificationIdempotencyKey(params: {
  event: PollNotificationEvent;
  pollId: string;
  userId: string;
  /** For vote_submitted: the voter, so each voter notifies once. */
  fromUserId?: string;
  /** Optional day bucket for recurring reminders (YYYY-MM-DD). */
  day?: string;
}): string {
  const parts = ["poll", params.pollId, params.event, params.userId];
  if (params.fromUserId) parts.push("from", params.fromUserId);
  if (params.day) parts.push(params.day);
  return parts.join(":");
}
