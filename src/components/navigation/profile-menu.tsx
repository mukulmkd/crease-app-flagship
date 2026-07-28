"use client";

import Link from "next/link";
import { ChevronDown, LogOut, Settings, UserRound } from "lucide-react";

import { UserAvatar } from "@/components/common/user-avatar";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  getMutationErrorMessage,
  useSignOut,
} from "@/features/auth/hooks/use-auth-mutations";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";
import { cn } from "@/utils";

type ProfileMenuProps = {
  /** Override display name; defaults to session profile. */
  name?: string;
  /** Override role label; defaults to membership role metadata. */
  role?: string;
  imageUrl?: string | null;
  className?: string;
};

function resolveDisplayName(
  user: ReturnType<typeof useAuth>["user"],
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fromMeta =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  if (fromMeta) return fromMeta;
  if (user?.phone)
    return formatPhoneDisplay(
      user.phone.startsWith("+") ? user.phone : `+${user.phone}`,
    );
  return "Player";
}

function resolveRoleLabel(
  user: ReturnType<typeof useAuth>["user"],
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const role = typeof meta.role === "string" ? meta.role : null;
  if (!role) return "Member";
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Profile overflow menu — profile/settings links + sign out.
 */
function ProfileMenu({ name, role, imageUrl, className }: ProfileMenuProps) {
  const { user } = useAuth();
  const signOut = useSignOut();

  const displayName = resolveDisplayName(user, name);
  const roleLabel = resolveRoleLabel(user, role);
  const avatarUrl =
    imageUrl ??
    (typeof user?.user_metadata?.avatar_url === "string"
      ? user.user_metadata.avatar_url
      : null);

  const handleSignOut = () => {
    signOut.mutate(undefined, {
      onError: (error) => {
        toast.error({
          title: "Could not sign out",
          description: getMutationErrorMessage(error),
        });
      },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={cn(
            "h-12 gap-2 px-2 data-[state=open]:bg-surface-container",
            className,
          )}
          aria-label="Open profile menu"
        >
          <UserAvatar name={displayName} imageUrl={avatarUrl} size="sm" />
          <span className="hidden max-w-28 flex-col items-start text-left lg:flex">
            <span className="truncate text-sm leading-tight font-medium">
              {displayName}
            </span>
            <span className="truncate text-caption text-muted-foreground">
              {roleLabel}
            </span>
          </span>
          <ChevronDown
            className="hidden size-4 opacity-60 lg:block"
            aria-hidden
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">{displayName}</span>
            <span className="text-xs text-muted-foreground">{roleLabel}</span>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/profile">
              <UserRound />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/settings">
              <Settings />
              Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={signOut.isPending}
          variant="destructive"
          onSelect={(event) => {
            event.preventDefault();
            handleSignOut();
          }}
        >
          <LogOut />
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProfileMenu };
export type { ProfileMenuProps };
