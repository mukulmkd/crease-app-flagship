"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { Button } from "@/components/ui/button";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { EditTournamentSheet } from "@/features/team/components/edit-tournament-sheet";
import { useMyMembership, useTournamentSummaries } from "@/features/team/hooks";
import {
  formatMatchDate,
  matchOpposition,
} from "@/features/team/lib/match-format";
import { formatInrAmount } from "@/utils";
import type { TournamentSummary } from "@/types/models";

function TournamentsListView() {
  const membershipQuery = useMyMembership();
  const summariesQuery = useTournamentSummaries();
  const canEdit = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.TOURNAMENT_EDIT,
  );
  const canCreate = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.TOURNAMENT_CREATE,
  );
  const [editTarget, setEditTarget] = useState<TournamentSummary | null>(null);

  if (summariesQuery.isLoading || membershipQuery.isLoading) {
    return <LoadingState label="Loading tournaments" />;
  }

  if (summariesQuery.isError) {
    return (
      <ErrorState
        title="Could not load tournaments"
        onRetry={() => void summariesQuery.refetch()}
      />
    );
  }

  const summaries = summariesQuery.data ?? [];
  const active = summaries.filter(
    (row) =>
      row.tournament.status === "active" || row.tournament.status === "draft",
  );
  const past = summaries.filter(
    (row) =>
      row.tournament.status === "completed" ||
      row.tournament.status === "cancelled",
  );

  return (
    <div className="space-y-6">
      <TournamentSection
        title="Active"
        emptyTitle="No active tournaments"
        emptyDescription={
          canCreate
            ? "Create a tournament in advance, then link fixtures when you schedule weekend matches."
            : "Your admin will publish tournaments here."
        }
        rows={active}
        canEdit={canEdit}
        onEdit={setEditTarget}
      />
      <TournamentSection
        title="Past tournaments"
        emptyTitle="No past tournaments"
        emptyDescription="Tournaments move here after every planned match fee is settled."
        rows={past}
        canEdit={false}
        onEdit={setEditTarget}
      />

      {editTarget ? (
        <EditTournamentSheet
          summary={editTarget}
          open={Boolean(editTarget)}
          onOpenChange={(open) => {
            if (!open) setEditTarget(null);
          }}
        />
      ) : null}
    </div>
  );
}

type TournamentSectionProps = {
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  rows: TournamentSummary[];
  canEdit: boolean;
  onEdit: (row: TournamentSummary) => void;
};

function TournamentSection({
  title,
  emptyTitle,
  emptyDescription,
  rows,
  canEdit,
  onEdit,
}: TournamentSectionProps) {
  return (
    <section className="space-y-3" aria-labelledby={`${title}-heading`}>
      <h2
        id={`${title}-heading`}
        className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase"
      >
        {title}
        {rows.length > 0 ? ` · ${rows.length}` : ""}
      </h2>
      {rows.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={String(row.tournament.id)}>
              <TournamentCard
                summary={row}
                canEdit={canEdit}
                onEdit={() => onEdit(row)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TournamentCard({
  summary,
  canEdit,
  onEdit,
}: {
  summary: TournamentSummary;
  canEdit: boolean;
  onEdit: () => void;
}) {
  const {
    tournament,
    remainingMatchCount,
    settledMatchCount,
    feePoolPerMatchInr,
    fixtures,
  } = summary;
  const isPast =
    tournament.status === "completed" || tournament.status === "cancelled";

  return (
    <article className="space-y-3 rounded-xl bg-surface-container-low p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-heading text-2xl leading-none font-semibold">
            {tournament.name}
          </p>
          <BodySm className="mt-1">
            ₹{formatInrAmount(tournament.totalFeesInr)} prepaid · ₹
            {formatInrAmount(feePoolPerMatchInr)} / match
          </BodySm>
        </div>
        <StatusChip status={isPast ? "success" : "info"}>
          {isPast ? "Past" : "Active"}
        </StatusChip>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Metric label="Planned" value={String(tournament.plannedMatchCount)} />
        <Metric label="Settled" value={String(settledMatchCount)} />
        <Metric
          label="Remaining"
          value={String(remainingMatchCount)}
          emphasize={!isPast && remainingMatchCount > 0}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
          Fixtures
        </p>
        {fixtures.length > 0 ? (
          <ul className="divide-y divide-outline-variant/40 overflow-hidden rounded-lg bg-surface-container-lowest">
            {fixtures.map((match) => (
              <li key={String(match.id)}>
                <Link
                  href={`/matches/${match.id}`}
                  className="flex min-h-12 items-center gap-3 px-3 py-2 transition-colors hover:bg-surface-container-high focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                >
                  <CalendarDays
                    className="size-4 shrink-0 text-primary"
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">
                      {matchOpposition(match)}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatMatchDate(match.matchDate)}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <BodySm>No fixtures linked yet.</BodySm>
        )}
      </div>

      {canEdit ? (
        <Button
          type="button"
          variant="tonal"
          className="w-full"
          onClick={onEdit}
        >
          Edit tournament
        </Button>
      ) : null}
    </article>
  );
}

function Metric({
  label,
  value,
  emphasize = false,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface-container-lowest px-2 py-3">
      <p
        className={`font-heading text-2xl font-bold tabular-nums ${
          emphasize ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        {label}
      </p>
    </div>
  );
}

export { TournamentsListView };
