"use client";

import Link from "next/link";
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
  useTournaments,
} from "@/features/team/hooks";
import { formatMatchDate } from "@/features/team/lib/match-format";
import {
  emptyDayDefaults,
  listUpcomingWeekends,
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
): string {
  const range = `${formatMatchDate(saturday)} – ${formatMatchDate(sunday)}`;
  if (offset === 0) return `This weekend · ${range}`;
  if (offset === 1) return `Next weekend · ${range}`;
  return `In ${offset} weeks · ${range}`;
}

/** Admin creates independently configured Saturday and Sunday fixtures. */
function CreateWeekendMatchForm() {
  const router = useRouter();
  const weekends = useMemo(() => listUpcomingWeekends(8), []);
  const tournaments = useTournaments();
  const matches = useMatches();
  const createMatches = useCreateWeekendMatches();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tournamentTarget, setTournamentTarget] =
    useState<WeekendDayKey>("saturday");

  const form = useForm<WeekendMatchFormValues>({
    resolver: zodResolver(weekendMatchFormSchema),
    defaultValues: {
      weekendOffset: 0,
      saturday: { ...emptyDayDefaults, enabled: true, pollsEnabled: true },
      sunday: { ...emptyDayDefaults, pollsEnabled: true },
    },
  });

  const weekendOffset = useWatch({
    control: form.control,
    name: "weekendOffset",
  });
  const weekend = weekends[weekendOffset] ?? weekends[0]!;
  const isThisWeekend = weekendOffset === 0;
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

  // Future weekends default polls off; this weekend defaults on.
  useEffect(() => {
    form.setValue("saturday.pollsEnabled", isThisWeekend);
    form.setValue("sunday.pollsEnabled", isThisWeekend);
  }, [form, isThisWeekend]);

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
      toast.success({
        title:
          created.length > 1
            ? "Weekend matches created"
            : anyPolls
              ? "Match created — confirm to open polls"
              : "Match created — polls stay off until you enable them",
      });
      router.push(`/matches/${created[0]?.id}`);
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
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/matches" aria-label="Back to matches">
            <ArrowLeft aria-hidden />
            Matches
          </Link>
        </Button>
      </div>

      <header>
        <h1 className="font-heading text-3xl font-extrabold uppercase">
          Weekend matches
        </h1>
        <BodySm className="mt-1">
          Pick any upcoming weekend. Configure Saturday and Sunday separately.
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
                  {weekendLabel(offset, dates.saturday, dates.sunday)}
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
