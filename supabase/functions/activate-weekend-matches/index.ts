import {
  addDaysIso,
  enqueueForActiveMembers,
  istToday,
  notifyWhatsApp,
  requireCronSecret,
  serviceClient,
} from "../_shared/cron.ts";

const TEAM_SLUG = "ranches-thunders";

/** Saturday/Sunday following the current IST calendar date. */
function upcomingWeekend(today: string): { saturday: string; sunday: string } {
  // Noon UTC preserves the supplied calendar date when calculating weekday.
  const weekday = new Date(`${today}T12:00:00Z`).getUTCDay();
  const daysUntilSaturday = (6 - weekday + 7) % 7;
  const saturday = addDaysIso(today, daysUntilSaturday);
  return { saturday, sunday: addDaysIso(saturday, 1) };
}

/**
 * Monday 09:00 IST publisher for fixtures created ahead of match week.
 * The conditional status update is the retry/concurrency claim: only one
 * invocation can move a pending fixture to confirmed and send notifications.
 */
Deno.serve(async (req) => {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const client = serviceClient();
  const { data: team } = await client
    .from("teams")
    .select("id, demo_mode")
    .eq("slug", TEAM_SLUG)
    .maybeSingle();
  if (!team) {
    return new Response(JSON.stringify({ error: "Team not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const today = istToday();
  const weekend = upcomingWeekend(today);
  const { data: pending, error: pendingError } = await client
    .from("matches")
    .select("id, match_date, polls_enabled")
    .eq("team_id", team.id)
    .eq("status", "pending_confirm")
    .gte("match_date", weekend.saturday)
    .lte("match_date", weekend.sunday);
  if (pendingError) {
    return new Response(JSON.stringify({ error: pendingError.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const squadMin = team.demo_mode ? 4 : 11;
  const squadMax = team.demo_mode ? 4 : 12;
  const confirmed: string[] = [];
  const pollsActivated: string[] = [];

  for (const match of pending ?? []) {
    const now = new Date().toISOString();
    const { data: claimed, error: claimError } = await client
      .from("matches")
      .update({ status: "confirmed", confirmed_at: now })
      .eq("id", match.id)
      .eq("status", "pending_confirm")
      .select("id")
      .maybeSingle();
    if (claimError || !claimed) continue;

    confirmed.push(match.id);
    if (!match.polls_enabled) continue;

    const { error: pollsError } = await client
      .from("polls")
      .update({ status: "active" })
      .eq("match_id", match.id)
      .eq("status", "draft");
    if (pollsError) continue;

    await enqueueForActiveMembers(client, team.id, {
      type: "match",
      title: "This weekend's match — please vote",
      body: `Availability and carpool polls are open for ${match.match_date}. Target playing squad is ${squadMin}–${squadMax}.`,
      data: { matchId: match.id, event: "weekend_published" },
    });
    await notifyWhatsApp(
      client,
      team.id,
      `Ranches Thunders match on ${match.match_date}. Vote availability + carpool in Crease.`,
    );
    pollsActivated.push(match.id);
  }

  return new Response(
    JSON.stringify({
      weekend,
      confirmed,
      pollsActivated,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
