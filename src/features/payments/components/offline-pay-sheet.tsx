"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { PaymentProofFields } from "@/features/payments/components/payment-proof-fields";
import {
  useMarkDemoOfflinePaid,
  useMarkOfflinePaid,
} from "@/features/payments/hooks";
import {
  formatMatchDate,
  formatWeekendRange,
} from "@/features/team/lib/match-format";
import type { AdminPlayerDues } from "@/services/payment.service";
import { formatInrAmount } from "@/utils";

const offlineSchema = z.object({
  utr: z.string().trim().min(4).max(64),
});

type OfflineValues = z.infer<typeof offlineSchema>;

type OfflinePaySheetProps = {
  player: AdminPlayerDues | null;
  demoMode: boolean;
  onClose: () => void;
};

function OfflinePaySheet({ player, demoMode, onClose }: OfflinePaySheetProps) {
  const markOffline = useMarkOfflinePaid();
  const markDemo = useMarkDemoOfflinePaid();
  const [file, setFile] = useState<File | null>(null);
  const form = useForm<OfflineValues>({
    resolver: zodResolver(offlineSchema),
    defaultValues: { utr: "" },
  });

  // Only the still-pending lines are settled by this action.
  const dueLines =
    player?.matches.filter((match) =>
      player.chargeIds.includes(match.chargeId),
    ) ?? [];

  return (
    <BottomSheet
      open={Boolean(player)}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <BottomSheetContent className="bg-surface-container-lowest">
        <BottomSheetHeader className="text-left">
          <BottomSheetTitle className="font-heading text-2xl font-semibold">
            Mark offline paid
          </BottomSheetTitle>
          <BottomSheetDescription>
            {player
              ? `Record ₹${formatInrAmount(player.totalDueInr)} received from ${player.fullName?.trim() || "Player"} for ${formatWeekendRange(player.weekStartDate, player.weekEndDate)}. UTR and screenshot are required.`
              : null}
          </BottomSheetDescription>
        </BottomSheetHeader>
        <form
          className="space-y-4 px-4 pb-6"
          onSubmit={form.handleSubmit(async (values) => {
            if (!player || !file) {
              toast.error({ title: "Add UTR and a screenshot" });
              return;
            }
            try {
              await markOffline.mutateAsync({
                chargeIds: player.chargeIds,
                utr: values.utr,
                file,
              });
              toast.success({ title: "Marked offline paid" });
              onClose();
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          {dueLines.length > 1 ? (
            <ul className="space-y-1 rounded-xl bg-surface-container-low px-3 py-2 text-xs text-muted-foreground">
              {dueLines.map((match) => (
                <li key={match.chargeId} className="flex justify-between gap-2">
                  <span>
                    vs {match.opposition?.trim() || "TBD"} ·{" "}
                    {formatMatchDate(match.matchDate)}
                  </span>
                  <span className="tabular-nums">
                    ₹{formatInrAmount(match.totalInr)}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <PaymentProofFields
            utrRegistration={form.register("utr")}
            utrError={form.formState.errors.utr?.message}
            onFileChange={setFile}
          />
          <Button
            type="submit"
            className="w-full"
            loading={markOffline.isPending}
            disabled={!file}
          >
            Mark offline paid · ₹{formatInrAmount(player?.totalDueInr ?? 0)}
          </Button>
          {demoMode ? (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              loading={markDemo.isPending}
              onClick={async () => {
                if (!player) return;
                try {
                  await markDemo.mutateAsync({
                    chargeIds: player.chargeIds,
                    utr: form.getValues("utr") || undefined,
                  });
                  toast.success({ title: "Demo offline payment recorded" });
                  onClose();
                } catch (error) {
                  toast.error({ title: getMutationErrorMessage(error) });
                }
              }}
            >
              Use dummy proof
            </Button>
          ) : null}
        </form>
      </BottomSheetContent>
    </BottomSheet>
  );
}

export { OfflinePaySheet };
