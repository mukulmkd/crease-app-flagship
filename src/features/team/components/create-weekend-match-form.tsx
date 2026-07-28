"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Body, BodySm, SectionHeader } from "@/components/common";
import { AppCard, AppCardContent } from "@/components/cards";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useCreateTournament,
  useCreateWeekendMatches,
  useTournaments,
} from "@/features/team/hooks";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { type MATCH_START_TIMES } from "@/constants/domain/enums";
import type { CreateMatchDto } from "@/types/dto";

/** Local calendar YYYY-MM-DD — avoids UTC shift from toISOString(). */
function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDisplayDate(isoDate: string): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  if (!y || !m || !d) return isoDate;
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

/**
 * Upcoming Saturday + Sunday in local time.
 * If today is Sunday, still use this weekend (today as Sunday, yesterday Sat).
 * If today is Saturday, Sat = today and Sun = tomorrow.
 * Otherwise advance to the next Saturday.
 */
function nextWeekendDates(): { saturday: string; sunday: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekday = today.getDay(); // 0 Sun … 6 Sat

  const saturday = new Date(today);
  if (weekday === 6) {
    // Saturday
  } else if (weekday === 0) {
    saturday.setDate(today.getDate() - 1);
  } else {
    saturday.setDate(today.getDate() + (6 - weekday));
  }

  const sunday = new Date(saturday);
  sunday.setDate(saturday.getDate() + 1);

  return {
    saturday: toLocalIsoDate(saturday),
    sunday: toLocalIsoDate(sunday),
  };
}

const dayFieldsSchema = z.object({
  enabled: z.boolean(),
  classification: z.enum(["warmup", "tournament"]),
  tournamentId: z.string().optional(),
  opposition: z.string().trim().max(120).optional(),
  groundMapsUrl: z.string().trim().optional(),
  startTime: z.enum(["06:30:00", "09:30:00"]).optional(),
  matchFeesInr: z.number().nonnegative().optional(),
});

