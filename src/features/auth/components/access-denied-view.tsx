"use client";

import { ShieldX } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AUTH_ROUTES } from "@/constants/auth";
import { AuthShell } from "@/features/auth/components/auth-shell";
import {
  getMutationErrorMessage,
  useSignOut,
} from "@/features/auth/hooks/use-auth-mutations";

/**
 * Invite-only gate — signed in but not an active Ranches Thunders member.
 */
function AccessDeniedView() {
  const signOut = useSignOut();

  return (
    <AuthShell showBack backHref={AUTH_ROUTES.login} title="Access denied">
      <div className="flex flex-1 flex-col gap-6 pt-8">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <ShieldX className="size-8" aria-hidden />
        </div>
        <div className="space-y-2">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Invite only
          </h1>
          <p className="text-base leading-6 text-muted-foreground">
            Crease is for Ranches Thunders members only. Ask your team admin to
            add your mobile number, then try again.
          </p>
        </div>

        {signOut.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {getMutationErrorMessage(signOut.error)}
          </p>
        ) : null}

        <Button
          type="button"
          className="mt-auto h-14 w-full"
          loading={signOut.isPending}
          onClick={() => signOut.mutate()}
        >
          Back to login
        </Button>
      </div>
    </AuthShell>
  );
}

export { AccessDeniedView };
