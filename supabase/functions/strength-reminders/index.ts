import {
  istToday,
  listMemberPhones,
  notifyWhatsApp,
  requireCronSecret,
  serviceClient,
} from "../_shared/cron.ts";

const TEAM_SLUG = "ranches-thunders";
const SQUAD_MIN = 11;

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
  const { data: matches } = await client
    .from("matches")
    .select("id, match_date, polls_frozen")
    .eq("team_id", team.id)
    .eq("status", "confirmed")
    .eq("polls_frozen", false)
    .gte("match_date", today);

  const reminded: string[] = [];

  for (const match of matches ?? []) {
    const { data: avail } = await client
      .from("polls")
      .select("id")
      .eq("match_id", match.id)
      .eq("type", "availability")
      .maybeSingle();
    if (!avail) continue;

    const { count: yesCount } = await client
      .from("poll_votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", avail.id)
      .eq("availability", "yes");

    if ((yesCount ?? 0) >= SQUAD_MIN) continue;

    const { data: voters } = await client
      .from("poll_votes")
      .select("user_id")
      .eq("poll_id", avail.id);
    const voted = new Set((voters ?? []).map((v) => v.user_id));

    const { data: members } = await client
      .from("team_memberships")
      .select("user_id")
      .eq("team_id", team.id)
      .eq("status", "active");

    const nonVoterIds: string[] = [];
    for (const member of members ?? []) {
      if (voted.has(member.user_id)) continue;
      nonVoterIds.push(member.user_id);
      await client.from("notifications").insert({
        team_id: team.id,
        user_id: member.user_id,
        type: "poll",
        title: "Squad still short — please vote",
        body: `Only ${yesCount ?? 0}/${SQUAD_MIN} for ${match.match_date}. Vote availability in Crease.`,
        data: { matchId: match.id, event: "reminder", day: today },
      });
    }

    if (nonVoterIds.length > 0) {
      const phones = await listMemberPhones(client, team.id, {
        userIds: nonVoterIds,
      });
      await notifyWhatsApp(
        client,
        team.id,
        `Crease: squad short for ${match.match_date} (${yesCount ?? 0}/${SQUAD_MIN}). Please vote availability.`,
        phones,
      );
    }

    reminded.push(match.id);
  }

  return new Response(JSON.stringify({ reminded }), {
    headers: { "Content-Type": "application/json" },
  });
});
