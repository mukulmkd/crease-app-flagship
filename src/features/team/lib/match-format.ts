import type { Match } from "@/types/models";

export function formatMatchDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return isoDate;

  return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatMatchTime(startTime: Match["startTime"]): string {
  if (startTime === "06:30:00") return "6:30 AM";
  if (startTime === "09:30:00") return "9:30 AM";
  return "Time TBD";
}

export function matchOpposition(match: Match): string {
  return match.opposition ? `vs ${match.opposition}` : "Opposition TBD";
}
