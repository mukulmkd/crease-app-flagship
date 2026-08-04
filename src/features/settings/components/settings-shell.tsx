"use client";

import dynamic from "next/dynamic";

import { Body, Overline, Title } from "@/components/common/typography";
import { ErrorState, LoadingState } from "@/components/feedback";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { PushAlertsSection } from "@/features/notifications/components/push-alerts-section";
import { AccountSettingsSection } from "@/features/settings/components/account-settings-section";
import { AppearanceSettingsSection } from "@/features/settings/components/appearance-settings-section";
import { useMvpTeam, useMyMembership } from "@/features/team/hooks";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";

const TeamSettingsSection = dynamic(() =>
  import("@/features/settings/components/team-settings-section").then(
    (module) => module.TeamSettingsSection,
  ),
);
const PaymentCollectorSection = dynamic(() =>
  import("@/features/team/components/payment-collector-section").then(
    (module) => module.PaymentCollectorSection,
  ),
);
const DemoModeSection = dynamic(() =>
  import("@/features/team/components/demo-mode-section").then(
    (module) => module.DemoModeSection,
  ),
);

function SettingsShell() {
  const { user } = useAuth();
  const membershipQuery = useMyMembership();
  const teamQuery = useMvpTeam();
  const canEditTeam = hasPermission(
    membershipQuery.data?.role,
    PERMISSIONS.TEAM_SETTINGS_EDIT,
  );

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
  const phone = user?.phone
    ? formatPhoneDisplay(
        user.phone.startsWith("+") ? user.phone : `+${user.phone}`,
      )
    : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8">
      <div className="space-y-1">
        <Title>Settings</Title>
        <Body className="text-muted-foreground">
          Your app preferences and account.
        </Body>
      </div>

      <AppearanceSettingsSection />
      <PushAlertsSection />
      <AccountSettingsSection phone={phone} />

      {canEditTeam ? (
        <div className="space-y-3 border-t border-outline-variant pt-6">
          <Overline className="text-muted-foreground">Admin tools</Overline>
          <TeamSettingsSection team={team} />
          <PaymentCollectorSection team={team} />
          <DemoModeSection demoMode={team.demoMode} canEdit />
        </div>
      ) : null}
    </div>
  );
}

export { SettingsShell };
