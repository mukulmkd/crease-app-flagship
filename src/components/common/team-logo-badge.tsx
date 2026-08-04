"use client";

import { useMvpTeam } from "@/features/team/hooks";
import { cn, resolveTeamLogoUrl } from "@/utils";

type TeamLogoBadgeProps = {
  className?: string;
  imageClassName?: string;
};

/**
 * Uploaded team logo for app chrome. Renders nothing until Admin sets one,
 * so the Crease lockup stays the only permanent brand.
 */
function TeamLogoBadge({ className, imageClassName }: TeamLogoBadgeProps) {
  const teamQuery = useMvpTeam();
  const logoUrl = resolveTeamLogoUrl(teamQuery.data?.logoUrl);
  if (!logoUrl) return null;

  const teamName = teamQuery.data?.name?.trim() || "Team";

  return (
    <span
      role="img"
      aria-label={`${teamName} logo`}
      className={cn("pointer-events-none inline-flex shrink-0", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- public storage / legacy URL */}
      <img
        src={logoUrl}
        alt=""
        className={cn("size-9 rounded-md object-cover", imageClassName)}
      />
    </span>
  );
}

export { TeamLogoBadge };
export type { TeamLogoBadgeProps };
