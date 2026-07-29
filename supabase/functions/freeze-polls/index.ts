import {
  addDaysIso,
  enqueueForActiveMembers,
  istToday,
  notifyWhatsApp,
  requireCronSecret,
  serviceClient,
} from "../_shared/cron.ts";

const TEAM_SLUG = "ranches-thunders";
const SQUAD_MIN = 11;
const SQUAD_MAX = 12;

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

  const now = new Date().toISOString();
  const tomorrow = addDaysIso(istToday(), 1);
  const today = istToday();

  // 1) Availability freeze for tomorrow's confirmed matches (match day − 1).
  const { data: availabilityMatches } = await client
    .from("matches")
    .select(
      "id, match_date, polls_frozen, squad_finalization_pending_at, squad_finalized_at",
    )
    .eq("team_id", team.id)
    .eq("status", "confirmed")
    .eq("match_date", tomorrow);

  const availabilityFrozenIds: string[] = [];
  const squadFinalizedIds: string[] = [];

  for (const match of availabilityMatches ?? []) {
    if (match.squad_finalized_at) continue;

    const { data: avail } = await client
      .from("polls")
      .select("id")
      .eq("match_id", match.id)
      .eq("type", "availability")
      .maybeSingle();

    const { data: yesVotes } = await client
      .from("poll_votes")
      .select("user_id")
      .eq("poll_id", avail?.id ?? "")
      .eq("availability", "yes");
    const yesUserIds = (yesVotes ?? []).map((v) => v.user_id);
    const yesCount = yesUserIds.length;

    if (yesCount < SQUAD_MIN) {
      if (!match.squad_finalization_pending_at) {
        await client
          .from("matches")
          .update({
            polls_frozen: false,
            squad_finalization_pending_at: now,
          })
          .eq("id", match.id);
        await enqueueForActiveMembers(
          client,
          team.id,
          {
            type: "poll",
            title: "Short squad — voting stays open",
            body: `Only ${yesCount} available for ${match.match_date}. Recruit more players, then confirm the playing ${SQUAD_MIN}–${SQUAD_MAX}.`,
            data: {
              matchId: match.id,
              event: "squad_incomplete",
              yesCount,
            },
          },
          { adminsOnly: true },
        );
      }
      continue;
    }

    if (!match.polls_frozen) {
      await client
        .from("polls")
        .update({ status: "frozen", frozen_at: now })
        .eq("match_id", match.id)
        .eq("type", "availability")
        .in("status", ["draft", "active"]);

      await client
        .from("matches")
        .update({
          polls_frozen: true,
          squad_finalization_pending_at: null,
        })
        .eq("id", match.id);

      availabilityFrozenIds.push(match.id);
    }

    const { data: carpool } = await client
      .from("polls")
      .select("id")
      .eq("match_id", match.id)
      .eq("type", "carpool")
      .maybeSingle();
    const { count: carpoolCount } = await client
      .from("poll_votes")
      .select("*", { count: "exact", head: true })
      .eq("poll_id", carpool?.id ?? "")
      .eq("carpool", "carpool");

    if (yesCount >= SQUAD_MIN && yesCount <= SQUAD_MAX) {
      await client
        .from("match_squad_members")
        .delete()
        .eq("match_id", match.id);
      if (yesUserIds.length > 0) {
        await client.from("match_squad_members").insert(
          yesUserIds.map((user_id) => ({
            match_id: match.id,
            user_id,
          })),
        );
      }
      await client
        .from("matches")
        .update({
          polls_frozen: true,
          squad_finalization_pending_at: null,
          squad_finalized_at: now,
        })
        .eq("id", match.id);

      await enqueueForActiveMembers(client, team.id, {
        type: "poll",
        title: "Playing squad locked",
        body: `${yesCount} selected · ${carpoolCount ?? 0} carpool so far for ${match.match_date}. Travel votes stay open until kickoff.`,
        data: {
          matchId: match.id,
          event: "squad_finalized",
          squadCount: yesCount,
        },
      });
      await notifyWhatsApp(
        client,
        team.id,
        `Crease: playing squad locked for ${match.match_date}. ${yesCount} selected. Carpool stays open until kickoff.`,
      );
      squadFinalizedIds.push(match.id);
    }
  }

  // 2) Freeze carpool once kickoff has passed. Admin marks completed after
  // assigning post-match carpool rides — Cron must not auto-complete.
  const { data: startedMatches } = await client
    .from("matches")
    .select("id, match_date, start_time, status, polls_frozen")
    .eq("team_id", team.id)
    .in("status", ["confirmed", "completed"])
    .lte("match_date", today);

  const carpoolFrozenIds: string[] = [];

  for (const match of startedMatches ?? []) {
    if (!isMatchStartedIst(match.match_date, match.start_time)) continue;

    const { data: carpool } = await client
      .from("polls")
      .select("id, status")
      .eq("match_id", match.id)
      .eq("type", "carpool")
      .maybeSingle();
    if (carpool && carpool.status !== "frozen" && carpool.status !== "closed") {
      await client
        .from("polls")
        .update({ status: "frozen", frozen_at: now })
        .eq("id", carpool.id);
      carpoolFrozenIds.push(match.id);
    }
  }

  return new Response(
    JSON.stringify({
      availabilityFrozen: availabilityFrozenIds,
      squadFinalized: squadFinalizedIds,
      carpoolFrozen: carpoolFrozenIds,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
