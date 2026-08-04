"use client";

import { LogOut } from "lucide-react";

import { Overline } from "@/components/common/typography";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  getMutationErrorMessage,
  useSignOut,
} from "@/features/auth/hooks/use-auth-mutations";

function AccountSettingsSection({ phone }: { phone: string | null }) {
  const signOut = useSignOut();

  return (
    <section className="rounded-xl bg-surface-container-low p-4">
      <Overline className="text-muted-foreground">Account</Overline>
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
  );
}

export { AccountSettingsSection };
