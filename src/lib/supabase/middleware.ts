import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { MVP_TEAM } from "@/constants/domain/enums";
import type { MembershipRole } from "@/constants/domain/enums";
import {
  TEAM_PERMISSIONS,
  type TeamPermission,
} from "@/constants/domain/team-permissions";
import { resolveRouteGuard } from "@/lib/auth/route-protection";
import { isSupabaseConfigured } from "@/lib/env";
import { logger } from "@/lib/logging/logger";
import { canTeamPermission } from "@/lib/rbac/team-permissions";
import type { Database } from "@/types/database";

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

  // RBAC — team route guarding (membership + permission).
  if (user && isActiveMember) {
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
          redirectUrl.pathname = "/access-denied";
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
      }
    }
  }

  return supabaseResponse;
}

function resolveTeamRoutePermissionGuard(
  path: string,
): { teamId: string; required: TeamPermission } | null {
  const match = path.match(/^\/team\/([^/]+)(?:\/(members|invite|settings))?$/);
  if (!match) return null;

  const teamId = match[1]!;
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
