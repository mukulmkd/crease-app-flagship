"use client";

import { useRef } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";

import { UserAvatar } from "@/components/common";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { useRemoveMyAvatar, useUpdateMyAvatar } from "@/features/profile/hooks";
import { compressAvatarForUpload } from "@/utils";

type ProfileAvatarControlProps = {
  name: string;
  imageUrl?: string | null;
};

/**
 * Profile photo picker — gallery or camera on any device.
 * Square-crops, resizes to ≤512px, and compresses before upload.
 */
function ProfileAvatarControl({ name, imageUrl }: ProfileAvatarControlProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateAvatar = useUpdateMyAvatar();
  const removeAvatar = useRemoveMyAvatar();
  const busy = updateAvatar.isPending || removeAvatar.isPending;

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await compressAvatarForUpload(file);
      await updateAvatar.mutateAsync(blob);
      toast.success({ title: "Photo updated" });
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <UserAvatar name={name} imageUrl={imageUrl} size="xl" />
        {busy ? (
          <span
            className="absolute inset-0 flex items-center justify-center rounded-full bg-[#082417]/60"
            aria-live="polite"
            aria-label="Updating photo"
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
          aria-label="Choose profile photo from gallery or camera"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden />
        </Button>
        {/*
          No `capture` attribute — on mobile the OS offers Gallery and Camera.
          `image/*` covers JPEG/PNG/WebP/HEIC from photo libraries.
        */}
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
      {imageUrl ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-10 gap-1.5 text-muted-foreground"
          disabled={busy}
          loading={removeAvatar.isPending}
          onClick={() => {
            removeAvatar.mutate(undefined, {
              onSuccess: () => toast.success({ title: "Photo removed" }),
              onError: (error) =>
                toast.error({ title: getMutationErrorMessage(error) }),
            });
          }}
        >
          {removeAvatar.isPending ? null : (
            <Trash2 className="size-3.5" aria-hidden />
          )}
          Remove photo
        </Button>
      ) : (
        <p className="text-caption text-muted-foreground">
          Choose a photo from your gallery or camera
        </p>
      )}
    </div>
  );
}

export { ProfileAvatarControl };
