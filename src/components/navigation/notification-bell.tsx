"use client";

import Link from "next/link";
import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/utils";

type NotificationBellProps = {
  /** Unread count for badge — shell chrome only */
  count?: number;
  href?: string;
  className?: string;
};

/**
 * Notification affordance — no fetch/business logic.
 */
function NotificationBell({
  count = 0,
  href = "/notifications",
  className,
}: NotificationBellProps) {
  const label = count > 0 ? `Notifications, ${count} unread` : "Notifications";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          asChild
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={label}
        >
          <Link href={href}>
            <Bell aria-hidden />
            {count > 0 ? (
              <span
                aria-hidden
                className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground"
              >
                {count > 9 ? "9+" : count}
              </span>
            ) : null}
          </Link>
        </Button>
      </TooltipTrigger>
      <TooltipContent>Notifications</TooltipContent>
    </Tooltip>
  );
}

export { NotificationBell };
export type { NotificationBellProps };
