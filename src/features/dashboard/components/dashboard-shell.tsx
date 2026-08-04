"use client";

import Link from "next/link";
import {
  BellRing,
  Car,
  IndianRupee,
  Plus,
  Users,
  WalletCards,
} from "lucide-react";

import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import { MatchTicket } from "@/features/dashboard/components/match-ticket";
import { PastWeekendMatchPaymentCard } from "@/features/dashboard/components/past-weekend-match-payment-card";
import { useDashboardSnapshot } from "@/features/dashboard/hooks";
import { useNotificationsUi } from "@/features/notifications/providers/notifications-ui-provider";
import { formatMatchDate } from "@/features/team/lib/match-format";
import { formatInrAmount, nextWeekendDates } from "@/utils";

/**
 * Home command center — summarize the weekend, do not manage it.
 */
function DashboardShell() {
  const snapshotQuery = useDashboardSnapshot();
  const { openAlerts } = useNotificationsUi();

  if (snapshotQuery.isError) {
    return (
      <ErrorState
        title="Access denied"
        description="You must be an active Ranches Thunders member to use the app."
        onRetry={() => void snapshotQuery.refetch()}
      />
    );
  }

  const snap = snapshotQuery.data;
  // Also covers prerender / signed-out render where the query stays disabled.
  if (!snap) {
    return <LoadingState label="Loading home" />;
  }

  const role = snap.membership.role;
  const canCreate = hasPermission(role, PERMISSIONS.MATCH_CREATE);
  const canAdd = hasPermission(role, PERMISSIONS.TEAM_MEMBER_ADD);
  // Ops status rail is Admin-only (team unpaid total + fund control surface).
  const showAdminStatus = hasPermission(role, PERMISSIONS.SETTLEMENT_MANAGE);
  const weekendMatches = snap.weekendMatches;
  const moreUpcomingMatches = snap.moreUpcomingMatches;
  const pastWeekendSummaries = snap.pastWeekendPaymentSummaries;
  const carpoolTotal = snap.pollSummaries
    .filter((summary) =>
      weekendMatches.some((match) => match.id === summary.matchId),
    )
    .reduce((s, p) => s + p.carpoolCount, 0);
  const recent = snap.recentNotifications[0];
  const thisWeekendTitle = weekendStatusTitle(weekendMatches);
  const weekend = nextWeekendDates();
  const thisWeekendHeading =
    weekendMatches.length > 0
      ? `This weekend · ${thisWeekendTitle}`
      : `This weekend · ${formatMatchDate(weekend.saturday)} · ${formatMatchDate(weekend.sunday)}`;
  const pastWeekendHeading = `Last weekend · ${formatMatchDate(snap.pastWeekendWeekStart)} · ${formatMatchDate(
    // Sunday = Saturday + 1 day displayed via summaries or week start +1
    pastWeekendSunday(snap.pastWeekendWeekStart),
  )}`;

  return (
    <div className="space-y-4">
      <DashboardGreeting />

      <section aria-labelledby="this-weekend-heading" className="space-y-3">
        <h2
          id="this-weekend-heading"
          className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
        >
          {thisWeekendHeading}
        </h2>
        {weekendMatches.length === 0 ? (
          <EmptyState
            title="No matches this weekend"
            description={
              canCreate
                ? "Create Saturday or Sunday fixtures to start polls."
                : "Wait for your admin to publish the weekend schedule."
            }
          />
        ) : (
          weekendMatches.map((match) => (
            <MatchTicket key={match.id} match={match} />
          ))
        )}
      </section>

      {moreUpcomingMatches.length > 0 ? (
        <section aria-labelledby="more-upcoming-heading" className="space-y-3">
          <h2
            id="more-upcoming-heading"
            className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
          >
            More upcoming matches
          </h2>
          {moreUpcomingMatches.map((match) => (
            <MatchTicket key={match.id} match={match} />
          ))}
        </section>
      ) : null}

      {showAdminStatus && pastWeekendSummaries.length > 0 ? (
        <section
          aria-labelledby="past-weekend-payments-heading"
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h2
              id="past-weekend-payments-heading"
              className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase"
            >
              {pastWeekendHeading}
            </h2>
            <Link
              href="/payments"
              className="text-[0.65rem] font-semibold text-primary underline-offset-2 hover:underline"
            >
              Payments
            </Link>
          </div>
          <ul className="space-y-2">
            {pastWeekendSummaries.map((row) => (
              <PastWeekendMatchPaymentCard key={row.matchId} summary={row} />
            ))}
          </ul>
        </section>
      ) : null}

      {showAdminStatus ? (
        <section aria-label={thisWeekendTitle} className="space-y-2">
          <h2 className="text-[0.65rem] font-bold tracking-[0.08em] text-muted-foreground uppercase">
            {thisWeekendTitle}
          </h2>
          <div className="grid grid-cols-3 gap-2">
            <StatusMetric
              icon={Car}
              value={carpoolTotal > 0 ? String(carpoolTotal) : "—"}
              label="Carpool"
              hint={
                carpoolTotal > 0
                  ? "players riding this weekend"
                  : "no carpool votes yet"
              }
            />
            <StatusMetric
              icon={IndianRupee}
              value={
                snap.unpaidCount > 0
                  ? `₹${formatInrAmount(snap.unpaidTotalInr)}`
                  : "—"
              }
              label="Unpaid fees"
              hint={
                snap.unpaidCount > 0
                  ? `${snap.unpaidCount} player${snap.unpaidCount === 1 ? "" : "s"} pending`
                  : "all weekend fees clear"
              }
              urgent={snap.unpaidCount > 0}
              href="/payments"
            />
            <StatusMetric
              icon={WalletCards}
              value={`₹${formatInrAmount(snap.fundBalanceInr)}`}
              label="Team fund"
              hint="club balance on hand"
              href="/expenses"
            />
          </div>
        </section>
      ) : null}

      <section aria-labelledby="recent-alerts-heading">
        <h2
          id="recent-alerts-heading"
          className="flex items-center gap-2 text-[0.65rem] font-bold tracking-[0.08em] uppercase"
        >
          <BellRing className="size-3.5" aria-hidden />
          Recent alerts
        </h2>
        <button
          type="button"
          onClick={openAlerts}
          className="mt-2 flex min-h-16 w-full items-center gap-3 rounded-xl bg-surface-container px-4 py-3 text-left transition-colors hover:bg-surface-container-high"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="size-4" aria-hidden />
          </span>
          <span>
            <span className="block text-xs font-semibold">
              {recent?.title ?? "You’re all caught up"}
            </span>
            <span className="mt-0.5 block text-[0.65rem] leading-4 text-muted-foreground">
              {recent?.body ?? "Match and payment alerts will appear here."}
            </span>
          </span>
        </button>
      </section>

      {(canCreate || canAdd) && (
        <section aria-label="Admin actions">
          <div className="grid grid-cols-2 gap-2">
            {canCreate ? (
              <Button
                asChild
                variant="tonal"
                size="sm"
                className="min-h-12 w-full rounded-full text-[0.65rem]"
              >
                <Link href="/matches/new">
                  <Plus aria-hidden />
                  Create match
                </Link>
              </Button>
            ) : null}
            {canAdd ? (
              <Button
                asChild
                variant="tonal"
                size="sm"
                className="min-h-12 w-full rounded-full text-[0.65rem]"
              >
                <Link href="/team">
                  <Users aria-hidden />
                  Add player
                </Link>
              </Button>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}

type MetricIcon = typeof Users;

function pastWeekendSunday(saturdayIso: string): string {
  const [y, m, d] = saturdayIso.split("-").map(Number);
  const sunday = new Date(y!, (m ?? 1) - 1, (d ?? 1) + 1);
  const year = sunday.getFullYear();
  const month = String(sunday.getMonth() + 1).padStart(2, "0");
  const day = String(sunday.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** e.g. "Sat 1 Aug · Sun 2 Aug" from weekend fixtures. */
function weekendStatusTitle(matches: Array<{ matchDate: string }>): string {
  const uniqueDates = [
    ...new Set(matches.map((match) => match.matchDate).filter(Boolean)),
  ].sort();

  if (uniqueDates.length > 0) {
    return uniqueDates.map((date) => formatMatchDate(date)).join(" · ");
  }

  const { saturday, sunday } = nextWeekendDates();
  return `${formatMatchDate(saturday)} · ${formatMatchDate(sunday)}`;
}

function StatusMetric({
  icon: Icon,
  label,
  value,
  hint,
  urgent = false,
  href,
}: {
  icon: MetricIcon;
  label: string;
  value: string;
  hint: string;
  urgent?: boolean;
  href?: string;
}) {
  const className = urgent
    ? "flex min-h-[5.5rem] min-w-0 flex-col items-center justify-center rounded-xl border-b-2 border-destructive bg-surface-container-low px-2 py-3 text-center transition-colors"
    : "flex min-h-[5.5rem] min-w-0 flex-col items-center justify-center rounded-xl bg-surface-container-low px-2 py-3 text-center transition-colors";

  const body = (
    <>
      <Icon
        className={urgent ? "size-4 text-destructive" : "size-4 text-primary"}
        aria-hidden
      />
      <p className="mt-1.5 font-heading text-xl leading-none font-bold tabular-nums">
        {value}
      </p>
      <p className="mt-1 text-[0.65rem] font-bold tracking-wide text-foreground uppercase">
        {label}
      </p>
      <p className="mt-0.5 line-clamp-2 text-[0.6rem] leading-3.5 text-muted-foreground">
        {hint}
      </p>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${className} hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none`}
        aria-label={`${label}: ${value}. ${hint}`}
      >
        {body}
      </Link>
    );
  }

  return (
    <div className={className} aria-label={`${label}: ${value}. ${hint}`}>
      {body}
    </div>
  );
}

export { DashboardShell };
