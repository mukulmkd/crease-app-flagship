import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { MVP_TEAM } from "@/constants/domain/enums";
import { resolveRouteGuard } from "@/lib/auth/route-protection";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import type { Database } from "@/types/database";

/**
 * Session refresh + route protection at the network boundary.
 * MVP is single-team: membership is enough; fine-grained RBAC is enforced
 * in services (and UI hides). No `/team/[id]/…` permission matrix.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  if (!isSupabaseConfigured()) {
    return supabaseResponse;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isActiveMember: boolean | null = null;
  if (user) {
    try {
      const { data: membership } = await supabase
        .from("team_memberships")
        .select("id")
        .eq("team_id", MVP_TEAM.id)
        .eq("user_id", user.id)
        .eq("status", "active")
        .maybeSingle();
      isActiveMember = Boolean(membership);
    } catch (error) {
      logger.warn("membership.guard_lookup_failed", {
        message: error instanceof Error ? error.message : "unknown",
      });
      // Fail closed for app access when membership cannot be verified.
      isActiveMember = false;
    }
  }

  const path = request.nextUrl.pathname;
  const decision = resolveRouteGuard({ path, user, isActiveMember });

  if (decision.action === "redirect") {
    logger.debug("route_guard.redirect", {
      path,
      to: decision.pathname,
    });
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = decision.pathname;
    if (decision.setRedirectQuery) {
      redirectUrl.searchParams.set("redirect", path);
    }
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
