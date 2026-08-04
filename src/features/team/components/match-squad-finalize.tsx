"use client";

import { useMemo, useState } from "react";

import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useFinalizePlayingSquad,
  useSquadLimits,
  useTeamMembers,
} from "@/features/team/hooks";

type AvailablePlayer = {
  userId: string;
  fullName: string | null;
};

type MatchSquadFinalizeProps = {
  matchId: string;
  available: AvailablePlayer[];
};

/**
 * Admin confirms the playing squad (XI/XII production, or 4 in demo mode).
 * Demo mode lists every active member so Admin can fill the squad without votes.
 */
function MatchSquadFinalize({ matchId, available }: MatchSquadFinalizeProps) {
  const { min: squadMin, max: squadMax, demoMode } = useSquadLimits();
  const membersQuery = useTeamMembers({ status: "active", limit: 100 });
  const finalize = useFinalizePlayingSquad();

  const pool = useMemo(() => {
    if (!demoMode) return available;
    const members = membersQuery.data?.items ?? [];
    return members.map((m) => ({
      userId: String(m.userId),
      fullName: m.profile.fullName,
    }));
  }, [demoMode, available, membersQuery.data?.items]);

  const defaultSelected = useMemo(
    () => pool.slice(0, squadMax).map((p) => p.userId),
    [pool, squadMax],
  );
  const poolKey = defaultSelected.join("|");

  const [selectedOverride, setSelectedOverride] = useState<string[] | null>(
    null,
  );
  const [seenPoolKey, setSeenPoolKey] = useState(poolKey);
  if (poolKey !== seenPoolKey) {
    setSeenPoolKey(poolKey);
    setSelectedOverride(null);
  }

  const selected = selectedOverride ?? defaultSelected;

  const toggle = (userId: string) => {
    setSelectedOverride(() => {
      const current = selectedOverride ?? defaultSelected;
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }
      if (current.length >= squadMax) return current;
      return [...current, userId];
    });
  };

  const canSubmit = selected.length >= squadMin && selected.length <= squadMax;

  return (
    <section className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div>
        <h2 className="font-heading text-xl font-semibold">
          Finalize playing squad
        </h2>
        <BodySm>
          {demoMode
            ? `Demo · select ${squadMin}–${squadMax} active members (votes cast automatically).`
            : `${available.length} available. Select ${squadMin}–${squadMax} for fees and match day.`}
        </BodySm>
      </div>
      <ul className="divide-y divide-outline-variant rounded-lg bg-surface">
        {pool.map((player) => {
          const checked = selected.includes(player.userId);
          return (
            <li key={player.userId}>
              <label className="flex min-h-12 cursor-pointer items-center gap-3 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={checked}
                  disabled={
                    finalize.isPending ||
                    (!checked && selected.length >= squadMax)
                  }
                  onChange={() => toggle(player.userId)}
                />
                <span className="font-medium">
                  {player.fullName?.trim() || "Player"}
                </span>
              </label>
            </li>
          );
        })}
        {pool.length === 0 ? (
          <li className="px-3 py-3 text-sm text-muted-foreground">
            {demoMode
              ? "No active members yet — add players in Team."
              : "No available voters yet."}
          </li>
        ) : null}
      </ul>
      {demoMode && pool.length >= squadMin ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={finalize.isPending}
          onClick={() => setSelectedOverride(defaultSelected)}
        >
          Select first {Math.min(pool.length, squadMax)} members
        </Button>
      ) : null}
      <Button
        type="button"
        className="w-full"
        loading={finalize.isPending}
        disabled={!canSubmit}
        onClick={async () => {
          try {
            await finalize.mutateAsync({ matchId, userIds: selected });
            toast.success({ title: "Playing squad finalized" });
          } catch (error) {
            toast.error({ title: getMutationErrorMessage(error) });
          }
        }}
      >
        Confirm squad ({selected.length}/{squadMax})
      </Button>
    </section>
  );
}

export { MatchSquadFinalize };
