"use client";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { BodySm } from "@/components/common";
import { MATCH_CLASSIFICATION_LABELS } from "@/constants/domain/labels";
import { formatMatchDate } from "@/features/team/lib/match-format";
import type {
  AdminPlayerDues,
  AdminWeekendPaymentSummary,
} from "@/services/payment.service";
import { formatInrAmount } from "@/utils";

function SummaryStat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "success" | "danger";
}) {
  return (
    <div className="rounded-xl bg-surface-container-lowest px-3 py-3 text-center">
      <p
        className={
          tone === "danger"
            ? "font-heading text-2xl font-bold text-destructive tabular-nums"
            : tone === "success"
              ? "font-heading text-2xl font-bold text-success tabular-nums"
              : "font-heading text-2xl font-bold tabular-nums"
        }
      >
        {value}
      </p>
      <p className="mt-0.5 text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

type MatchFeeRow = AdminWeekendPaymentSummary["matches"][number];

/** Per-fixture fee split — tournament entry for this match vs match/ground fees. */
function MatchFeesSection({ matches }: { matches: MatchFeeRow[] }) {
  if (matches.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold uppercase">
        Match fees
        {matches.length > 0 ? ` · ${matches.length}` : ""}
      </h2>
      <ul className="divide-y divide-outline-variant overflow-hidden rounded-xl bg-surface-container-low">
        {matches.map((match) => {
          const totalPool = match.matchFeesInr + match.tournamentFeeForMatchInr;
          return (
            <li key={match.matchId} className="space-y-2 px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {formatMatchDate(match.matchDate)}
                  </p>
                  <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                    {MATCH_CLASSIFICATION_LABELS[match.classification]}
                    {" · "}
                    {match.opposition?.trim() || "TBD"}
                  </p>
                </div>
                <p className="shrink-0 font-heading text-xl font-bold tabular-nums">
                  ₹{formatInrAmount(totalPool)}
                </p>
              </div>
              {match.classification === "tournament" ? (
                <dl className="grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-surface-container-lowest px-2 py-2">
                    <dt className="text-[0.6rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                      Tournament fee for this match
                    </dt>
                    <dd className="mt-0.5 font-heading text-lg font-bold tabular-nums">
                      ₹{formatInrAmount(match.tournamentFeeForMatchInr)}
                    </dd>
                  </div>
                  <div className="rounded-lg bg-surface-container-lowest px-2 py-2">
                    <dt className="text-[0.6rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                      Match fees
                    </dt>
                    <dd className="mt-0.5 font-heading text-lg font-bold tabular-nums">
                      ₹{formatInrAmount(match.matchFeesInr)}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-[0.65rem] text-muted-foreground">
                  Match fees ₹{formatInrAmount(match.matchFeesInr)}
                  {match.matchFeesInr <= 0 ? " · TBD" : ""}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function PlayerSection({
  title,
  empty,
  players,
  variant,
}: {
  title: string;
  empty: string;
  players: AdminPlayerDues[];
  variant: "paid" | "unpaid";
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold uppercase">
        {title}
        {players.length > 0 ? ` · ${players.length}` : ""}
      </h2>
      {players.length === 0 ? (
        <BodySm>{empty}</BodySm>
      ) : (
        <ul className="divide-y divide-outline-variant overflow-hidden rounded-xl bg-surface-container-low">
          {players.map((player) => (
            <li
              key={`${player.settlementId}:${player.userId}`}
              className="flex items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <span className="truncate">
                    {player.fullName?.trim() || "Player"}
                  </span>
                  {variant === "paid" ? (
                    <span
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-success/20"
                      aria-label="Paid"
                    >
                      <CheckCircle2
                        className="size-5 fill-success/15 text-success"
                        aria-hidden
                      />
                    </span>
                  ) : (
                    <span
                      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive/15"
                      aria-label="Payment pending"
                    >
                      <CircleAlert
                        className="size-5 fill-destructive/10 text-destructive"
                        aria-hidden
                      />
                    </span>
                  )}
                  {player.isCollector ? (
                    <span className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
                      Collector
                    </span>
                  ) : null}
                </p>
                <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
                  {player.matches
                    .map(
                      (match) =>
                        `${formatMatchDate(match.matchDate)} · ₹${formatInrAmount(match.totalInr)}`,
                    )
                    .join(" · ")}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={
                    variant === "unpaid"
                      ? "font-heading text-xl font-bold text-destructive tabular-nums"
                      : "font-heading text-xl font-bold tabular-nums"
                  }
                >
                  ₹
                  {formatInrAmount(
                    variant === "unpaid"
                      ? player.totalDueInr
                      : player.paidInr || player.billedInr,
                  )}
                </p>
                <p className="text-[0.65rem] font-bold tracking-wide text-muted-foreground uppercase">
                  {variant === "unpaid"
                    ? "Due"
                    : player.isCollector
                      ? "Auto settled"
                      : "Paid"}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export { MatchFeesSection, PlayerSection, SummaryStat };
