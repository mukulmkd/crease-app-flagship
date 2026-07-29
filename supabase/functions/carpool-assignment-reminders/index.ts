import {
  istToday,
  enqueueForActiveMembers,
  listMemberPhones,
  notifyWhatsApp,
  requireCronSecret,
  serviceClient,
} from "../_shared/cron.ts";

const TEAM_SLUG = "ranches-thunders";

/** True when Asia/Kolkata now is past match kickoff. Missing time → end of match day. */
function isMatchStartedIst(
  matchDate: string,
  startTime: string | null | undefined,
): boolean {
  const raw = startTime?.trim() || "23:59:59";
  const parts = raw.split(":");
  const hours = (parts[0] ?? "23").padStart(2, "0");
  const minutes = (parts[1] ?? "59").padStart(2, "0");
  const seconds = (parts[2] ?? "00").padStart(2, "0");
  const kickoff = new Date(`${matchDate}T${hours}:${minutes}:${seconds}+05:30`);
  if (Number.isNaN(kickoff.getTime())) return false;
  return Date.now() >= kickoff.getTime();
}

Deno.serve(async (req) => {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  const client = serviceClient();
  const { data: team } = await client
    .from("teams")
    .select("id")
    .eq("slug", TEAM_SLUG)
    .maybeSingle();
  if (!team) {
    return new Response(JSON.stringify({ error: "Team not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const today = istToday();
  const now = new Date().toISOString();

  const { data: matches } = await client
    .from("matches")
    .select(
      "id, match_date, start_time, carpool_assigned_at, carpool_assignment_reminded_at",
    )
    .eq("team_id", team.id)
    .eq("status", "confirmed")
    .eq("match_date", today)
    .is("carpool_assigned_at", null)
    .is("carpool_assignment_reminded_at", null);

  const reminded: string[] = [];
  const adminPhones = await listMemberPhones(client, team.id, {
    adminsOnly: true,
  });

  for (const match of matches ?? []) {
    if (!isMatchStartedIst(match.match_date, match.start_time)) continue;

    const { data: claimed } = await client
      .from("matches")
      .update({ carpool_assignment_reminded_at: now })
      .eq("id", match.id)
      .is("carpool_assignment_reminded_at", null)
      .is("carpool_assigned_at", null)
      .select("id")
      .maybeSingle();

    if (!claimed) continue;

    await enqueueForActiveMembers(
      client,
      team.id,
      {
        type: "match",
        title: "Assign today’s carpool",
        body: `Open ${match.match_date} and assign drivers + passengers, then mark the match complete (or cancel if it didn’t happen).`,
        data: {
          matchId: match.id,
          event: "carpool_assignment_reminder",
        },
      },
      { adminsOnly: true },
    );

    await notifyWhatsApp(
      client,
      team.id,
      `Crease: assign carpool for ${match.match_date} — drivers & passengers, then complete or cancel the match.`,
      adminPhones,
    );

    reminded.push(match.id);
  }

  return new Response(JSON.stringify({ reminded }), {
    headers: { "Content-Type": "application/json" },
  });
});
