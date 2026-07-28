import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

import {
  DEV_AUTH_FIXED_OTP,
  DEV_AUTH_PERSONAS,
  isDevAuthPhone,
} from "@/constants/dev-auth";
import { normalizePhoneNumber } from "@/lib/auth/utils";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type Body = {
  action?: "send" | "verify";
  phone?: string;
  token?: string;
};

/**
 * Fixed OTP bypass when SMS is not configured.
 * Opt-in via AUTH_DEV_FIXED_OTP (must equal the known fixed code).
 * Works in local and Vercel — remove the env vars to disable.
 */
function isServerDevAuthEnabled(): boolean {
  const configured = process.env.AUTH_DEV_FIXED_OTP?.trim();
  return Boolean(configured) && configured === DEV_AUTH_FIXED_OTP;
}

export async function POST(request: Request) {
  if (!isServerDevAuthEnabled()) {
    return NextResponse.json({ error: "Dev auth disabled" }, { status: 404 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phone = normalizePhoneNumber(body.phone ?? "");
  if (!isDevAuthPhone(phone)) {
    return NextResponse.json(
      { error: "Phone is not a seeded dev number" },
      { status: 400 },
    );
  }

  if (body.action === "send") {
    return NextResponse.json({ ok: true, phone, otp: DEV_AUTH_FIXED_OTP });
  }

  if (body.action !== "verify") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  if (body.token !== DEV_AUTH_FIXED_OTP) {
    return NextResponse.json({ error: "Invalid OTP" }, { status: 401 });
  }

  const persona = DEV_AUTH_PERSONAS.find((p) => p.phone === phone);
  if (!persona) {
    return NextResponse.json({ error: "Unknown persona" }, { status: 400 });
  }

  try {
    const admin = createAdminSupabaseClient();
    const { data: linkData, error: linkError } =
      await admin.auth.admin.generateLink({
        type: "magiclink",
        email: persona.email,
      });

    if (linkError || !linkData.properties?.hashed_token) {
      return NextResponse.json(
        {
          error:
            linkError?.message ??
            "Could not mint session. Run npm run seed:dev first.",
        },
        { status: 502 },
      );
    }

    // Exchange hashed_token with the anon client so we return a real session.
    const {
      NEXT_PUBLIC_SUPABASE_URL = "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY = "",
    } = process.env;

    const anon = createClient(
      NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: { autoRefreshToken: false, persistSession: false },
      },
    );

    const { data, error } = await anon.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: "email",
    });

    if (error || !data.session) {
      return NextResponse.json(
        { error: error?.message ?? "Session exchange failed" },
        { status: 502 },
      );
    }

    return NextResponse.json({
      session: data.session,
      user: data.user,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Dev auth verify failed",
      },
      { status: 500 },
    );
  }
}
