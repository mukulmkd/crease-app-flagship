"use client";

import { useState } from "react";
import {
  Ban,
  Car,
  CheckCircle2,
  Pencil,
  Snowflake,
  Unlock,
  Vote,
} from "lucide-react";

import { BodySm, StatusChip } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { ManageMatchAction } from "@/features/team/components/manage-match-action";
import {
  useCancelMatch,
  useCompleteMatch,
  useEnableMatchPolls,
  useFreezePolls,
  useUnfreezePolls,
} from "@/features/team/hooks";
import type { Match } from "@/types/models";

type ManageMatchSheetProps = {
  match: Match;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManageMatch: boolean;
  canFreeze: boolean;
  showEdit: boolean;
  manageLive: boolean;
  kickoffReached: boolean;
  onEdit: () => void;
  onCarpool: () => void;
};

function ManageMatchSheet({
  match,
  open,
  onOpenChange,
  canManageMatch,
  canFreeze,
  showEdit,
  manageLive,
  kickoffReached,
  onEdit,
  onCarpool,
}: ManageMatchSheetProps) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const freezePolls = useFreezePolls();
  const unfreezePolls = useUnfreezePolls();
  const enablePolls = useEnableMatchPolls();
  const completeMatch = useCompleteMatch();
  const cancelMatch = useCancelMatch();

  const showEnable =
    canManageMatch &&
    manageLive &&
    match.status === "confirmed" &&
    !match.pollsEnabled;
  const showFreeze =
    canFreeze &&
    manageLive &&
    match.status === "confirmed" &&
    match.pollsEnabled &&
    !match.pollsFrozen &&
    !match.squadFinalizationPendingAt;
  const showUnfreeze =
    canFreeze &&
    manageLive &&
    match.status === "confirmed" &&
    match.pollsEnabled &&
    match.pollsFrozen;
  const showCarpool =
    canManageMatch && match.status === "confirmed" && kickoffReached;
  const showComplete =
    canManageMatch &&
    match.status === "confirmed" &&
    Boolean(match.pollsFrozen) &&
    Boolean(match.carpoolAssignedAt) &&
    Boolean(match.squadFinalizedAt) &&
    kickoffReached;
  const showCancel =
    canManageMatch &&
    (match.status === "confirmed" ||
      match.status === "pending_confirm" ||
      match.status === "draft");
  const showSquadReview =
    canFreeze &&
    match.status === "confirmed" &&
    match.pollsEnabled &&
    !match.squadFinalizedAt &&
    (match.pollsFrozen || Boolean(match.squadFinalizationPendingAt));
  const lifecycle = getLifecycleStage(match, kickoffReached);

  return (
    <BottomSheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) setConfirmCancel(false);
        onOpenChange(nextOpen);
      }}
    >
      <BottomSheetContent>
        {confirmCancel ? (
          <>
            <BottomSheetHeader className="text-left">
              <BottomSheetTitle>Cancel this match?</BottomSheetTitle>
              <BottomSheetDescription>
                This ends the fixture and no weekend fees will be charged.
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="space-y-2 px-4 pb-6">
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                loading={cancelMatch.isPending}
                onClick={async () => {
                  try {
                    await cancelMatch.mutateAsync(match.id);
                    toast.success({ title: "Match cancelled — no fees" });
                    setConfirmCancel(false);
                    onOpenChange(false);
                  } catch (error) {
                    showMutationError(error);
                  }
                }}
              >
                Cancel match
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={cancelMatch.isPending}
                onClick={() => setConfirmCancel(false)}
              >
                Keep match
              </Button>
            </div>
          </>
        ) : (
          <>
            <BottomSheetHeader className="text-left">
              <BottomSheetTitle className="font-heading text-2xl font-semibold">
                Manage match
              </BottomSheetTitle>
              <BottomSheetDescription>
                Fixture, availability, carpool, and lifecycle actions
              </BottomSheetDescription>
            </BottomSheetHeader>
            <div className="max-h-[65vh] space-y-2 overflow-y-auto px-4 pb-6">
              <section className="mb-4 rounded-xl bg-surface-container-low p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Current stage
                  </p>
                  <StatusChip status={lifecycle.status}>
                    {lifecycle.stage}
                  </StatusChip>
                </div>
                <p className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Next action
                </p>
                <BodySm className="mt-1 text-foreground">
                  {lifecycle.nextAction}
                </BodySm>
              </section>
              {showEnable ? (
                <ManageMatchAction
                  icon={Vote}
                  label="Enable polls now"
                  description="Opens voting and notifies the squad"
                  primary
                  loading={enablePolls.isPending}
                  onClick={() =>
                    void runAction(
                      () => enablePolls.mutateAsync(match.id),
                      "Polls enabled — squad notified",
                    )
                  }
                />
              ) : null}
              {showSquadReview ? (
                <ManageMatchAction
                  icon={Vote}
                  label={
                    match.squadFinalizationPendingAt
                      ? "Review squad availability"
                      : "Select playing squad"
                  }
                  description="Continue in the match poll panel"
                  primary
                  onClick={() => onOpenChange(false)}
                />
              ) : null}
              {showCarpool && !match.carpoolAssignedAt ? (
                <ManageMatchAction
                  icon={Car}
                  label="Assign carpool rides"
                  description="Required before completing the match"
                  primary
                  onClick={() => {
                    onOpenChange(false);
                    onCarpool();
                  }}
                />
              ) : null}
              {showComplete ? (
                <ManageMatchAction
                  icon={CheckCircle2}
                  label="Mark match completed"
                  description="Makes the fixture eligible for weekend fees"
                  primary
                  loading={completeMatch.isPending}
                  onClick={() =>
                    void runAction(
                      () => completeMatch.mutateAsync(match.id),
                      "Match marked completed",
                    )
                  }
                />
              ) : null}
              {showEdit ? (
                <ManageMatchAction
                  icon={Pencil}
                  label="Edit fixture details"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit();
                  }}
                />
              ) : null}
              {showFreeze ? (
                <ManageMatchAction
                  icon={Snowflake}
                  label="Freeze availability"
                  description="Carpool voting stays open"
                  primary
                  loading={freezePolls.isPending}
                  onClick={() =>
                    void freezePolls
                      .mutateAsync(match.id)
                      .then((frozen) => {
                        toast.success({
                          title: frozen.squadFinalizedAt
                            ? "Playing squad locked"
                            : frozen.squadFinalizationPendingAt
                              ? "Voting remains open"
                              : "Availability frozen",
                          description: frozen.squadFinalizationPendingAt
                            ? "Recruit more players, then confirm the playing squad."
                            : undefined,
                        });
                      })
                      .catch(showMutationError)
                  }
                />
              ) : null}
              {showUnfreeze ? (
                <ManageMatchAction
                  icon={Unlock}
                  label="Unfreeze availability"
                  loading={unfreezePolls.isPending}
                  onClick={() =>
                    void runAction(
                      () => unfreezePolls.mutateAsync(match.id),
                      "Squad unlocked",
                    )
                  }
                />
              ) : null}
              {showCarpool && match.carpoolAssignedAt ? (
                <ManageMatchAction
                  icon={Car}
                  label="Edit carpool assignment"
                  onClick={() => {
                    onOpenChange(false);
                    onCarpool();
                  }}
                />
              ) : null}
              {showCancel ? (
                <ManageMatchAction
                  icon={Ban}
                  label="Cancel match"
                  destructive
                  loading={cancelMatch.isPending}
                  onClick={() => setConfirmCancel(true)}
                />
              ) : null}
            </div>
          </>
        )}
      </BottomSheetContent>
    </BottomSheet>
  );
}

