"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { LogOut } from "lucide-react";

import { Body, BodySm, Title } from "@/components/common/typography";
import { FormField } from "@/components/forms/form-field";
import { ErrorState, LoadingState } from "@/components/feedback";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import {
  getMutationErrorMessage,
  useSignOut,
} from "@/features/auth/hooks/use-auth-mutations";
import {
  useMvpTeam,
  useMyMembership,
  useUpdateTeamSettings,
} from "@/features/team/hooks";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  logoUrl: z.string().trim().optional(),
  upiVpa: z.string().trim().max(120).optional(),
  whatsappNotifyUrl: z.string().trim().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

/**
 * Settings — team config (Admin) + account sign-out.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const membershipQuery = useMyMembership();
  const teamQuery = useMvpTeam();
  const updateSettings = useUpdateTeamSettings();

  const canEdit = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.TEAM_SETTINGS_EDIT,
  );

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      logoUrl: "",
      upiVpa: "",
      whatsappNotifyUrl: "",
    },
  });

  useEffect(() => {
    if (!teamQuery.data) return;
    form.reset({
      name: teamQuery.data.name,
      logoUrl: teamQuery.data.logoUrl ?? "",
      upiVpa: teamQuery.data.upiVpa ?? "",
      whatsappNotifyUrl: teamQuery.data.whatsappNotifyUrl ?? "",
    });
  }, [teamQuery.data, form]);

  const phone = user?.phone
    ? formatPhoneDisplay(
        user.phone.startsWith("+") ? user.phone : `+${user.phone}`,
      )
    : null;

  if (membershipQuery.isLoading || teamQuery.isLoading) {
    return <LoadingState label="Loading settings" />;
  }

  if (membershipQuery.isError || teamQuery.isError || !teamQuery.data) {
    return (
      <ErrorState
        title="Could not load settings"
        onRetry={() => {
          void membershipQuery.refetch();
          void teamQuery.refetch();
        }}
      />
    );
  }

  const team = teamQuery.data;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8">
      <div className="space-y-1">
        <Title>Settings</Title>
        <Body className="text-muted-foreground">
          Ranches Thunders team and account.
        </Body>
      </div>

      <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
        <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
          Team
        </p>
        {canEdit ? (
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              try {
                await updateSettings.mutateAsync({
                  name: values.name,
                  logoUrl: values.logoUrl || null,
                  upiVpa: values.upiVpa || null,
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
              label="Logo URL"
              error={form.formState.errors.logoUrl?.message}
            >
              <Input {...form.register("logoUrl")} placeholder="https://…" />
            </FormField>
            <FormField
              label="UPI VPA"
              description="Players pay weekend fees here"
              error={form.formState.errors.upiVpa?.message}
            >
              <Input {...form.register("upiVpa")} placeholder="team@upi" />
            </FormField>
            <FormField
              label="WhatsApp notify URL"
              description="Webhook for group announcements"
              error={form.formState.errors.whatsappNotifyUrl?.message}
            >
              <Input
                {...form.register("whatsappNotifyUrl")}
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
        ) : (
          <div className="space-y-2 text-sm">
            <p className="font-medium">{team.name}</p>
            <BodySm>
              UPI: {team.upiVpa?.trim() ? team.upiVpa : "Not set by Admin"}
            </BodySm>
          </div>
        )}
      </section>

      <section className="rounded-xl bg-surface-container-low p-4">
        <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
          Account
        </p>
        {phone ? (
          <p className="mt-2 text-sm font-medium text-foreground">{phone}</p>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="mt-4 h-12 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
          loading={signOut.isPending}
          aria-label="Sign out"
          onClick={() => {
            signOut.mutate(undefined, {
              onError: (error) => {
                toast.error({
                  title: "Could not sign out",
                  description: getMutationErrorMessage(error),
                });
              },
            });
          }}
        >
          <LogOut className="size-4" aria-hidden />
          Sign out
        </Button>
      </section>
    </div>
  );
}
