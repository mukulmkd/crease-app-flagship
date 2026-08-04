"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Overline } from "@/components/common/typography";
import { FormField } from "@/components/forms/form-field";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { TeamLogoControl } from "@/features/team/components/team-logo-control";
import { useUpdateTeamSettings } from "@/features/team/hooks";
import type { Team } from "@/types/models";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  whatsappNotifyUrl: z.string().trim().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

function TeamSettingsSection({ team }: { team: Team }) {
  const updateSettings = useUpdateTeamSettings();
  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: team.name,
      whatsappNotifyUrl: team.whatsappNotifyUrl ?? "",
    },
  });

  useEffect(() => {
    form.reset({
      name: team.name,
      whatsappNotifyUrl: team.whatsappNotifyUrl ?? "",
    });
  }, [team.name, team.whatsappNotifyUrl, form]);

  return (
    <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
      <Overline className="text-muted-foreground">Team configuration</Overline>
      <form
        className="space-y-4"
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await updateSettings.mutateAsync({
              name: values.name,
              whatsappNotifyUrl: values.whatsappNotifyUrl || null,
            });
            toast.success({ title: "Team settings saved" });
          } catch (error) {
            toast.error({ title: getMutationErrorMessage(error) });
          }
        })}
      >
        <FormField
          label="Display name"
          error={form.formState.errors.name?.message}
        >
          <Input {...form.register("name")} />
        </FormField>
        <FormField
          label="Team logo"
          description="Shown in the top bar and sidebar for every member"
        >
          <TeamLogoControl teamName={team.name} logoUrl={team.logoUrl} />
        </FormField>
        <FormField
          label="WhatsApp notify URL"
          description="Webhook for group announcements"
          error={form.formState.errors.whatsappNotifyUrl?.message}
        >
          <Input
            {...form.register("whatsappNotifyUrl")}
            inputMode="url"
            placeholder="https://…"
          />
        </FormField>
        <Button
          type="submit"
          className="w-full"
          loading={updateSettings.isPending}
        >
          Save team settings
        </Button>
      </form>
    </section>
  );
}

export { TeamSettingsSection };
