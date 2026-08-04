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

import { MetricRail } from "@/components/common/metric-rail";
import { TeamIdentity } from "@/components/common/team-identity";
import { Caption, Overline, Stat } from "@/components/common/typography";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { DashboardGreeting } from "@/features/dashboard/components/dashboard-greeting";
import { MatchTicket } from "@/features/dashboard/components/match-ticket";
import { PastWeekendMatchPaymentCard } from "@/features/dashboard/components/past-weekend-match-payment-card";
import { WeekendDuesCallout } from "@/features/dashboard/components/player-dues-callout";
import { useDashboardSnapshot } from "@/features/dashboard/hooks";
import { useNotificationsUi } from "@/features/notifications/providers/notifications-ui-provider";
import { useMyWeekendDues } from "@/features/payments/hooks";
import {
  formatMatchDate,
  formatWeekendRange,
} from "@/features/team/lib/match-format";
import type { MyWeekendDues } from "@/services/payment.service";
import type { DashboardMatchPaymentSummary } from "@/services/dashboard.service";
import { formatInrAmount, nextWeekendDates, todayIsoDate } from "@/utils";

const dashboardSectionHeadingClass =
  "text-xs font-medium tracking-normal normal-case text-muted-foreground sm:font-semibold sm:tracking-[0.1em] sm:uppercase";

/**
 * Home command center — summarize the weekend, do not manage it.
 */
