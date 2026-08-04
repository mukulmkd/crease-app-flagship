"use client";

import { Trophy } from "lucide-react";

import { BodySm } from "@/components/common";
import { formatInrAmount } from "@/utils";
import type { MatchTournamentContext } from "@/types/models";

type MatchTournamentCardProps = {
  loading: boolean;
  context: MatchTournamentContext | undefined;
};

/**
 * Tournament progress for a fixture — match N of planned, remaining fees,
 * and how many players share this match's entry pool.
 */
function MatchTournamentCard({ loading, context }: MatchTournamentCardProps) {
  return (
    <section
      aria-label="Tournament"
      className="rounded-xl bg-surface-container-low px-4 py-3"
    >
      <p className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
        <Trophy className="size-3.5 text-primary" aria-hidden />
        Tournament
      </p>
      {loading ? (
        <BodySm className="mt-1">Loading tournament…</BodySm>
      ) : context ? (
        <div className="mt-1 space-y-2">
          <p className="font-heading text-xl font-bold uppercase">
            {context.tournament.name}
          </p>
          <BodySm>
            {context.matchNumber > 0
              ? `Match ${context.matchNumber} of ${context.plannedMatchCount}`
              : `${context.plannedMatchCount} planned matches`}
            {" · "}
            {context.remainingMatchCount === 0
              ? "None remaining"
              : `${context.remainingMatchCount} remaining`}
          </BodySm>
          <BodySm>
            Tournament fee for this match ₹
            {formatInrAmount(context.feePoolPerMatchInr)}
            {" · "}
            {context.squadSize != null && context.squadSize > 0
              ? `Divided between ${context.squadSize} player${context.squadSize === 1 ? "" : "s"}`
              : "Divided between the playing squad (11–12) after finalize"}
          </BodySm>
        </div>
      ) : (
        <BodySm className="mt-1">Tournament details unavailable.</BodySm>
      )}
    </section>
  );
}

export { MatchTournamentCard };
