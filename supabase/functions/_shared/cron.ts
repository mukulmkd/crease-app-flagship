import {
  createClient,
  type SupabaseClient,
} from "https://esm.sh/@supabase/supabase-js@2.49.1";

export function requireCronSecret(req: Request): Response | null {
  const expected = Deno.env.get("CRON_SECRET");
  if (!expected) return null;
  const header = req.headers.get("x-cron-secret");
  const auth = req.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (header === expected || bearer === expected) return null;
  return new Response(JSON.stringify({ error: "Unauthorized" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}

export function serviceClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Calendar date in Asia/Kolkata as YYYY-MM-DD */
export function istToday(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function addDaysIso(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return date.toISOString().slice(0, 10);
}

export async function enqueueForActiveMembers(
  client: SupabaseClient,
  teamId: string,
  payload: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  },
  options?: { adminsOnly?: boolean },
) {
  let query = client
    .from("team_memberships")
    .select("user_id")
    .eq("team_id", teamId)
    .eq("status", "active");
  if (options?.adminsOnly) query = query.eq("role", "admin");

  const { data: members } = await query;
  const userIds = (members ?? []).map((m) => m.user_id as string);

  for (const userId of userIds) {
    await client.from("notifications").insert({
      team_id: teamId,
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    });
  }

  await dispatchAppWebPush(userIds, payload);
}

export async function enqueueForUsers(
  client: SupabaseClient,
  teamId: string,
  userIds: string[],
  payload: {
    type: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  },
) {
  const uniqueUserIds = [...new Set(userIds)];
  if (uniqueUserIds.length === 0) return;

  await client.from("notifications").insert(
    uniqueUserIds.map((userId) => ({
      team_id: teamId,
      user_id: userId,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      data: payload.data ?? {},
    })),
  );

  await dispatchAppWebPush(uniqueUserIds, payload);
}

/** POST to the Next.js app so VAPID private key stays off Edge Functions. */
async function dispatchAppWebPush(
  userIds: string[],
  payload: { type: string; title: string; body: string },
): Promise<void> {
  const appUrl = Deno.env.get("APP_URL")?.replace(/\/$/, "");
  const secret = Deno.env.get("CRON_SECRET");
  if (!appUrl || !secret || userIds.length === 0) return;
  try {
    await fetch(`${appUrl}/api/internal/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({
        userIds,
        title: payload.title,
        body: payload.body,
        url: "/home?alerts=1",
        tag: `crease-${payload.type}`,
      }),
    });
  } catch {
    // Non-blocking
  }
}

export async function notifyWhatsApp(
  client: SupabaseClient,
  teamId: string,
  text: string,
  phones?: string[],
) {
  const { data: team } = await client
    .from("teams")
    .select("whatsapp_notify_url")
    .eq("id", teamId)
    .maybeSingle();
  if (!team?.whatsapp_notify_url) return;
  try {
    await fetch(team.whatsapp_notify_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        ...(phones && phones.length > 0 ? { phones } : {}),
      }),
    });
  } catch {
    // Non-blocking
  }
}

/** Load E.164 phones for active members (optionally admins only). */
export async function listMemberPhones(
  client: SupabaseClient,
  teamId: string,
  options?: { adminsOnly?: boolean; userIds?: string[] },
): Promise<string[]> {
  let query = client
    .from("team_memberships")
    .select("user_id, profiles:user_id(phone)")
    .eq("team_id", teamId)
    .eq("status", "active");
  if (options?.adminsOnly) query = query.eq("role", "admin");
  if (options?.userIds?.length) query = query.in("user_id", options.userIds);

  const { data: members } = await query;
  const phones: string[] = [];
  for (const member of members ?? []) {
    const profile = member.profiles as
      { phone: string | null } | { phone: string | null }[] | null;
    const phone = Array.isArray(profile) ? profile[0]?.phone : profile?.phone;
    if (phone?.trim()) phones.push(phone.trim());
  }
  return [...new Set(phones)];
}