function DashboardShell() {
  const snapshotQuery = useDashboardSnapshot();
  const duesQuery = useMyWeekendDues();
  const { openAlerts } = useNotificationsUi();

  if (snapshotQuery.isError) {
    return (
      <ErrorState
        title="Couldn’t load home"
        description="Check your connection and try again."
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
  const teamSnapshotHeading = `Team snapshot as of ${formatMatchDate(todayIsoDate())}`;
  const weekend = nextWeekendDates();
  const thisWeekendHeading =
    weekendMatches.length > 0
      ? `This weekend · ${thisWeekendTitle}`
      : `This weekend · ${formatMatchDate(weekend.saturday)} · ${formatMatchDate(weekend.sunday)}`;
  const settlementWeekendGroups = buildSettlementWeekendGroups(
    duesQuery.data ?? [],
    showAdminStatus ? pastWeekendSummaries : [],
    snap.pastWeekendWeekStart,
  );

  return (
    <div className="space-y-5">
      <TeamIdentity />
      <DashboardGreeting />

      <section aria-labelledby="this-weekend-heading" className="space-y-3">
        <Overline
          id="this-weekend-heading"
          className={dashboardSectionHeadingClass}
        >
          {thisWeekendHeading}
        </Overline>
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

      {settlementWeekendGroups.map((group) => (
        <section
          key={group.weekStartDate}
          aria-labelledby={`settlement-weekend-${group.weekStartDate}`}
          className="space-y-3"
        >
          <div className="flex items-center justify-between gap-2">
            <Overline
              id={`settlement-weekend-${group.weekStartDate}`}
              className={dashboardSectionHeadingClass}
            >
              {group.weekStartDate === snap.pastWeekendWeekStart
                ? "Last weekend"
                : "Weekend"}{" "}
              · {formatWeekendRange(group.weekStartDate, group.weekEndDate)}
            </Overline>
            {group.adminSummaries.length > 0 ? (
              <Link
                href="/payments"
                className="shrink-0 text-xs font-semibold text-primary underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                Payments
              </Link>
            ) : null}
          </div>
          {group.personalDues ? (
            <WeekendDuesCallout weekend={group.personalDues} />
          ) : null}
          {group.adminSummaries.length > 0 ? (
            <ul className="space-y-2">
              {group.adminSummaries.map((row) => (
                <PastWeekendMatchPaymentCard key={row.matchId} summary={row} />
              ))}
            </ul>
          ) : null}
        </section>
      ))}

      {moreUpcomingMatches.length > 0 ? (
        <section aria-labelledby="more-upcoming-heading" className="space-y-3">
          <Overline
            id="more-upcoming-heading"
            className={dashboardSectionHeadingClass}
          >
            More upcoming matches
          </Overline>
          {moreUpcomingMatches.map((match) => (
            <MatchTicket key={match.id} match={match} />
          ))}
        </section>
      ) : null}

      {showAdminStatus ? (
        <section aria-label={teamSnapshotHeading} className="space-y-2">
          <Overline className={dashboardSectionHeadingClass}>
            {teamSnapshotHeading}
          </Overline>
          <MetricRail className="gap-1.5 sm:gap-2">
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
              mobileLabel="Unpaid"
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
              label="Funds"
              mobileLabel="Fund"
              hint="balance on hand"
              href="/expenses"
            />
          </MetricRail>
        </section>
      ) : null}

      <section aria-labelledby="recent-alerts-heading">
        <Overline
          id="recent-alerts-heading"
          className={`flex items-center gap-1.5 ${dashboardSectionHeadingClass}`}
        >
          <BellRing className="size-3 sm:size-3.5" aria-hidden />
          Recent alerts
        </Overline>
        <button
          type="button"
          onClick={openAlerts}
          className="mt-2 flex min-h-16 w-full items-center gap-3 rounded-xl bg-surface-container-low px-4 py-3 text-left transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <BellRing className="size-4" aria-hidden />
          </span>
          <span>
            <span className="block text-xs font-semibold">
              {recent?.title ?? "You’re all caught up"}
            </span>
            <span className="mt-0.5 block text-xs leading-4 text-muted-foreground">
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
                className="min-h-12 w-full rounded-xl text-xs"
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
                className="min-h-12 w-full rounded-xl text-xs"
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

type SettlementWeekendGroup = {
  weekStartDate: string;
  weekEndDate: string;
  personalDues: MyWeekendDues | null;
  adminSummaries: DashboardMatchPaymentSummary[];
};

function buildSettlementWeekendGroups(
  personalDues: MyWeekendDues[],
  adminSummaries: DashboardMatchPaymentSummary[],
  pastWeekendWeekStart: string,
): SettlementWeekendGroup[] {
  const groups = new Map<string, SettlementWeekendGroup>();

  for (const weekend of personalDues) {
    groups.set(weekend.weekStartDate, {
      weekStartDate: weekend.weekStartDate,
      weekEndDate: weekend.weekEndDate,
      personalDues: weekend,
      adminSummaries: [],
    });
  }

  if (adminSummaries.length > 0) {
    const existing = groups.get(pastWeekendWeekStart);
    groups.set(pastWeekendWeekStart, {
      weekStartDate: pastWeekendWeekStart,
      weekEndDate:
        existing?.weekEndDate ?? pastWeekendSunday(pastWeekendWeekStart),
      personalDues: existing?.personalDues ?? null,
      adminSummaries,
    });
  }

  return [...groups.values()].sort((a, b) =>
    b.weekStartDate.localeCompare(a.weekStartDate),
  );
}

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
  mobileLabel,
  value,
  hint,
  urgent = false,
  href,
}: {
  icon: MetricIcon;
  label: string;
  mobileLabel?: string;
  value: string;
  hint: string;
  urgent?: boolean;
  href?: string;
}) {
  const className = urgent
    ? "flex min-h-16 min-w-0 flex-col items-center justify-center rounded-lg border-b-2 border-destructive bg-surface-container-low px-1.5 py-2 text-center transition-colors sm:min-h-[5.5rem] sm:rounded-xl sm:px-2 sm:py-3"
    : "flex min-h-16 min-w-0 flex-col items-center justify-center rounded-lg bg-surface-container-low px-1.5 py-2 text-center transition-colors sm:min-h-[5.5rem] sm:rounded-xl sm:px-2 sm:py-3";

  const body = (
    <>
      <Icon
        className={
          urgent
            ? "size-3.5 text-destructive sm:size-4"
            : "size-3.5 text-primary sm:size-4"
        }
        aria-hidden
      />
      <Stat className="mt-1 max-w-full text-base leading-none font-semibold tracking-tight whitespace-nowrap tabular-nums sm:mt-1.5 sm:text-xl">
        {value}
      </Stat>
      <Caption className="mt-1 leading-none font-medium tracking-normal text-foreground sm:hidden">
        {mobileLabel ?? label}
      </Caption>
      <Caption className="mt-1 hidden leading-none text-foreground uppercase sm:block">
        {label}
      </Caption>
      <Caption className="mt-0.5 line-clamp-2 hidden font-normal tracking-normal text-muted-foreground sm:block">
        {hint}
      </Caption>
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
