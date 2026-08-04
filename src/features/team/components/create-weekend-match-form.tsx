"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";

import { BodySm } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { FormField } from "@/components/forms";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { CreateTournamentSheet } from "@/features/team/components/create-tournament-sheet";
import { WeekendDaySection } from "@/features/team/components/weekend-day-section";
import {
  useCreateWeekendMatches,
  useMatches,
  useMvpTeam,
  useTournaments,
} from "@/features/team/hooks";
import { formatMatchDate } from "@/features/team/lib/match-format";
import {
  emptyDayDefaults,
  listWeekendsForCreate,
  weekendMatchFormSchema,
  type WeekendDayKey,
  type WeekendMatchFormValues,
} from "@/features/team/lib/weekend-match-form";
import type { CreateMatchDto } from "@/types/dto";

function toCreateMatch(
  values: WeekendMatchFormValues,
  day: WeekendDayKey,
  matchDate: string,
): CreateMatchDto {
  const match = values[day];
  return {
    matchDate,
    classification: match.classification,
    tournamentId: match.tournamentId || null,
    opposition: match.opposition || null,
    groundMapsUrl: match.groundMapsUrl || null,
    startTime: match.startTime || null,
    matchFeesInr: match.matchFeesInr ?? null,
    pollsEnabled: match.pollsEnabled,
  };
}

function weekendLabel(
  offset: number,
  saturday: string,
  sunday: string,
  thisWeekendSaturday: string,
): string {
  const range = `${formatMatchDate(saturday)} – ${formatMatchDate(sunday)}`;
  if (saturday === thisWeekendSaturday) return `This weekend · ${range}`;
  if (sunday < thisWeekendSaturday || saturday < thisWeekendSaturday) {
    return `Past weekend · ${range}`;
  }
  const weeksAhead = Math.round(
    (new Date(saturday).getTime() - new Date(thisWeekendSaturday).getTime()) /
      (7 * 24 * 60 * 60 * 1000),
  );
  if (weeksAhead === 1) return `Next weekend · ${range}`;
  return `In ${weeksAhead} weeks · ${range}`;
}

