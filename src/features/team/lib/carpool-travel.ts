import type { MatchCarpoolRide } from "@/types/models";

/**
 * Travel lookup built from the saved post-match assignment.
 *
 * Poll votes are intent only — once Admin saves rides, squad lists must read
 * driver / passenger from `match_carpool_rides`, never from the carpool poll.
 */
export type TravelIndex = {
  passengerCountByDriver: Map<string, number>;
  driverByPassenger: Map<string, string>;
  passengerCount: number;
  driverCount: number;
};

export function buildTravelIndex(rides: MatchCarpoolRide[]): TravelIndex {
  const passengerCountByDriver = new Map<string, number>();
  const driverByPassenger = new Map<string, string>();

  for (const ride of rides) {
    const driverId = String(ride.driverUserId);
    const passengers = ride.passengerUserIds.map(String);
    passengerCountByDriver.set(
      driverId,
      (passengerCountByDriver.get(driverId) ?? 0) + passengers.length,
    );
    for (const passengerId of passengers) {
      driverByPassenger.set(passengerId, driverId);
    }
  }

  return {
    passengerCountByDriver,
    driverByPassenger,
    passengerCount: driverByPassenger.size,
    driverCount: passengerCountByDriver.size,
  };
}

function firstName(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim();
  if (!trimmed) return "Player";
  return trimmed.split(/\s+/)[0]!;
}

/** "Driver · 2 pax" / "Passenger · with Rohit" / "Own". */
export function travelLabel(
  index: TravelIndex,
  userId: string,
  nameFor: (userId: string) => string | null,
): string {
  const drivenCount = index.passengerCountByDriver.get(userId);
  if (drivenCount !== undefined) {
    return drivenCount > 0 ? `Driver · ${drivenCount} pax` : "Driver";
  }

  const driverId = index.driverByPassenger.get(userId);
  if (driverId) {
    return `Passenger · with ${firstName(nameFor(driverId))}`;
  }

  return "Own";
}

/** Pre-assignment fallback — carpool poll intent, clearly marked as intent. */
export function travelIntentLabel(carpool: "carpool" | "self" | null): string {
  return carpool === "carpool" ? "Carpool (intent)" : "Own (intent)";
}
