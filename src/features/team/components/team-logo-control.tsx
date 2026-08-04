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
          className="relative flex size-20 items-center justify-center overflow-hidden rounded-xl bg-[#082417] text-primary-foreground"
          aria-hidden={!resolved}
        >
          {resolved ? (
            // eslint-disable-next-line @next/next/no-img-element -- storage public URL; mirrors UserAvatar
            <img
              src={resolved}
              alt={`${teamName} logo`}
              className="size-full object-cover"
            />
          ) : (
            <span className="h-8 w-8 border-x-2 border-b-2 border-[#c9f64b]">
              <span className="mx-auto block h-full w-px bg-[#c9f64b]" />
            </span>
          )}
        </span>
        {busy ? (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#082417]/60"
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
