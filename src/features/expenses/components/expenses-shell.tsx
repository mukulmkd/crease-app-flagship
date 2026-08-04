"use client";

import { useState } from "react";
import { HandCoins, Plus, WalletCards } from "lucide-react";

import { BodySm, Title } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import {
  AddExpenseSheet,
  AskForFundsSheet,
  RecordContributionSheet,
} from "@/features/expenses/components/expense-sheets";
import {
  ContributionRow,
  ExpenseRow,
} from "@/features/expenses/components/expense-list-parts";
import { useExpenseHub } from "@/features/expenses/hooks";
import { useMyMembership } from "@/features/team/hooks";
import { formatInrAmount } from "@/utils";

function ExpensesShell() {
  const membershipQuery = useMyMembership();
  const hubQuery = useExpenseHub();
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [recordOpen, setRecordOpen] = useState(false);
  const [recordUserId, setRecordUserId] = useState<string | null>(null);

  const role = membershipQuery.data?.role;
  const canManage = hasPermission(role, PERMISSIONS.FUND_EXPENSE_ADD);
  const canAsk = hasPermission(role, PERMISSIONS.FUND_CONTRIBUTION_ASK);

  if (membershipQuery.isLoading) {
    return <LoadingState label="Loading expenses" />;
  }

  if (membershipQuery.isError || !canManage) {
    return (
      <ErrorState
        title="Admin only"
        description="Team fund and expenses are managed by Ranches Thunders admins."
        onRetry={() => void membershipQuery.refetch()}
      />
    );
  }

  if (hubQuery.isLoading) {
    return <LoadingState label="Loading fund" />;
  }

  if (hubQuery.isError) {
    return (
      <ErrorState
        title="Couldn’t load fund"
        onRetry={() => void hubQuery.refetch()}
      />
    );
  }

  const hub = hubQuery.data!;
  const openRecord = (userId?: string) => {
    setRecordUserId(userId ?? null);
    setRecordOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <Title>Expenses</Title>
        <BodySm>
          Contributions by player, fund asks, and every club expense
        </BodySm>
      </div>

      <section
        aria-label="Team fund summary"
        className="rounded-xl bg-surface-container-low px-4 py-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
              Team fund balance
            </p>
            <p className="mt-1 font-heading text-4xl font-bold tabular-nums">
              ₹{formatInrAmount(hub.balanceInr)}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <WalletCards className="size-5" aria-hidden />
          </span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-outline-variant/40 pt-3">
          <div>
            <p className="text-[0.6rem] font-bold tracking-wide text-muted-foreground uppercase">
              Contributed
            </p>
            <p className="mt-0.5 font-heading text-xl font-bold text-primary tabular-nums">
              ₹{formatInrAmount(hub.totalContributedInr)}
            </p>
          </div>
          <div>
            <p className="text-[0.6rem] font-bold tracking-wide text-muted-foreground uppercase">
              Expenses
            </p>
            <p className="mt-0.5 font-heading text-xl font-bold text-destructive tabular-nums">
              ₹{formatInrAmount(hub.totalExpensesInr)}
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Fund actions" className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="tonal"
          size="sm"
          className="min-h-12 w-full rounded-full text-[0.65rem]"
          onClick={() => setExpenseOpen(true)}
        >
          <Plus aria-hidden />
          Add expense
        </Button>
        {canAsk ? (
          <Button
            type="button"
            variant="tonal"
            size="sm"
            className="min-h-12 w-full rounded-full text-[0.65rem]"
            onClick={() => setAskOpen(true)}
          >
            <HandCoins aria-hidden />
            Ask for funds
          </Button>
        ) : null}
      </section>

      <section aria-labelledby="contributions-heading" className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2
            id="contributions-heading"
            className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            Contributions by player
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-[0.65rem] font-semibold text-primary"
            onClick={() => openRecord()}
          >
            Record
          </Button>
        </div>
        {hub.playerContributions.length === 0 ? (
          <EmptyState
            title="No active players"
            description="Add players on Team before tracking contributions."
          />
        ) : (
          <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-xl bg-surface-container-low">
            {hub.playerContributions.map((player) => (
              <ContributionRow
                key={player.userId}
                player={player}
                onRecord={() => openRecord(String(player.userId))}
              />
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="expense-history-heading" className="space-y-3">
        <h2
          id="expense-history-heading"
          className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
        >
          All expenses
        </h2>
        {hub.expenses.length === 0 ? (
          <EmptyState
            title="No expenses yet"
            description="Record ground fees, kit, or other club costs to debit the fund."
          />
        ) : (
          <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-xl bg-surface-container-low">
            {hub.expenses.map((expense) => (
              <ExpenseRow key={expense.id} expense={expense} />
            ))}
          </ul>
        )}
      </section>

      <AddExpenseSheet open={expenseOpen} onOpenChange={setExpenseOpen} />
      {canAsk ? (
        <AskForFundsSheet open={askOpen} onOpenChange={setAskOpen} />
      ) : null}
      <RecordContributionSheet
        open={recordOpen}
        onOpenChange={setRecordOpen}
        players={hub.playerContributions}
        initialUserId={recordUserId}
      />
    </div>
  );
}

export { ExpensesShell };
