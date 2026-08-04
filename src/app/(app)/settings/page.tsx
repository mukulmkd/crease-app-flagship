"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { z } from "zod";

import { Body, BodySm, Title } from "@/components/common/typography";
import { FormField } from "@/components/forms/form-field";
import { SegmentedControl } from "@/components/forms/segmented-control";
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
import { PaymentCollectorSection } from "@/features/team/components/payment-collector-section";
import { TeamLogoControl } from "@/features/team/components/team-logo-control";
import { PushAlertsSection } from "@/features/notifications/components/push-alerts-section";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";
import { resolveTeamLogoUrl } from "@/utils";

const settingsSchema = z.object({
  name: z.string().trim().min(2).max(80),
  whatsappNotifyUrl: z.string().trim().optional(),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const emptySubscribe = () => () => undefined;

type ThemeChoice = "system" | "light" | "dark";

/**
 * Settings — appearance, team config (Admin), demo mode, account sign-out.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const signOut = useSignOut();
  const membershipQuery = useMyMembership();
  const teamQuery = useMvpTeam();
  const updateSettings = useUpdateTeamSettings();
  const { theme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );

  const canEdit = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.TEAM_SETTINGS_EDIT,
  );

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      whatsappNotifyUrl: "",
    },
  });

  useEffect(() => {
    if (!teamQuery.data) return;
    form.reset({
      name: teamQuery.data.name,
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
  const themeValue = (mounted ? (theme ?? "system") : "system") as ThemeChoice;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8">
      <div className="space-y-1">
        <Title>Settings</Title>
        <Body className="text-muted-foreground">
          Appearance, team settings, and account.
        </Body>
      </div>

      <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
        <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
          Appearance
        </p>
        <FormField
          label="Theme"
          description="System follows your device light/dark setting"
        >
          <SegmentedControl
            aria-label="Theme"
            size="sm"
            options={[
              { value: "system", label: "System" },
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
            ]}
            value={themeValue}
            onValueChange={(value) => setTheme(value)}
          />
        </FormField>
        <div className="flex items-center gap-2 text-muted-foreground">
          {themeValue === "system" ? (
            <Monitor className="size-4" aria-hidden />
          ) : themeValue === "dark" ? (
            <Moon className="size-4" aria-hidden />
          ) : (
            <Sun className="size-4" aria-hidden />
          )}
          <BodySm>
            {themeValue === "system"
              ? "Matches OS preference"
              : themeValue === "dark"
                ? "Clubhouse dark"
                : "Scorebook light"}
          </BodySm>
        </div>
      </section>

      <PushAlertsSection />

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
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3">
              {resolveTeamLogoUrl(team.logoUrl) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={resolveTeamLogoUrl(team.logoUrl)!}
                  alt=""
                  className="size-12 rounded-lg object-cover"
                />
              ) : null}
              <p className="font-medium">{team.name}</p>
            </div>
            <BodySm>
              Collector UPI:{" "}
              {team.upiVpa?.trim() ? team.upiVpa : "Not set by Admin"}
            </BodySm>
          </div>
        )}
      </section>

      {canEdit ? <PaymentCollectorSection team={team} /> : null}

      {canEdit ? (
        <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Demo mode
          </p>
          <BodySm>
            For a 4-player QA squad: playing strength 4, past weekend fixtures,
            and dummy payment proofs. Turn off before real match weekends.
          </BodySm>
          <SegmentedControl
            aria-label="Demo mode"
            options={[
              { value: "off", label: "Off" },
              { value: "on", label: "On" },
            ]}
            value={team.demoMode ? "on" : "off"}
            loading={updateSettings.isPending}
            onValueChange={async (value) => {
              const next = value === "on";
              if (next === team.demoMode) return;
              try {
                await updateSettings.mutateAsync({ demoMode: next });
                toast.success({
                  title: next ? "Demo mode on" : "Demo mode off",
                  description: next
                    ? "Squad target is 4 · past weekends unlocked"
                    : "Production XI/XII rules restored",
                });
              } catch (error) {
                toast.error({ title: getMutationErrorMessage(error) });
              }
            }}
          />
        </section>
      ) : team.demoMode ? (
        <section className="rounded-xl bg-surface-container-low p-4">
          <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
            Demo mode
          </p>
          <BodySm className="mt-2">
            Team is in demo mode — playing squad target is 4.
          </BodySm>
        </section>
      ) : null}

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
