"use client";

import { Shield, ShieldOff, UserMinus } from "lucide-react";

import { UserAvatar } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { Button } from "@/components/ui/button";
import type { TeamMembershipWithProfile } from "@/types/models";

type MemberActionsSheetProps = {
  member: TeamMembershipWithProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pending: boolean;
  isSelf: boolean;
  activeAdminCount: number;
  onPromote: () => Promise<void>;
  onDemote: () => Promise<void>;
  onSuspend: () => Promise<void>;
};

function MemberActionsSheet({
  member,
  open,
  onOpenChange,
  pending,
  isSelf,
  activeAdminCount,
  onPromote,
  onDemote,
  onSuspend,
}: MemberActionsSheetProps) {
  const name = member?.profile.fullName ?? "Player";
  const isAdmin = member?.role === "admin";
  const isLastAdmin = isAdmin && activeAdminCount <= 1;

  return (
    <BottomSheet open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Manage player
          </BottomSheetTitle>
          <BottomSheetDescription className="sr-only">
            Choose an action for {name}
          </BottomSheetDescription>
        </BottomSheetHeader>

        {member ? (
          <div className="space-y-4 px-4 pb-6">
            <div className="flex items-center gap-3 rounded-lg bg-surface-container px-3 py-3">
              <UserAvatar
                name={name}
                imageUrl={member.profile.avatarUrl}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {member.profile.phone ?? "Phone unavailable"}
                </p>
              </div>
              <span className="text-xs font-semibold tracking-[0.08em] text-primary uppercase">
                {member.role}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {!isAdmin ? (
                <Button
                  type="button"
                  variant="tonal"
                  className="h-12 justify-start gap-3"
                  loading={pending}
                  onClick={() => void onPromote()}
                >
                  <Shield className="size-5" aria-hidden />
                  Promote as Admin
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="tonal"
                  className="h-12 justify-start gap-3"
                  loading={pending}
                  disabled={isLastAdmin}
                  onClick={() => void onDemote()}
                >
                  <ShieldOff className="size-5" aria-hidden />
                  Demote to Player
                </Button>
              )}

              <Button
                type="button"
                variant="destructive"
                className="h-12 justify-start gap-3"
                loading={pending}
                disabled={isSelf || isLastAdmin}
                onClick={() => void onSuspend()}
              >
                <UserMinus className="size-5" aria-hidden />
                Suspend
              </Button>

              {isLastAdmin ? (
                <p className="text-sm text-muted-foreground">
                  Promote another admin before demoting or suspending the last
                  Admin.
                </p>
              ) : null}
              {isSelf && !isLastAdmin ? (
                <p className="text-sm text-muted-foreground">
                  You can’t suspend your own membership.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { MemberActionsSheet };
