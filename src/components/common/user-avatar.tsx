"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, resolveAvatarUrl } from "@/utils";

const sizeMap = {
  sm: "sm" as const,
  md: "default" as const,
  lg: "lg" as const,
  xl: "lg" as const,
};

type UserAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: keyof typeof sizeMap;
  className?: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

/**
 * Brand-styled avatar with initials fallback.
 */
function UserAvatar({
  name,
  imageUrl,
  size = "md",
  className,
}: UserAvatarProps) {
  const src = resolveAvatarUrl(imageUrl);

  return (
    <Avatar
      size={sizeMap[size]}
      className={cn(
        // `Avatar` sizes via `data-[size=…]`, which outranks a bare `size-*` class.
        size === "xl" && "text-lg data-[size=lg]:size-24",
        "after:border-primary/10",
        className,
      )}
      aria-label={name}
    >
      {src ? <AvatarImage src={src} alt={name} /> : null}
      <AvatarFallback className="bg-primary/10 font-semibold text-primary">
        {getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export { UserAvatar };
export type { UserAvatarProps };
