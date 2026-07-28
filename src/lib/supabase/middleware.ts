import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { resolveRouteGuard } from "@/lib/auth/route-protection";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import type { Database } from "@/types/database";
import { canTeamPermission } from "@/lib/rbac/team-permissions";
import {
  TEAM_PERMISSIONS,
  type TeamPermission,
} from "@/constants/domain/team-permissions";
import type { MembershipRole } from "@/constants/domain/enums";

/**
 * Session refresh + route protection at the network boundary.
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

  const path = request.nextUrl.pathname;
  const decision = resolveRouteGuard({ path, user });

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

  // RBAC — team route guarding (membership + permission).
  if (user) {
    const guard = resolveTeamRoutePermissionGuard(path);
    if (guard) {
      const { teamId, required } = guard;
      try {
        const { data: membership } = await supabase
          .from("team_memberships")
          .select("role")
          .eq("team_id", teamId)
          .eq("user_id", user.id)
          .eq("status", "active")
          .maybeSingle();

        if (!membership) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = "/team";
          redirectUrl.searchParams.set("redirect", path);
          return NextResponse.redirect(redirectUrl);
        }

        const role = membership.role as MembershipRole | null;
        if (!canTeamPermission(role, required)) {
          const redirectUrl = request.nextUrl.clone();
          redirectUrl.pathname = `/team/${teamId}`;
          redirectUrl.searchParams.set("redirect", path);
          return NextResponse.redirect(redirectUrl);
        }
      } catch (error) {
        logger.warn("team_rbac.guard_failed", {
          message: error instanceof Error ? error.message : "unknown",
          path,
        });
        // Fail-open (avoid blocking dev routes).
      }
    }
  }

  return supabaseResponse;
}

function resolveTeamRoutePermissionGuard(
  path: string,
): { teamId: string; required: TeamPermission } | null {
  // Supported routes:
  // - /team
  // - /team/new
  // - /team/:teamId
  // - /team/:teamId/members
  // - /team/:teamId/invite
  // - /team/:teamId/settings
  const match = path.match(/^\/team\/([^/]+)(?:\/(members|invite|settings))?$/);
  if (!match) return null;

  const teamId = match[1]!;
  // Exclude non-team routes nested under /team.
  if (teamId === "new") return null;
  const section = match[2];

  if (!section) return { teamId, required: TEAM_PERMISSIONS.view_team };
  if (section === "members") {
    return { teamId, required: TEAM_PERMISSIONS.view_members };
  }
  if (section === "invite") {
    return { teamId, required: TEAM_PERMISSIONS.invite_member };
  }
  return { teamId, required: TEAM_PERMISSIONS.view_team };
}
