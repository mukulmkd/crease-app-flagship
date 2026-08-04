"use client";

import Link from "next/link";
import {
  ChevronDown,
  CreditCard,
  Loader2,
  LogOut,
  Settings,
  UserRound,
} from "lucide-react";

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
import { useMyProfile } from "@/features/profile/hooks";
import { useMyMembership } from "@/features/team/hooks";
import { membershipRoleLabel } from "@/features/team/lib/status";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";
import { cn } from "@/utils";

type ProfileMenuProps = {
  /** Override display name; defaults to profile / session. */
  name?: string;
  /** Override role label; defaults to membership role. */
  role?: string;
  imageUrl?: string | null;
  className?: string;
};

function resolveDisplayName(
  profileName: string | null | undefined,
  user: ReturnType<typeof useAuth>["user"],
  override?: string,
): string {
  if (override?.trim()) return override.trim();
  if (profileName?.trim()) return profileName.trim();
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

/**
 * Profile overflow menu — account shortcuts + sign out.
 */
function ProfileMenu({ name, role, imageUrl, className }: ProfileMenuProps) {
  const { user } = useAuth();
  const signOut = useSignOut();
  const profileQuery = useMyProfile();
  const membershipQuery = useMyMembership();

  const displayName = resolveDisplayName(
    profileQuery.data?.fullName,
    user,
    name,
  );
  const roleLabel =
    role?.trim() ||
    (membershipQuery.data?.role
      ? membershipRoleLabel(membershipQuery.data.role)
      : "Member");
  const avatarUrl = imageUrl ?? profileQuery.data?.avatarUrl ?? null;

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
            <Link href="/payments">
              <CreditCard />
              Payments
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
          {signOut.isPending ? (
            <Loader2 className="animate-spin" aria-hidden />
          ) : (
            <LogOut />
          )}
          {signOut.isPending ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { ProfileMenu };
export type { ProfileMenuProps };
