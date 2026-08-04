"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { BodySm } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import {
  useCarpoolAssignments,
  useMatchPolls,
  useSaveCarpoolAssignments,
  useSeedDemoCarpool,
  useSquadLimits,
  useTeamMembers,
} from "@/features/team/hooks";
import type { MatchCarpoolRide } from "@/types/models";

type RideDraft = {
  key: string;
  driverUserId: string;
  passengerUserIds: string[];
};

type SquadRow = {
  userId: string;
  fullName: string | null;
  carpool: "carpool" | "self" | null;
};

type MatchCarpoolAssignProps = {
  matchId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function buildInitialRides(
  existing: MatchCarpoolRide[],
  squad: SquadRow[],
): RideDraft[] {
  if (existing.length > 0) {
    return existing.map((ride, index) => ({
      key: `existing-${index}-${ride.driverUserId}`,
      driverUserId: String(ride.driverUserId),
      passengerUserIds: ride.passengerUserIds.map(String),
    }));
  }

  const intentDrivers = squad
    .filter((row) => row.carpool === "carpool")
    .map((row) => row.userId);
  if (intentDrivers.length === 1) {
    const driver = intentDrivers[0]!;
    return [
      {
        key: `hint-${driver}`,
        driverUserId: driver,
        passengerUserIds: [],
      },
    ];
  }
  return [];
}

function CarpoolAssignForm({
  matchId,
  squad,
  initialRides,
  demoMode,
  onClose,
}: {
  matchId: string;
  squad: SquadRow[];
  initialRides: RideDraft[];
  demoMode: boolean;
  onClose: () => void;
}) {
  const save = useSaveCarpoolAssignments();
  const seedDemo = useSeedDemoCarpool();
  const [rides, setRides] = useState<RideDraft[]>(initialRides);

  const nameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of squad) {
      map.set(row.userId, row.fullName?.trim() || "Player");
    }
    return map;
  }, [squad]);

  const usedIds = useMemo(() => {
    const set = new Set<string>();
    for (const ride of rides) {
      if (ride.driverUserId) set.add(ride.driverUserId);
      for (const id of ride.passengerUserIds) set.add(id);
    }
    return set;
  }, [rides]);

  return (
    <div className="space-y-4 px-4 pb-6">
      {demoMode ? (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          loading={seedDemo.isPending}
          disabled={squad.length === 0}
          onClick={async () => {
            try {
              const result = await seedDemo.mutateAsync(matchId);
              toast.success({
                title:
                  result.rides.length > 0
                    ? "Dummy carpool assigned"
                    : "Saved — nobody carpooled",
                description:
                  result.rides.length > 0
                    ? "First squad member drives; others are passengers."
                    : undefined,
              });
              onClose();
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Fill dummy carpool
        </Button>
      ) : null}

      {rides.map((ride, rideIndex) => {
        const availableDrivers = squad.filter(
          (row) => row.userId === ride.driverUserId || !usedIds.has(row.userId),
        );
        const availablePassengers = squad.filter(
          (row) =>
            row.userId !== ride.driverUserId &&
            (ride.passengerUserIds.includes(row.userId) ||
              !usedIds.has(row.userId)),
        );

        return (
          <div
            key={ride.key}
            className="space-y-3 rounded-xl bg-surface-container-low p-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="font-heading text-lg font-bold uppercase">
                Ride {rideIndex + 1}
              </p>
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Remove ride"
                onClick={() =>
                  setRides((prev) =>
                    prev.filter((item) => item.key !== ride.key),
                  )
                }
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            </div>

            <label className="block space-y-1 text-sm">
              <span className="text-muted-foreground">Driver</span>
              <select
                className="h-12 w-full rounded-lg border border-border bg-background px-3"
                value={ride.driverUserId}
                onChange={(e) => {
                  const driverUserId = e.target.value;
                  setRides((prev) =>
                    prev.map((item) =>
                      item.key === ride.key
                        ? {
                            ...item,
                            driverUserId,
                            passengerUserIds: item.passengerUserIds.filter(
                              (id) => id !== driverUserId,
                            ),
                          }
                        : item,
                    ),
                  );
                }}
              >
                <option value="">Select driver</option>
                {availableDrivers.map((row) => (
                  <option key={row.userId} value={row.userId}>
                    {nameById.get(row.userId)}
                    {row.carpool === "carpool" ? " · intent carpool" : ""}
                  </option>
                ))}
              </select>
            </label>

            <fieldset className="space-y-2">
              <legend className="text-sm text-muted-foreground">
                Passengers
              </legend>
              {availablePassengers.length === 0 ? (
                <BodySm>No remaining players.</BodySm>
              ) : (
                availablePassengers.map((row) => {
                  const checked = ride.passengerUserIds.includes(row.userId);
                  return (
                    <label
                      key={row.userId}
                      className="flex min-h-12 items-center gap-3 rounded-lg px-2"
                    >
                      <input
                        type="checkbox"
                        className="size-5"
                        checked={checked}
                        onChange={(e) => {
                          setRides((prev) =>
                            prev.map((item) => {
                              if (item.key !== ride.key) return item;
                              const next = e.target.checked
                                ? [...item.passengerUserIds, row.userId]
                                : item.passengerUserIds.filter(
                                    (id) => id !== row.userId,
                                  );
                              return { ...item, passengerUserIds: next };
                            }),
                          );
                        }}
                      />
                      <span className="text-sm font-medium">
                        {nameById.get(row.userId)}
                      </span>
                    </label>
                  );
                })
              )}
            </fieldset>
          </div>
        );
      })}

      <Button
        type="button"
        variant="tonal"
        className="w-full"
        onClick={() =>
          setRides((prev) => [
            ...prev,
            {
              key: `new-${Date.now()}`,
              driverUserId: "",
              passengerUserIds: [],
            },
          ])
        }
      >
        <Plus className="size-4" aria-hidden />
        Add ride
      </Button>

      <div className="flex flex-col gap-2">
        <Button
          type="button"
          className="w-full"
          loading={save.isPending}
          onClick={async () => {
            const payload = rides
              .filter((ride) => ride.driverUserId)
              .map((ride) => ({
                driverUserId: ride.driverUserId,
                passengerUserIds: ride.passengerUserIds,
              }));
            try {
              await save.mutateAsync({ matchId, rides: payload });
              toast.success({ title: "Carpool assignment saved" });
              onClose();
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Save assignment
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          loading={save.isPending}
          onClick={async () => {
            try {
              await save.mutateAsync({ matchId, rides: [] });
              toast.success({ title: "Saved — nobody carpooled" });
              onClose();
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          }}
        >
          Nobody carpooled
        </Button>
      </div>
    </div>
  );
}

function MatchCarpoolAssign({
  matchId,
  open,
  onOpenChange,
}: MatchCarpoolAssignProps) {
  const { demoMode } = useSquadLimits();
  const pollsQuery = useMatchPolls(matchId);
  const membersQuery = useTeamMembers({ status: "active", limit: 100 });
  const assignmentsQuery = useCarpoolAssignments(matchId);

  // Drivers/passengers = every active member (Admin or player). Poll roster
  // is only used for carpool-intent hints on the names.
  const players = useMemo(() => {
    const carpoolByUser = new Map(
      (pollsQuery.data?.roster ?? []).map((row) => [row.userId, row.carpool]),
    );
    return (membersQuery.data?.items ?? [])
      .map((member) => {
        const userId = String(member.userId);
        return {
          userId,
          fullName: member.profile.fullName,
          carpool: carpoolByUser.get(userId) ?? null,
        };
      })
      .sort((a, b) =>
        (a.fullName ?? "").localeCompare(b.fullName ?? "", undefined, {
          sensitivity: "base",
        }),
      );
  }, [membersQuery.data, pollsQuery.data]);

  const initialRides = useMemo(
    () => buildInitialRides(assignmentsQuery.data ?? [], players),
    [assignmentsQuery.data, players],
  );

  const membersReady = Boolean(membersQuery.data);
  const formKey = `${matchId}-${assignmentsQuery.dataUpdatedAt}-${membersQuery.dataUpdatedAt}-${open ? "open" : "closed"}`;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="max-h-[90dvh] overflow-y-auto bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
            Assign carpool
          </BottomSheetTitle>
          <BottomSheetDescription>
            {demoMode
              ? "Demo · any player can drive or ride. Passengers pay ₹0.25; drivers get ₹0.25 credit per passenger. Or fill a dummy ride in one tap."
              : "Who drove whom after the match. Any active player can drive or ride. Passengers pay ₹100; drivers get ₹100 credit per passenger."}
          </BottomSheetDescription>
        </BottomSheetHeader>

        {open && membersReady ? (
          <CarpoolAssignForm
            key={formKey}
            matchId={matchId}
            squad={players}
            initialRides={initialRides}
            demoMode={demoMode}
            onClose={() => onOpenChange(false)}
          />
        ) : open ? (
          <BodySm className="px-4 pb-6">Loading players…</BodySm>
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { MatchCarpoolAssign };
