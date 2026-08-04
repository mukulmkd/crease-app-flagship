"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2, IndianRupee } from "lucide-react";

import type { MyWeekendDues } from "@/services/payment.service";
import { formatInrAmount } from "@/utils";

function WeekendDuesCallout({ weekend }: { weekend: MyWeekendDues }) {
  const isAutoSettled = weekend.collectorAutoSettled;
  const matchCount = weekend.lines.length;

  return (
    <Link
      href="/payments"
      className={
        isAutoSettled
          ? "flex min-h-20 items-center gap-3 rounded-xl border-l-2 border-success bg-surface-container-low px-4 py-3 transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          : "flex min-h-20 items-center gap-3 rounded-xl border-l-2 border-destructive bg-surface-container-low px-4 py-3 transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      }
      aria-label={
        isAutoSettled
          ? `₹${formatInrAmount(weekend.totalDueInr)} auto-settled as payment collector. Open payments`
          : `You owe ₹${formatInrAmount(weekend.totalDueInr)} for this weekend. Open payments`
      }
    >
      <span
        className={
          isAutoSettled
            ? "flex size-10 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
            : "flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
        }
      >
        {isAutoSettled ? (
          <CheckCircle2 className="size-5" aria-hidden />
        ) : (
          <IndianRupee className="size-5" aria-hidden />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          {isAutoSettled ? "Collector settlement" : "Your outstanding dues"}
        </span>
        <span className="mt-0.5 block font-heading text-2xl font-bold tabular-nums">
          ₹{formatInrAmount(weekend.totalDueInr)}
        </span>
        <span className="block text-xs text-muted-foreground">
          {isAutoSettled
            ? "Auto-settled as payment collector"
            : `${matchCount} match${matchCount === 1 ? "" : "es"} · payment pending`}
        </span>
      </span>
      <ArrowRight className="size-5 text-primary" aria-hidden />
    </Link>
  );
}

export { WeekendDuesCallout };