const formSchema = z
  .object({
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

type FormValues = z.infer<typeof formSchema>;
type DayKey = "saturday" | "sunday";

const tournamentSchema = z.object({
  name: z.string().trim().min(2).max(120),
  plannedMatchCount: z.number().int().positive(),
  totalFeesInr: z.number().nonnegative(),
});

type TournamentForm = z.infer<typeof tournamentSchema>;

const emptyDayDefaults = {
  enabled: false,
  classification: "warmup" as const,
  tournamentId: "",
  opposition: "",
  groundMapsUrl: "",
  startTime: "06:30:00" as const,
  matchFeesInr: undefined as number | undefined,
};

/**
 * Admin create weekend match(es) — each day has its own fields.
 */
function CreateWeekendMatchForm() {
  const router = useRouter();
  const weekend = useMemo(() => nextWeekendDates(), []);
  const tournamentsQuery = useTournaments();
  const createMatches = useCreateWeekendMatches();
  const createTournament = useCreateTournament();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tournamentTarget, setTournamentTarget] = useState<DayKey>("saturday");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      saturday: { ...emptyDayDefaults, enabled: true },
      sunday: { ...emptyDayDefaults },
    },
  });

  const tournamentForm = useForm<TournamentForm>({
    resolver: zodResolver(tournamentSchema),
    defaultValues: {
      name: "",
      plannedMatchCount: 5,
      totalFeesInr: 0,
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const matches: CreateMatchDto[] = [];
      if (values.saturday.enabled) {
        matches.push({
          matchDate: weekend.saturday,
          classification: values.saturday.classification,
          tournamentId: values.saturday.tournamentId || null,
          opposition: values.saturday.opposition || null,
          groundMapsUrl: values.saturday.groundMapsUrl || null,
          startTime: values.saturday.startTime || null,
          matchFeesInr: values.saturday.matchFeesInr ?? null,
        });
      }
      if (values.sunday.enabled) {
        matches.push({
          matchDate: weekend.sunday,
          classification: values.sunday.classification,
          tournamentId: values.sunday.tournamentId || null,
          opposition: values.sunday.opposition || null,
          groundMapsUrl: values.sunday.groundMapsUrl || null,
          startTime: values.sunday.startTime || null,
          matchFeesInr: values.sunday.matchFeesInr ?? null,
        });
      }

      const created = await createMatches.mutateAsync({ matches });
      toast.success({
        title:
          created.length > 1
            ? "Weekend matches created"
            : "Match created — confirm to open polls",
      });
      router.push(`/matches/${created[0]?.id}`);
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  });

  const onCreateTournament = tournamentForm.handleSubmit(async (values) => {
    try {
      const tournament = await createTournament.mutateAsync(values);
      form.setValue(`${tournamentTarget}.tournamentId`, tournament.id);
      form.setValue(`${tournamentTarget}.classification`, "tournament");
      setSheetOpen(false);
      toast.success({ title: "Tournament created" });
      void tournamentsQuery.refetch();
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  });

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Create weekend match"
        description="Configure Saturday and Sunday separately — TBD fields allowed"
      />

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <DayMatchSection
          day="saturday"
          label="Saturday"
          dateIso={weekend.saturday}
          form={form}
          tournaments={tournamentsQuery.data?.items ?? []}
          onCreateTournament={() => {
            setTournamentTarget("saturday");
            setSheetOpen(true);
          }}
        />

        <DayMatchSection
          day="sunday"
          label="Sunday"
          dateIso={weekend.sunday}
          form={form}
          tournaments={tournamentsQuery.data?.items ?? []}
          onCreateTournament={() => {
            setTournamentTarget("sunday");
            setSheetOpen(true);
          }}
        />

        {form.formState.errors.saturday?.enabled ? (
          <BodySm className="text-destructive">
            {form.formState.errors.saturday.enabled.message}
          </BodySm>
        ) : null}

        <Button
          type="submit"
          className="touch-target h-12 w-full"
          disabled={createMatches.isPending}
        >
          {createMatches.isPending ? "Creating…" : "Create match(es)"}
        </Button>
      </form>

      <BottomSheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <BottomSheetContent>
          <BottomSheetHeader>
            <BottomSheetTitle>New tournament</BottomSheetTitle>
          </BottomSheetHeader>
          <form onSubmit={onCreateTournament} className="space-y-4 px-4 pb-6">
            <FormField label="Name" htmlFor="t-name">
              <Input
                id="t-name"
                className="h-12"
                {...tournamentForm.register("name")}
              />
            </FormField>
            <FormField label="No. of matches" htmlFor="t-count">
              <Input
                id="t-count"
                type="number"
                className="h-12"
                onChange={(e) =>
                  tournamentForm.setValue(
                    "plannedMatchCount",
                    Number(e.target.value),
                  )
                }
                defaultValue={5}
              />
            </FormField>
            <FormField label="Tournament fees (₹)" htmlFor="t-fees">
              <Input
                id="t-fees"
                type="number"
                className="h-12"
                onChange={(e) =>
                  tournamentForm.setValue(
                    "totalFeesInr",
                    Number(e.target.value),
                  )
                }
                defaultValue={0}
              />
            </FormField>
            <BodySm>
              Fees are split across matches, then equally among players who
              played each match.
            </BodySm>
            <Button
              type="submit"
              className="h-12 w-full"
              disabled={createTournament.isPending}
            >
              {createTournament.isPending ? "Saving…" : "Save tournament"}
            </Button>
          </form>
        </BottomSheetContent>
      </BottomSheet>
    </div>
  );
}

type TournamentOption = { id: string; name: string };

type DayMatchSectionProps = {
  day: DayKey;
  label: string;
  dateIso: string;
  form: ReturnType<typeof useForm<FormValues>>;
  tournaments: TournamentOption[];
  onCreateTournament: () => void;
};

