import { NextResponse } from "next/server";
import { z } from "zod";

import { ALERTS_OPEN_HREF } from "@/constants/alerts";
import { sendWebPushToUsers } from "@/lib/push/send-web-push";

const bodySchema = z.object({
  userIds: z.array(z.string().uuid()).min(1),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().max(200).optional(),
  tag: z.string().max(120).optional(),
});

/**
 * Cron / Edge Functions call this after inserting notification rows so OS push
 * stays in the Next.js app (web-push + VAPID private key).
 */
export async function POST(request: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  const header = request.headers.get("x-cron-secret");
  if (bearer !== expected && header !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const sent = await sendWebPushToUsers(parsed.data.userIds, {
    title: parsed.data.title,
    body: parsed.data.body,
    url: parsed.data.url ?? ALERTS_OPEN_HREF,
    tag: parsed.data.tag,
  });

  return NextResponse.json({ sent });
}
