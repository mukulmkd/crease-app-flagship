"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { EmptyState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import { WeekendPaySheet } from "@/features/payments/components/weekend-pay-sheet";
import { useMyWeekendDues } from "@/features/payments/hooks";
import {
  formatMatchDate,
  formatWeekendRange,
} from "@/features/team/lib/match-format";
import type { MyWeekendDues } from "@/services/payment.service";
import { cn, formatInrAmount, nextWeekendDates } from "@/utils";

type YourDuesSectionProps = {
  upi: string | null | undefined;
  payeeName?: string | null;
  demoMode: boolean;
  /** Current user is the fee collector — show billed total, no UPI pay. */
  isCollector: boolean;
};

function chargeBreakdown(line: MyWeekendDues["lines"][number]): string {
  const { charge } = line;
  const parts = [`Match ₹${formatInrAmount(charge.matchFeeShareInr)}`];
  if (charge.carpoolFeeInr > 0) {
    parts.push(`carpool ₹${formatInrAmount(charge.carpoolFeeInr)}`);
  }
  if (charge.carpoolCreditInr > 0) {
    parts.push(`carpool credit −₹${formatInrAmount(charge.carpoolCreditInr)}`);
  }
  if (charge.tournamentCreditInr > 0) {
    parts.push(
      `tournament credit −₹${formatInrAmount(charge.tournamentCreditInr)}`,
    );
  }
  return parts.join(" · ");
}

function weekendTitle(weekend: MyWeekendDues): string {
  const thisSat = nextWeekendDates().saturday;
  const range = formatWeekendRange(weekend.weekStartDate, weekend.weekEndDate);
  if (weekend.weekStartDate === thisSat) return `This weekend · ${range}`;
  if (weekend.weekEndDate < thisSat) return `Past weekend · ${range}`;
  return `Weekend · ${range}`;
}

function YourDuesSection({
  upi,
  payeeName,
  demoMode,
  isCollector,
}: YourDuesSectionProps) {
  const duesQuery = useMyWeekendDues();
  const [payWeekend, setPayWeekend] = useState<MyWeekendDues | null>(null);

  const weekends = duesQuery.data ?? [];

  return (
    <section className="space-y-3">
      <h2 className="font-heading text-xl font-bold uppercase">Your dues</h2>

      {isCollector ? (
        <BodySm>
          You are the fee collector. Your share stays on the weekend total and
          auto-settles — no UPI to yourself.
        </BodySm>
      ) : null}

      {duesQuery.isLoading ? (
        <LoadingState label="Loading dues" />
      ) : weekends.length === 0 ? (
        <EmptyState
          title="Nothing due"
          description="You’re clear for open settlements."
        />
      ) : (
        <ul className="space-y-3">
          {weekends.map((weekend, index) => (
            <li key={weekend.settlementId}>
              <YourWeekendDuesGroup
                weekend={weekend}
                isCollector={isCollector}
                defaultOpen={index === 0}
                onPay={setPayWeekend}
              />
            </li>
          ))}
        </ul>
      )}

      <WeekendPaySheet
        key={payWeekend?.settlementId ?? "closed"}
        weekend={payWeekend}
        upi={upi}
        payeeName={payeeName}
        demoMode={demoMode}
        onClose={() => setPayWeekend(null)}
      />
    </section>
  );
}

type YourWeekendDuesGroupProps = {
  weekend: MyWeekendDues;
  isCollector: boolean;
  defaultOpen: boolean;
  onPay: (weekend: MyWeekendDues) => void;
};

function YourWeekendDuesGroup({
  weekend,
  isCollector,
  defaultOpen,
  onPay,
}: YourWeekendDuesGroupProps) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `your-dues-${weekend.settlementId}`;
  const autoSettled = weekend.collectorAutoSettled;
  const hidePay = isCollector || autoSettled;

  return (
    <div className="overflow-hidden rounded-xl bg-surface-container-low">
      <button
        type="button"
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="min-w-0">
          <span className="block text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {weekendTitle(weekend)}
          </span>
          <span className="mt-1 block font-heading text-3xl font-bold tabular-nums">
            ₹{formatInrAmount(weekend.totalDueInr)}
          </span>
          <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
            {weekend.lines.length === 1
              ? "1 match"
              : `${weekend.lines.length} matches`}
            {autoSettled
              ? " · Collector so auto settled"
              : isCollector
                ? " · collector — no UPI to yourself"
                : " · pay once for the weekend"}
          </span>
          {autoSettled || isCollector ? (
            <span className="mt-2 inline-flex">
              <StatusChip status={autoSettled ? "success" : "info"}>
                {autoSettled ? "Auto settled" : "Collector"}
              </StatusChip>
            </span>
          ) : null}
        </span>
        <ChevronDown
          className={cn(
            "size-5 shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open ? (
        <div id={panelId}>
          <ul className="divide-y divide-outline-variant border-t border-outline-variant">
            {weekend.lines.map((line) => (
              <li
                key={line.charge.id}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium">
                    vs {line.opposition?.trim() || "Opposition TBD"}
                  </span>
                  <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
                    {formatMatchDate(line.matchDate)} · {chargeBreakdown(line)}
                  </span>
                </span>
                <span className="shrink-0 font-heading text-lg font-bold tabular-nums">
                  ₹{formatInrAmount(line.charge.totalInr)}
                </span>
              </li>
            ))}
          </ul>
          {!hidePay ? (
            <div className="border-t border-outline-variant px-4 py-3">
              <Button
                type="button"
                className="w-full"
                onClick={() => onPay(weekend)}
              >
                Pay ₹{formatInrAmount(weekend.totalDueInr)}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export { YourDuesSection };
