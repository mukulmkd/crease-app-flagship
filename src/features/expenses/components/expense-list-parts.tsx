"use client";

import { UserAvatar } from "@/components/common";
import type { Expense, PlayerFundContributionSummary } from "@/types/models";
import { formatInrAmount } from "@/utils";

function ContributionRow({
  player,
  onRecord,
}: {
  player: PlayerFundContributionSummary;
  onRecord: () => void;
}) {
  const name = player.fullName?.trim() || "Unnamed player";
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <UserAvatar name={name} imageUrl={player.avatarUrl} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        <p className="mt-0.5 text-[0.65rem] text-muted-foreground">
          {player.paymentCount === 0
            ? "No contributions yet"
            : `${player.paymentCount} payment${player.paymentCount === 1 ? "" : "s"}`}
        </p>
      </div>
      <button
        type="button"
        onClick={onRecord}
        className="shrink-0 rounded-lg px-2 py-1 text-right transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label={`Record contribution for ${name}. Total ₹${formatInrAmount(player.totalInr)}`}
      >
        <p className="font-heading text-lg font-bold tabular-nums">
          ₹{formatInrAmount(player.totalInr)}
        </p>
        <p className="text-[0.6rem] font-semibold text-primary">Add</p>
      </button>
    </li>
  );
}

function ExpenseRow({ expense }: { expense: Expense }) {
  return (
    <li className="flex items-start justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold capitalize">
          {expense.category}
        </p>
        {expense.note ? (
          <p className="mt-0.5 line-clamp-2 text-[0.7rem] text-muted-foreground">
            {expense.note}
          </p>
        ) : null}
        <p className="mt-1 text-[0.65rem] text-muted-foreground">
          {formatWhen(expense.createdAt)}
        </p>
      </div>
      <p className="shrink-0 font-heading text-lg font-bold text-destructive tabular-nums">
        −₹{formatInrAmount(expense.amountInr)}
      </p>
    </li>
  );
}

function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export { ContributionRow, ExpenseRow };
