"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useRemoveTeamLogo, useUpdateTeamLogo } from "@/features/team/hooks";
import { compressTeamLogoForUpload, resolveTeamLogoUrl } from "@/utils";

type TeamLogoControlProps = {
  teamName: string;
  logoUrl?: string | null;
};

/**
 * Admin team logo picker — square-crops, resizes ≤512px, uploads to `team-logos`.
 */
function TeamLogoControl({ teamName, logoUrl }: TeamLogoControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateLogo = useUpdateTeamLogo();
  const removeLogo = useRemoveTeamLogo();
  const busy = updateLogo.isPending || removeLogo.isPending;
  const resolved = resolveTeamLogoUrl(logoUrl);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await compressTeamLogoForUpload(file);
      await updateLogo.mutateAsync(blob);
      toast.success({ title: "Team logo updated" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="relative">
        <span
          className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl bg-clubhouse text-primary-foreground"
          aria-hidden={!resolved}
        >
          {resolved ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage public URL; mirrors UserAvatar
            <img
              src={resolved}
              alt={`${teamName} logo`}
              loading="lazy"
              decoding="async"
              className="size-full object-cover"
            />
          ) : (
            <span className="relative h-8 w-8" aria-hidden>
              <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-tertiary" />
              <span className="absolute top-0 bottom-0 left-1/2 w-0.5 -translate-x-1/2 rounded-full bg-tertiary/80" />
            </span>
          )}
        </span>
        {busy ? (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-clubhouse/60"
            aria-live="polite"
            aria-label="Updating logo"
          >
            <Loader2
              className="size-6 animate-spin text-tertiary"
              aria-hidden
            />
          </span>
        ) : null}
        <Button
          type="button"
          size="icon-sm"
          variant="tonal"
          className="absolute -right-1 -bottom-1 rounded-full border border-border bg-surface-container-high shadow-sm"
          disabled={busy}
          aria-label="Upload team logo from gallery or camera"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="sr-only"
          disabled={busy}
          onChange={(event) => {
            void onPick(event.target.files?.[0]);
          }}
        />
      </div>
      {resolved ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 gap-1.5 text-muted-foreground"
          disabled={busy}
          loading={removeLogo.isPending}
          onClick={() => {
            removeLogo.mutate(undefined, {
              onSuccess: () => toast.success({ title: "Logo removed" }),
              onError: (error) =>
                toast.error({ title: getMutationErrorMessage(error) }),
            });
          }}
        >
          {removeLogo.isPending ? null : (
            <Trash2 className="size-3.5" aria-hidden />
          )}
          Remove logo
        </Button>
      ) : (
        <p className="text-caption text-muted-foreground">
          Square crop · shown in the top bar for every member
        </p>
      )}
    </div>
  );
}

export { TeamLogoControl };
