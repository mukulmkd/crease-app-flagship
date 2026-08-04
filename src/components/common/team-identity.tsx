"use client";

import Link from "next/link";

import { BodySm, Caption } from "@/components/common/typography";
import { useMvpTeam } from "@/features/team/hooks";
import { cn, resolveTeamLogoUrl } from "@/utils";

type TeamIdentityProps = {
  compact?: boolean;
  collapsed?: boolean;
  className?: string;
};

/**
 * Identifies the team workspace without competing with the Crease app brand.
 */
function TeamIdentity({
  compact = false,
  collapsed = false,
  className,
}: TeamIdentityProps) {
  const teamQuery = useMvpTeam();
  const teamName = teamQuery.data?.name?.trim() || "Ranches Thunders";
  const logoUrl = resolveTeamLogoUrl(teamQuery.data?.logoUrl);

  return (
    <Link
      href="/team"
      aria-label={`${teamName} team workspace`}
      className={cn(
        "flex min-h-14 items-center gap-3 rounded-xl bg-surface-container-low px-3 py-2 transition-colors outline-none hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-ring/50",
        compact && "min-h-12 rounded-lg py-1.5",
        collapsed && "justify-center px-1",
        className,
      )}
    >
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- Supabase public storage URL
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className={cn(
            "size-10 shrink-0 rounded-lg object-cover",
            compact && "size-8 rounded-md",
          )}
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-lg bg-clubhouse font-heading text-sm font-semibold text-tertiary",
            compact && "size-8 rounded-md text-xs",
          )}
        >
          RT
        </span>
      )}

      {!collapsed ? (
        <div className="min-w-0">
          <BodySm className="truncate font-semibold">{teamName}</BodySm>
          {!compact ? (
            <Caption className="mt-0.5 block text-muted-foreground">
              Team workspace
            </Caption>
          ) : null}
        </div>
      ) : null}
    </Link>
  );
}

export { TeamIdentity };
export type { TeamIdentityProps };
