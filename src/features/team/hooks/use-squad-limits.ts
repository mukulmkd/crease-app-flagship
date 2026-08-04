"use client";

import { squadLimits } from "@/constants/domain/enums";
import { useMvpTeam } from "@/features/team/hooks";

/** Production XI/XII or demo 4 — driven by team.demo_mode. */
export function useSquadLimits(): {
  min: number;
  max: number;
  demoMode: boolean;
} {
  const teamQuery = useMvpTeam();
  const demoMode = Boolean(teamQuery.data?.demoMode);
  return { ...squadLimits(demoMode), demoMode };
}
