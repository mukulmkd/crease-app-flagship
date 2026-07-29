import { z } from "zod";

const dayFieldsSchema = z.object({
  enabled: z.boolean(),
  classification: z.enum(["warmup", "tournament"]),
  tournamentId: z.string().optional(),
  opposition: z.string().trim().max(120).optional(),
  groundMapsUrl: z.string().trim().optional(),
  startTime: z.enum(["06:30:00", "09:30:00"]).optional(),
  matchFeesInr: z.number().nonnegative().optional(),
  /** Enable polls when the match is confirmed. */
  pollsEnabled: z.boolean(),
});

export const weekendMatchFormSchema = z
  .object({
    weekendOffset: z.number().int().min(0).max(12),
    saturday: dayFieldsSchema,
    sunday: dayFieldsSchema,
  })
  .superRefine((value, ctx) => {
    if (!value.saturday.enabled && !value.sunday.enabled) {
      ctx.addIssue({
        code: "custom",
        message: "Select Saturday, Sunday, or both",
        path: ["saturday", "enabled"],
      });
    }

    for (const day of ["saturday", "sunday"] as const) {
      const fields = value[day];
      if (
        fields.enabled &&
        fields.classification === "tournament" &&
        !fields.tournamentId
      ) {
        ctx.addIssue({
          code: "custom",
          message: "Select or create a tournament",
          path: [day, "tournamentId"],
        });
      }
    }
  });

export type WeekendMatchFormValues = z.infer<typeof weekendMatchFormSchema>;
export type WeekendDayKey = "saturday" | "sunday";

export const emptyDayDefaults = {
  enabled: false,
  classification: "warmup" as const,
  tournamentId: "",
  opposition: "",
  groundMapsUrl: "",
  startTime: "06:30:00" as const,
  matchFeesInr: undefined as number | undefined,
  pollsEnabled: true,
};

export {
  listUpcomingWeekends,
  nextWeekendDates,
  weekendDatesAtOffset,
} from "@/utils";
