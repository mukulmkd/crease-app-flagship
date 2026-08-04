import { weekendContainingDate } from "@/utils";
import type { Match } from "@/types/models";

export type WeekendMatchBucket = {
  saturday: string;
  sunday: string;
  matches: Match[];
};

/** Group fixtures by the Saturday that starts their weekend. */
export function groupMatchesByWeekend(matches: Match[]): WeekendMatchBucket[] {
  const map = new Map<string, Match[]>();
  for (const match of matches) {
    const { saturday } = weekendContainingDate(match.matchDate);
    const list = map.get(saturday) ?? [];
    list.push(match);
    map.set(saturday, list);
  }

  return [...map.entries()].map(([saturday, items]) => {
    const week = weekendContainingDate(items[0]!.matchDate);
    return {
      saturday,
      sunday: week.sunday,
      matches: items.sort((a, b) => a.matchDate.localeCompare(b.matchDate)),
    };
  });
}

export function weekendDayLabels(bucket: WeekendMatchBucket): string {
  const days = bucket.matches.map((match) =>
    match.matchDate === bucket.saturday ? "Sat" : "Sun",
  );
  return [...new Set(days)].join(" · ");
}
