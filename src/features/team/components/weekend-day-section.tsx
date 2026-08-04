"use client";

import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { FormField, SegmentedControl } from "@/components/forms";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatMatchDate } from "@/features/team/lib/match-format";
import type {
  WeekendDayKey,
  WeekendMatchFormValues,
} from "@/features/team/lib/weekend-match-form";

type TournamentOption = {
  id: string;
  name: string;
  plannedMatchCount: number;
  totalFeesInr: number;
};

type WeekendDaySectionProps = {
  day: WeekendDayKey;
  dateIso: string;
  unavailable?: boolean;
  form: UseFormReturn<WeekendMatchFormValues>;
  tournaments: TournamentOption[];
  onCreateTournament: () => void;
};

function WeekendDaySection({
  day,
  dateIso,
  unavailable = false,
  form,
  tournaments,
  onCreateTournament,
}: WeekendDaySectionProps) {
  const enabled = useWatch({ control: form.control, name: `${day}.enabled` });
  const classification = useWatch({
    control: form.control,
    name: `${day}.classification`,
  });
  const tournamentError = form.formState.errors[day]?.tournamentId?.message;

  return (
    <section className="overflow-hidden rounded-2xl bg-surface-container-low">
      <Controller
        control={form.control}
        name={`${day}.enabled`}
        render={({ field }) => (
          <label
            className={
              unavailable
                ? "flex min-h-16 cursor-not-allowed items-center gap-3 px-4 opacity-60"
                : "flex min-h-16 cursor-pointer items-center gap-3 px-4"
            }
          >
            <Checkbox
              checked={unavailable ? false : field.value}
              disabled={unavailable}
              onCheckedChange={field.onChange}
            />
            <span className="min-w-0">
              <span className="block font-heading text-2xl font-semibold">
                {day}
              </span>
              <span className="block text-sm text-muted-foreground">
                {formatMatchDate(dateIso)}
              </span>
              {unavailable ? (
                <span className="block text-xs font-semibold text-destructive">
                  Match already created
                </span>
              ) : null}
            </span>
          </label>
        )}
      />

      {enabled && !unavailable ? (
        <div className="space-y-5 border-t border-outline-variant px-4 py-5">
          <Controller
            control={form.control}
            name={`${day}.classification`}
            render={({ field }) => (
              <FormField label="Classification">
                <SegmentedControl
                  aria-label={`${day} match classification`}
                  value={field.value}
                  onValueChange={field.onChange}
                  options={[
                    { value: "warmup", label: "Warmup" },
                    { value: "tournament", label: "Tournament" },
                  ]}
                />
              </FormField>
            )}
          />

          {classification === "tournament" ? (
            <div className="space-y-2">
              <Controller
                control={form.control}
                name={`${day}.tournamentId`}
                render={({ field }) => (
                  <FormField label="Tournament" error={tournamentError}>
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger className="h-12 w-full">
                        <SelectValue placeholder="Select tournament" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournaments.map((tournament) => (
                          <SelectItem key={tournament.id} value={tournament.id}>
                            {tournament.name}
                            {tournament.plannedMatchCount > 0
                              ? ` · ₹${Math.round((tournament.totalFeesInr / tournament.plannedMatchCount) * 100) / 100}/match`
                              : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormField>
                )}
              />
              <Button
                type="button"
                variant="link"
                className="h-10 px-0"
                onClick={onCreateTournament}
              >
                Create tournament
              </Button>
              <p className="text-sm leading-5 text-muted-foreground">
                Tournament entry fees are prepaid (total ÷ planned matches,
                split by squad). Set match fees separately below for ground /
                day costs — those are collected and paid to organizers.
              </p>
            </div>
          ) : null}

          <FormField label="Opposition (optional)">
            <Input placeholder="TBD" {...form.register(`${day}.opposition`)} />
          </FormField>

          <FormField label="Ground Maps URL (optional)">
            <Input
              inputMode="url"
              placeholder="https://maps.app.goo.gl/…"
              {...form.register(`${day}.groundMapsUrl`)}
            />
          </FormField>

          <Controller
            control={form.control}
            name={`${day}.startTime`}
            render={({ field }) => (
              <FormField label="Start time">
                <SegmentedControl
                  aria-label={`${day} start time`}
                  value={field.value ?? "06:30:00"}
                  onValueChange={field.onChange}
                  options={[
                    { value: "06:30:00", label: "6:30 AM" },
                    { value: "09:30:00", label: "9:30 AM" },
                  ]}
                />
              </FormField>
            )}
          />

          <Controller
            control={form.control}
            name={`${day}.matchFeesInr`}
            render={({ field }) => (
              <FormField
                label={
                  classification === "tournament"
                    ? "Match fees (₹, ground / day — optional)"
                    : "Match fees (₹, optional)"
                }
              >
                <Input
                  type="number"
                  inputMode="decimal"
                  placeholder="TBD"
                  value={field.value ?? ""}
                  onChange={(event) =>
                    field.onChange(
                      event.target.value === ""
                        ? undefined
                        : Number(event.target.value),
                    )
                  }
                />
              </FormField>
            )}
          />

          <Controller
            control={form.control}
            name={`${day}.pollsEnabled`}
            render={({ field }) => (
              <label className="flex min-h-12 cursor-pointer items-start gap-3 rounded-xl bg-surface-container px-3 py-3">
                <Checkbox
                  className="mt-0.5"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">
                    Enable polls
                  </span>
                  <span className="mt-0.5 block text-[0.7rem] leading-4 text-muted-foreground">
                    Current weekend: opens immediately. Future weekend: opens
                    Monday at 9 AM IST when the fixture publishes.
                  </span>
                </span>
              </label>
            )}
          />
        </div>
      ) : null}
    </section>
  );
}

export { WeekendDaySection };
