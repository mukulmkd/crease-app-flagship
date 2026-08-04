"use client";

import { Car } from "lucide-react";

import {
  buildTravelIndex,
  travelIntentLabel,
  travelLabel,
} from "@/features/team/lib/carpool-travel";
import type { MatchCarpoolRide } from "@/types/models";

type TravelRow = {
  userId: string;
  fullName: string | null;
  carpool: "carpool" | "self" | null;
};

type MatchTravelListProps = {
  headingId: string;
  heading: string;
  rows: TravelRow[];
  emptyLabel: string;
  rides: MatchCarpoolRide[];
  /** True once Admin saved post-match rides — labels switch from intent to real. */
  assigned: boolean;
  nameFor: (userId: string) => string | null;
};

/** Squad roster with travel per player (driver / passenger + driver name / own). */
function MatchTravelList({
  headingId,
  heading,
  rows,
  emptyLabel,
  rides,
  assigned,
  nameFor,
}: MatchTravelListProps) {
  const index = buildTravelIndex(rides);

  return (
    <section aria-labelledby={headingId}>
      <h2 id={headingId} className="font-heading text-xl font-semibold">
        {heading}
      </h2>
      <ul className="mt-2 divide-y divide-outline-variant rounded-xl bg-surface-container-low">
        {rows.length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            {emptyLabel}
          </li>
        ) : (
          rows.map((row) => (
            <li
              key={row.userId}
              className="flex items-center justify-between gap-3 px-4 py-3 text-sm"
            >
              <span className="font-medium">
                {row.fullName?.trim() || "Player"}
              </span>
              <span className="text-xs text-muted-foreground">
                {assigned
                  ? travelLabel(index, row.userId, nameFor)
                  : travelIntentLabel(row.carpool)}
              </span>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

type MatchRidesSummaryProps = {
  rides: MatchCarpoolRide[];
  assigned: boolean;
  nameFor: (userId: string) => string | null;
};

/** Who drove whom — one block per ride, so multiple cars stay readable. */
function MatchRidesSummary({
  rides,
  assigned,
  nameFor,
}: MatchRidesSummaryProps) {
  const label = (userId: string) => nameFor(userId)?.trim() || "Player";

  return (
    <section aria-labelledby="rides-heading">
      <h2 id="rides-heading" className="font-heading text-xl font-semibold">
        Carpool rides
      </h2>
      <ul className="mt-2 space-y-2">
        {!assigned || rides.length === 0 ? (
          <li className="rounded-xl bg-surface-container-low px-4 py-3 text-sm text-muted-foreground">
            {assigned
              ? "Nobody carpooled for this match."
              : "Rides are assigned by Admin after kickoff."}
          </li>
        ) : (
          rides.map((ride) => {
            const passengers = ride.passengerUserIds.map(String);
            return (
              <li
                key={String(ride.id)}
                className="rounded-xl bg-surface-container-low px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <Car className="size-4 shrink-0 text-primary" aria-hidden />
                    <span className="truncate font-heading text-lg font-semibold">
                      {label(String(ride.driverUserId))}
                    </span>
                    <span className="shrink-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
                      Driver
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {passengers.length} pax
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {passengers.length === 0
                    ? "Drove alone"
                    : passengers.map(label).join(" · ")}
                </p>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}

export { MatchRidesSummary, MatchTravelList };
