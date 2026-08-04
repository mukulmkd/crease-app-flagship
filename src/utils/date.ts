/** Local calendar date as `YYYY-MM-DD` — never `toISOString()`, which shifts to UTC. */
export function toLocalIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayIsoDate(): string {
  return toLocalIsoDate(new Date());
}

/** Normalize `HH:MM` / `HH:MM:SS` for IST datetime construction. */
function normalizeIstTime(startTime: string | null): string {
  if (!startTime?.trim()) return "23:59:59";
  const parts = startTime.trim().split(":");
  const hours = (parts[0] ?? "23").padStart(2, "0");
  const minutes = (parts[1] ?? "59").padStart(2, "0");
  const seconds = (parts[2] ?? "00").padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

/**
 * True once the match kickoff has started in Asia/Kolkata.
 * Missing start time falls back to end of match day so carpool stays open.
 */
export function isMatchStartedIst(
  matchDate: string,
  startTime: string | null,
  now: Date = new Date(),
): boolean {
  const kickoff = new Date(`${matchDate}T${normalizeIstTime(startTime)}+05:30`);
  if (Number.isNaN(kickoff.getTime())) return false;
  return now.getTime() >= kickoff.getTime();
}

export type WeekendDates = { saturday: string; sunday: string };

/** Upcoming weekend, staying on the current weekend through Sunday. */
export function nextWeekendDates(from: Date = new Date()): WeekendDates {
  return weekendDatesAtOffset(0, from);
}

/**
 * Saturday/Sunday for the weekend `weeksAhead` after the current/upcoming one.
 * `0` = this weekend (through Sunday), `1` = next weekend, etc.
 */
export function weekendDatesAtOffset(
  weeksAhead: number,
  from: Date = new Date(),
): WeekendDates {
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const weekday = today.getDay();
  const saturday = new Date(today);

  if (weekday === 0) {
    saturday.setDate(today.getDate() - 1);
  } else if (weekday !== 6) {
    saturday.setDate(today.getDate() + (6 - weekday));
  }
  saturday.setDate(saturday.getDate() + weeksAhead * 7);

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    saturday: toLocalIsoDate(saturday),
    sunday: toLocalIsoDate(sunday),
  };
}

/** Next N weekends starting at this weekend (offset 0). */
function listUpcomingWeekends(
  count = 6,
  from: Date = new Date(),
): WeekendDates[] {
  return Array.from({ length: count }, (_, offset) =>
    weekendDatesAtOffset(offset, from),
  );
}

/**
 * Weekend picker for create flow. When `pastCount` > 0 (demo mode), includes
 * recent past weekends before the upcoming ones so Admin can run payment E2E.
 */
export function listWeekendsForCreate(options?: {
  upcomingCount?: number;
  pastCount?: number;
  from?: Date;
}): WeekendDates[] {
  const from = options?.from ?? new Date();
  const upcomingCount = options?.upcomingCount ?? 8;
  const pastCount = options?.pastCount ?? 0;
  const upcoming = listUpcomingWeekends(upcomingCount, from);
  if (pastCount <= 0) return upcoming;
  const past = Array.from({ length: pastCount }, (_, i) =>
    weekendDatesAtOffset(-(i + 1), from),
  ).reverse();
  return [...past, ...upcoming];
}

export function isImmediateWeekendDate(
  isoDate: string,
  from: Date = new Date(),
): boolean {
  const weekend = nextWeekendDates(from);
  return isoDate === weekend.saturday || isoDate === weekend.sunday;
}

/**
 * Saturday/Sunday pair for the weekend that contains `isoDate`.
 * Weekend = Sat + Sun (days since last Saturday).
 */
export function weekendContainingDate(isoDate: string): WeekendDates {
  const parts = isoDate.split("-").map(Number);
  const year = parts[0] ?? 1970;
  const month = parts[1] ?? 1;
  const day = parts[2] ?? 1;
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  const daysSinceSaturday = (weekday + 1) % 7;
  const saturday = new Date(date);
  saturday.setDate(date.getDate() - daysSinceSaturday);
  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);
  return {
    saturday: toLocalIsoDate(saturday),
    sunday: toLocalIsoDate(sunday),
  };
}