/** Admin creates independently configured Saturday and Sunday fixtures. */
function CreateWeekendMatchForm() {
  const router = useRouter();
  const teamQuery = useMvpTeam();
  const demoMode = Boolean(teamQuery.data?.demoMode);
  const weekends = useMemo(
    () =>
      listWeekendsForCreate({
        upcomingCount: 8,
        pastCount: demoMode ? 4 : 0,
      }),
    [demoMode],
  );
  const thisWeekendSaturday = useMemo(
    () => listWeekendsForCreate({ upcomingCount: 1 })[0]!.saturday,
    [],
  );
  const tournaments = useTournaments();
  const matches = useMatches();
  const createMatches = useCreateWeekendMatches();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tournamentTarget, setTournamentTarget] =
    useState<WeekendDayKey>("saturday");

  const defaultOffset = useMemo(() => {
    const idx = weekends.findIndex((w) => w.saturday === thisWeekendSaturday);
    return idx >= 0 ? idx : 0;
  }, [weekends, thisWeekendSaturday]);

  const form = useForm<WeekendMatchFormValues>({
    resolver: zodResolver(weekendMatchFormSchema),
    defaultValues: {
      weekendOffset: defaultOffset,
      saturday: { ...emptyDayDefaults, enabled: true, pollsEnabled: true },
      sunday: { ...emptyDayDefaults, pollsEnabled: true },
    },
  });

  useEffect(() => {
    form.setValue("weekendOffset", defaultOffset);
  }, [defaultOffset, form]);

  const weekendOffset = useWatch({
    control: form.control,
    name: "weekendOffset",
  });
  const weekend = weekends[weekendOffset] ?? weekends[0]!;
  const existingDates = useMemo(
    () =>
      new Set(
        (matches.data?.items ?? []).map((match) => String(match.matchDate)),
      ),
    [matches.data?.items],
  );
  const saturdayUnavailable = existingDates.has(weekend.saturday);
  const sundayUnavailable = existingDates.has(weekend.sunday);
  const allDaysUnavailable = saturdayUnavailable && sundayUnavailable;

  // Safe for every weekend: future fixture polls stay draft until Monday 09:00.
  useEffect(() => {
    form.setValue("saturday.pollsEnabled", true);
    form.setValue("sunday.pollsEnabled", true);
  }, [form, weekendOffset]);

  // A day with an existing fixture cannot be selected. If exactly one day is
  // free, select it automatically so Admin can create the missing fixture.
  useEffect(() => {
    if (saturdayUnavailable) {
      form.setValue("saturday.enabled", false);
    }
    if (sundayUnavailable) {
      form.setValue("sunday.enabled", false);
    }
    if (saturdayUnavailable && !sundayUnavailable) {
      form.setValue("sunday.enabled", true);
    } else if (sundayUnavailable && !saturdayUnavailable) {
      form.setValue("saturday.enabled", true);
    }
  }, [form, saturdayUnavailable, sundayUnavailable]);

  const onSubmit = form.handleSubmit(async (values) => {
    const selected = weekends[values.weekendOffset] ?? weekends[0]!;
    const matches: CreateMatchDto[] = [];
    if (values.saturday.enabled) {
      matches.push(toCreateMatch(values, "saturday", selected.saturday));
    }
    if (values.sunday.enabled) {
      matches.push(toCreateMatch(values, "sunday", selected.sunday));
    }

    try {
      const created = await createMatches.mutateAsync({ matches });
      const anyPolls = matches.some((match) => match.pollsEnabled);
      const publishesMonday = created.every(
        (match) =>
          match.status === "pending_confirm" || match.status === "draft",
      );
      toast.success({
        title: publishesMonday
          ? `${created.length > 1 ? "Weekend matches" : "Match"} scheduled`
          : created.length > 1
            ? "Weekend matches created"
            : "Match created",
        description: publishesMonday
          ? anyPolls
            ? "Publishes Monday at 9 AM IST, then polls open and the squad is notified."
            : "Publishes Monday at 9 AM IST. Polls will remain off."
          : anyPolls
            ? "Polls are live and the squad was notified."
            : "Polls stay off until you enable them.",
      });
      router.push("/matches");
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  });

  function openTournamentSheet(day: WeekendDayKey) {
    setTournamentTarget(day);
    setSheetOpen(true);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="-ml-2"
          aria-label="Go back"
          onClick={() => {
            // Deep links (share / notification) have no in-app history to pop.
            if (window.history.length > 1) {
              router.back();
              return;
            }
            router.push("/matches");
          }}
        >
          <ArrowLeft aria-hidden />
        </Button>
      </div>

      <header>
        <h1 className="font-heading text-3xl font-extrabold uppercase">
          Weekend matches
        </h1>
        <BodySm className="mt-1">
          {demoMode
            ? "Demo mode: pick a past or upcoming weekend. Configure Saturday and Sunday separately."
            : "Pick any upcoming weekend. Configure Saturday and Sunday separately."}
        </BodySm>
      </header>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <FormField label="Weekend">
          <Select
            value={String(weekendOffset)}
            onValueChange={(value) =>
              form.setValue("weekendOffset", Number(value), {
                shouldValidate: true,
              })
            }
          >
            <SelectTrigger className="h-12 w-full">
              <SelectValue placeholder="Select weekend" />
            </SelectTrigger>
            <SelectContent>
              {weekends.map((dates, offset) => (
                <SelectItem key={dates.saturday} value={String(offset)}>
                  {weekendLabel(
                    offset,
                    dates.saturday,
                    dates.sunday,
                    thisWeekendSaturday,
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <WeekendDaySection
          day="saturday"
          dateIso={weekend.saturday}
          unavailable={saturdayUnavailable}
          form={form}
          tournaments={tournaments.data?.items ?? []}
          onCreateTournament={() => openTournamentSheet("saturday")}
        />
        <WeekendDaySection
          day="sunday"
          dateIso={weekend.sunday}
          unavailable={sundayUnavailable}
          form={form}
          tournaments={tournaments.data?.items ?? []}
          onCreateTournament={() => openTournamentSheet("sunday")}
        />

        {form.formState.errors.saturday?.enabled ? (
          <p className="text-sm text-destructive" role="alert">
            {form.formState.errors.saturday.enabled.message}
          </p>
        ) : null}

        {allDaysUnavailable ? (
          <BodySm className="rounded-xl bg-surface-container-low p-4">
            Both days already have matches. Open the existing fixtures to edit
            them, or choose another weekend.
          </BodySm>
        ) : null}

        <div className="sticky bottom-[calc(var(--bottom-nav-height)+0.5rem)] z-10 bg-background/95 py-2 md:static md:bg-transparent">
          <Button
            type="submit"
            className="h-14 w-full"
            loading={createMatches.isPending}
            disabled={matches.isLoading || allDaysUnavailable}
          >
            Create match(es)
          </Button>
        </div>
      </form>

      <CreateTournamentSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onCreated={(tournamentId) => {
          form.setValue(`${tournamentTarget}.tournamentId`, tournamentId);
          form.setValue(`${tournamentTarget}.classification`, "tournament");
          void tournaments.refetch();
        }}
      />
    </div>
  );
}

export { CreateWeekendMatchForm };
