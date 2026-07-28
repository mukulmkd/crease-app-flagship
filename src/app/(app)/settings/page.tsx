"use client";

import { LogOut } from "lucide-react";

import { Body, Title } from "@/components/common/typography";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  getMutationErrorMessage,
  useSignOut,
} from "@/features/auth/hooks/use-auth-mutations";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";

/**
 * Settings — account actions (sign out). Expand with prefs later.
 */
export default function SettingsPage() {
  const { user } = useAuth();
  const signOut = useSignOut();

  const phone = user?.phone
    ? formatPhoneDisplay(
        user.phone.startsWith("+") ? user.phone : `+${user.phone}`,
      )
    : null;

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 p-4 pb-24 md:p-6">
      <div className="space-y-1">
        <Title>Settings</Title>
        <Body className="text-muted-foreground">
          Manage your Crease account.
        </Body>
      </div>

      <section className="rounded-lg border border-outline-variant/40 bg-surface-container-low p-4">
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
          disabled={signOut.isPending}
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
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </Button>
      </section>
    </div>
  );
}
