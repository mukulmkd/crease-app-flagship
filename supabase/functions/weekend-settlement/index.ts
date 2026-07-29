import {
  addDaysIso,
  enqueueForUsers,
  istToday,
  listMemberPhones,
  notifyWhatsApp,
  requireCronSecret,
  serviceClient,
} from "../_shared/cron.ts";

const TEAM_SLUG = "ranches-thunders";
const CARPOOL_FEE = 100;
const PROTECTED_STATUSES = new Set(["paid", "offline_paid", "waived"]);
const PROTECTED_REIMBURSE = new Set(["paid", "offline_paid"]);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Find Saturday of the current/just-ended weekend in IST. */
function weekendSaturdayIso(): string {
  const today = istToday();
  const [y, m, d] = today.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 6, 30));
  const weekday = new Date(
    date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
  ).getDay();
  let delta = 0;
  if (weekday === 0) delta = -1;
  else if (weekday !== 6) delta = 6 - weekday;
  return addDaysIso(today, delta);
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

  const saturday = weekendSaturdayIso();
  const sunday = addDaysIso(saturday, 1);

  let { data: settlement } = await client
    .from("weekend_settlements")
    .select("*")
    .eq("team_id", team.id)
    .eq("week_start_date", saturday)
    .maybeSingle();

  if (settlement?.status === "settled") {
    return new Response(
      JSON.stringify({
        settlementId: settlement.id,
        skipped: true,
        reason: "already_settled",
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  if (!settlement) {
    const { data: created } = await client
      .from("weekend_settlements")
      .insert({
        team_id: team.id,
        week_start_date: saturday,
        status: "collecting",
        notified_at: null,
      })
      .select("*")
      .single();
    settlement = created;
  } else {
    await client
      .from("weekend_settlements")
      .update({ status: "collecting" })
      .eq("id", settlement.id);
  }

  if (!settlement) {
    return new Response(
      JSON.stringify({ error: "Could not create settlement" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  const { data: matches } = await client
    .from("matches")
    .select("*")
    .eq("team_id", team.id)
    .in("match_date", [saturday, sunday])
    .eq("status", "completed")
    .not("squad_finalized_at", "is", null)
    .not("carpool_assigned_at", "is", null);

  let chargeCount = 0;
  const chargedUserIds = new Set<string>();

  for (const match of matches ?? []) {
    const { data: squad } = await client
      .from("match_squad_members")
      .select("user_id")
      .eq("match_id", match.id);
    if (!squad?.length) continue;

    const { data: rides } = await client
      .from("match_carpool_rides")
      .select("id, driver_user_id")
      .eq("match_id", match.id);
    const rideIds = (rides ?? []).map((r) => r.id);
    const { data: passengers } = rideIds.length
      ? await client
          .from("match_carpool_passengers")
          .select("ride_id, passenger_user_id")
          .in("ride_id", rideIds)
      : { data: [] as { ride_id: string; passenger_user_id: string }[] };

    const passengersByRide = new Map<string, string[]>();
    for (const row of passengers ?? []) {
      const list = passengersByRide.get(row.ride_id) ?? [];
      list.push(row.passenger_user_id);
      passengersByRide.set(row.ride_id, list);
    }

    const passengerFees = new Map<string, number>();
    const driverCredits = new Map<string, number>();
    for (const ride of rides ?? []) {
      const pax = passengersByRide.get(ride.id) ?? [];
      driverCredits.set(
        ride.driver_user_id,
        (driverCredits.get(ride.driver_user_id) ?? 0) +
          pax.length * CARPOOL_FEE,
      );
      for (const passengerId of pax) {
        passengerFees.set(passengerId, CARPOOL_FEE);
      }
    }

    const squadUserIds = squad.map((m) => m.user_id);
    squadUserIds.forEach((userId) => chargedUserIds.add(userId));
    const totalFees = Number(match.match_fees_inr ?? 0);
    const share = totalFees > 0 ? round2(totalFees / squadUserIds.length) : 0;

    for (const member of squad) {
      const { data: existing } = await client
        .from("settlement_charges")
        .select("id, status")
        .eq("match_id", match.id)
        .eq("user_id", member.user_id)
        .maybeSingle();
      if (existing && PROTECTED_STATUSES.has(existing.status)) continue;

      const carpoolFee = passengerFees.get(member.user_id) ?? 0;
      const carpoolCredit = driverCredits.get(member.user_id) ?? 0;
      const provisional = round2(share + carpoolFee - carpoolCredit);
      await client.from("settlement_charges").upsert(
        {
          settlement_id: settlement.id,
          match_id: match.id,
          team_id: team.id,
          user_id: member.user_id,
          match_fee_share_inr: share,
          carpool_fee_inr: carpoolFee,
          carpool_credit_inr: carpoolCredit,
          total_inr: Math.max(0, provisional),
          status: "pending",
        },
        { onConflict: "match_id,user_id" },
      );
      chargeCount += 1;
    }

    const { data: pending } = await client
      .from("settlement_charges")
      .select("id, user_id, status")
      .eq("match_id", match.id)
      .eq("status", "pending");
    const keep = new Set(squadUserIds);
    const orphanIds = (pending ?? [])
      .filter((row) => !keep.has(row.user_id))
      .map((row) => row.id);
    if (orphanIds.length > 0) {
      await client.from("settlement_charges").delete().in("id", orphanIds);
    }
  }

  // Weekend netting across this settlement's pending charges.
  const { data: allCharges } = await client
    .from("settlement_charges")
    .select("*")
    .eq("settlement_id", settlement.id);

  const byUser = new Map<string, typeof allCharges>();
  for (const charge of allCharges ?? []) {
    const list = byUser.get(charge.user_id) ?? [];
    list.push(charge);
    byUser.set(charge.user_id, list);
  }

  const reimbursementUserIds: string[] = [];
  for (const [userId, userCharges] of byUser) {
    const pending = (userCharges ?? []).filter((c) => c.status === "pending");
    if (pending.length === 0) continue;

    const owed = pending.reduce(
      (sum, c) =>
        sum + Number(c.match_fee_share_inr) + Number(c.carpool_fee_inr),
      0,
    );
    const credit = pending.reduce(
      (sum, c) => sum + Number(c.carpool_credit_inr),
      0,
    );
    const net = round2(owed - credit);

    if (net > 0) {
      let remaining = net;
      for (let i = 0; i < pending.length; i += 1) {
        const charge = pending[i]!;
        const isLast = i === pending.length - 1;
        const lineCap = round2(
          Number(charge.match_fee_share_inr) + Number(charge.carpool_fee_inr),
        );
        const amount = isLast ? remaining : Math.min(remaining, lineCap);
        remaining = round2(remaining - amount);
        await client
          .from("settlement_charges")
          .update({ total_inr: Math.max(0, amount) })
          .eq("id", charge.id);
      }
    } else {
      for (const charge of pending) {
        await client
          .from("settlement_charges")
          .update({ total_inr: 0 })
          .eq("id", charge.id);
      }
      if (net < 0) {
        reimbursementUserIds.push(userId);
        const { data: existing } = await client
          .from("settlement_reimbursements")
          .select("id, status")
          .eq("settlement_id", settlement.id)
          .eq("user_id", userId)
          .maybeSingle();
        if (existing && PROTECTED_REIMBURSE.has(existing.status)) continue;
        await client.from("settlement_reimbursements").upsert(
          {
            settlement_id: settlement.id,
            team_id: team.id,
            user_id: userId,
            amount_inr: Math.abs(net),
            status: "pending",
          },
          { onConflict: "settlement_id,user_id" },
        );
      }
    }
  }

  const { data: pendingReimburse } = await client
    .from("settlement_reimbursements")
    .select("id, user_id, status")
    .eq("settlement_id", settlement.id)
    .eq("status", "pending");
  const keepReimburse = new Set(reimbursementUserIds);
  const orphanReimburse = (pendingReimburse ?? [])
    .filter((row) => !keepReimburse.has(row.user_id))
    .map((row) => row.id);
  if (orphanReimburse.length > 0) {
    await client
      .from("settlement_reimbursements")
      .delete()
      .in("id", orphanReimburse);
  }

  // Claim the one weekend notification before delivery.
  let notificationSent = false;
  const notifyUserIds = [...chargedUserIds];
  if (notifyUserIds.length > 0 && !settlement.notified_at) {
    const notificationTime = new Date().toISOString();
    const { data: claimed } = await client
      .from("weekend_settlements")
      .update({ notified_at: notificationTime })
      .eq("id", settlement.id)
      .is("notified_at", null)
      .select("id")
      .maybeSingle();

    if (claimed) {
      await enqueueForUsers(client, team.id, notifyUserIds, {
        type: "payment",
        title: "Weekend fees ready",
        body: "Pay your match + carpool share via UPI and submit UTR in Crease.",
        data: { settlementId: settlement.id },
      });
      const phones = await listMemberPhones(client, team.id, {
        userIds: notifyUserIds,
      });
      await notifyWhatsApp(
        client,
        team.id,
        "Crease: weekend fees calculated. Open Payments to settle.",
        phones,
      );
      notificationSent = true;
    }
  }

  return new Response(
    JSON.stringify({
      settlementId: settlement.id,
      chargeCount,
      notificationSent,
      reimbursements: reimbursementUserIds.length,
    }),
    { headers: { "Content-Type": "application/json" } },
  );
});
