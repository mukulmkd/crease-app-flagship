"use client";

import { Bell, Users, Volume2 } from "lucide-react";

import { BodySm } from "@/components/common/typography";
import { SegmentedControl } from "@/components/forms/segmented-control";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useSendDemoNotification } from "@/features/notifications/hooks";
import { useUpdateTeamSettings } from "@/features/team/hooks";
import type { DemoNotificationScope } from "@/services/notification.actions";
import { playCreaseNotificationSound, unlockNotificationAudio } from "@/utils";

type DemoModeSectionProps = {
  demoMode: boolean;
  /** Admin can toggle + team broadcast; everyone can self-test while demo is on. */
  canEdit: boolean;
};

/**
 * Demo mode toggle (Admin) + alert/sound self-tests for QA.
 */
function DemoModeSection({ demoMode, canEdit }: DemoModeSectionProps) {
  const updateSettings = useUpdateTeamSettings();
  const sendDemo = useSendDemoNotification();

  async function playSound() {
    await unlockNotificationAudio();
    await playCreaseNotificationSound({ force: true });
    toast.success({ title: "Alert sound played" });
  }

  async function sendAlert(scope: DemoNotificationScope) {
    try {
      await unlockNotificationAudio();
      const result = await sendDemo.mutateAsync(scope);
      toast.success({
        title:
          scope === "team"
            ? `Demo alert sent to ${result.recipientCount} members`
            : "Demo notification sent",
        description:
          scope === "team"
            ? "Open app → toast + chime. Closed → lock-screen push (unless they turned it off)."
            : "Watch for the toast, bell badge, and chime.",
      });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  }

  if (!canEdit && !demoMode) return null;

  return (
    <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
      <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
        Demo mode
      </p>
      {canEdit ? (
        <>
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
            value={demoMode ? "on" : "off"}
            loading={updateSettings.isPending}
            onValueChange={async (value) => {
              const next = value === "on";
              if (next === demoMode) return;
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
        </>
      ) : (
        <BodySm>
          Team is in demo mode — playing squad target is 4. Use the tests below
          to verify alerts.
        </BodySm>
      )}

      {demoMode ? (
        <div className="space-y-2 border-t border-outline-variant/40 pt-4">
          <BodySm className="text-muted-foreground">
            Self-test the chime, or send a real inbox alert. Admins can fan out
            to everyone (push reaches players who have not turned push off).
          </BodySm>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full justify-start gap-2"
              onClick={() => void playSound()}
            >
              <Volume2 aria-hidden className="size-4" />
              Play alert sound
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-full justify-start gap-2"
              loading={sendDemo.isPending && sendDemo.variables === "self"}
              onClick={() => void sendAlert("self")}
            >
              <Bell aria-hidden className="size-4" />
              Send to me
            </Button>
          </div>
          {canEdit ? (
            <Button
              type="button"
              className="h-12 w-full justify-start gap-2"
              loading={sendDemo.isPending && sendDemo.variables === "team"}
              onClick={() => void sendAlert("team")}
            >
              <Users aria-hidden className="size-4" />
              Notify all players
            </Button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export { DemoModeSection };
