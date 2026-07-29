"use client";

import { useState } from "react";

import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { SQUAD_MAX, SQUAD_MIN } from "@/constants/domain/enums";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useFinalizePlayingSquad } from "@/features/team/hooks";

type AvailablePlayer = {
  userId: string;
  fullName: string | null;
};

type MatchSquadFinalizeProps = {
  matchId: string;
  available: AvailablePlayer[];
};

/**
 * Admin confirms 11–12, or selects 11–12 from an oversubscribed pool.
 */
function MatchSquadFinalize({ matchId, available }: MatchSquadFinalizeProps) {
  const finalize = useFinalizePlayingSquad();
  const [selected, setSelected] = useState<string[]>(() =>
    available.length <= SQUAD_MAX
      ? available.map((player) => player.userId)
      : [],
  );

  const toggle = (userId: string) => {
    setSelected((current) => {
      if (current.includes(userId)) {
        return current.filter((id) => id !== userId);
      }
      if (current.length >= SQUAD_MAX) return current;
      return [...current, userId];
    });
  };

  const canSubmit =
    selected.length >= SQUAD_MIN && selected.length <= SQUAD_MAX;

  return (
    <section className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div>
        <h2 className="font-heading text-xl font-bold uppercase">
          Finalize playing squad
        </h2>
        <BodySm>
          {available.length} available. Select {SQUAD_MIN}–{SQUAD_MAX} for fees
          and match day.
        </BodySm>
      </div>
      <ul className="divide-y divide-outline-variant rounded-lg bg-surface">
        {available.map((player) => {
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
                    (!checked && selected.length >= SQUAD_MAX)
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
      </ul>
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
        Confirm squad ({selected.length}/{SQUAD_MAX})
      </Button>
    </section>
  );
}

export { MatchSquadFinalize };