function DayMatchSection({
  day,
  label,
  dateIso,
  form,
  tournaments,
  onCreateTournament,
}: DayMatchSectionProps) {
  const enabled = form.watch(`${day}.enabled`);
  const classification = form.watch(`${day}.classification`);
  const tournamentError = form.formState.errors[day]?.tournamentId?.message;

  return (
    <AppCard>
      <AppCardContent className="space-y-4 py-5">
        <label className="flex min-h-12 items-center gap-3">
          <input
            type="checkbox"
            className="size-5"
            checked={enabled}
            onChange={(e) => form.setValue(`${day}.enabled`, e.target.checked)}
          />
          <span>
            <Body className="font-semibold">{label}</Body>
            <BodySm>{formatDisplayDate(dateIso)}</BodySm>
          </span>
        </label>

        {enabled ? (
          <div className="space-y-4 border-t border-outline-variant/30 pt-4">
            <FormField label="Classification" htmlFor={`${day}-classification`}>
              <Select
                value={classification}
                onValueChange={(value) =>
                  form.setValue(
                    `${day}.classification`,
                    value as "warmup" | "tournament",
                  )
                }
              >
                <SelectTrigger
                  id={`${day}-classification`}
                  className="h-12 w-full"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warmup">Warmup</SelectItem>
                  <SelectItem value="tournament">Tournament</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {classification === "tournament" ? (
              <div className="space-y-3">
                <FormField
                  label="Tournament"
                  htmlFor={`${day}-tournament`}
                  error={tournamentError}
                >
                  <Select
                    value={form.watch(`${day}.tournamentId`) || undefined}
                    onValueChange={(value) =>
                      form.setValue(`${day}.tournamentId`, value)
                    }
                  >
                    <SelectTrigger
                      id={`${day}-tournament`}
                      className="h-12 w-full"
                    >
                      <SelectValue placeholder="Select tournament" />
                    </SelectTrigger>
                    <SelectContent>
                      {tournaments.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
                <Button
                  type="button"
                  variant="tonal"
                  className="h-12 w-full"
                  onClick={onCreateTournament}
                >
                  Create tournament
                </Button>
              </div>
            ) : null}

            <FormField
              label="Opposition (optional)"
              htmlFor={`${day}-opposition`}
            >
              <Input
                id={`${day}-opposition`}
                className="h-12"
                placeholder="TBD"
                {...form.register(`${day}.opposition`)}
              />
            </FormField>

            <FormField
              label="Ground Maps link (optional)"
              htmlFor={`${day}-maps`}
            >
              <Input
                id={`${day}-maps`}
                className="h-12"
                placeholder="https://maps.google.com/…"
                {...form.register(`${day}.groundMapsUrl`)}
              />
            </FormField>

            <FormField label="Start time" htmlFor={`${day}-time`}>
              <Select
                value={form.watch(`${day}.startTime`) || ""}
                onValueChange={(value) =>
                  form.setValue(
                    `${day}.startTime`,
                    value as (typeof MATCH_START_TIMES)[number],
                  )
                }
              >
                <SelectTrigger id={`${day}-time`} className="h-12 w-full">
                  <SelectValue placeholder="TBD" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:30:00">6:30 AM</SelectItem>
                  <SelectItem value="09:30:00">9:30 AM</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Match fees (₹, optional)" htmlFor={`${day}-fees`}>
              <Input
                id={`${day}-fees`}
                type="number"
                inputMode="decimal"
                className="h-12"
                placeholder="TBD"
                onChange={(e) => {
                  const value = e.target.value;
                  form.setValue(
                    `${day}.matchFeesInr`,
                    value === "" ? undefined : Number(value),
                  );
                }}
              />
            </FormField>
          </div>
        ) : null}
      </AppCardContent>
    </AppCard>
  );
}

export { CreateWeekendMatchForm };