function getLifecycleStage(match: Match, kickoffReached: boolean) {
  if (match.status === "pending_confirm" || match.status === "draft") {
    return {
      stage: "Scheduled",
      status: "pending" as const,
      nextAction: "Review fixture details before its automatic publication.",
    };
  }
  if (!match.pollsEnabled) {
    return {
      stage: "Fixture live",
      status: "info" as const,
      nextAction: "Enable polls when the squad is ready to vote.",
    };
  }
  if (!match.squadFinalizedAt) {
    if (match.squadFinalizationPendingAt) {
      return {
        stage: "Squad pending",
        status: "warning" as const,
        nextAction:
          "Recruit to 11–12 players, then confirm the playing squad in the poll panel.",
      };
    }
    if (match.pollsFrozen) {
      return {
        stage: "Squad selection",
        status: "warning" as const,
        nextAction: "Select and confirm the final playing squad.",
      };
    }
    return {
      stage: "Availability open",
      status: "info" as const,
      nextAction: "Freeze availability when the playing pool is ready.",
    };
  }
  if (!kickoffReached) {
    return {
      stage: "Match-day ready",
      status: "success" as const,
      nextAction: "After kickoff, record who actually drove and rode.",
    };
  }
  if (!match.carpoolAssignedAt) {
    return {
      stage: "Post-match",
      status: "warning" as const,
      nextAction: "Assign actual carpool rides, including nobody carpooled.",
    };
  }
  return {
    stage: "Ready to complete",
    status: "success" as const,
    nextAction: "Mark the match completed to include it in weekend fees.",
  };
}

async function runAction(action: () => Promise<unknown>, title: string) {
  try {
    await action();
    toast.success({ title });
  } catch (error) {
    showMutationError(error);
  }
}

function showMutationError(error: unknown) {
  toast.error({ title: getMutationErrorMessage(error) });
}

export { ManageMatchSheet };
