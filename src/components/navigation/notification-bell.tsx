"use client";

import { Bell } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotificationsUi } from "@/features/notifications/providers/notifications-ui-provider";
import { cn } from "@/utils";

type NotificationBellProps = {
  /** Unread count for badge — shell chrome only */
  count?: number;
  className?: string;
};

/**
 * Opens the alerts bottom sheet — no navigation to a dedicated page.
 */
function NotificationBell({ count = 0, className }: NotificationBellProps) {
  const { openAlerts } = useNotificationsUi();
  const label = count > 0 ? `Alerts, ${count} unread` : "Alerts";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn("relative", className)}
          aria-label={label}
          onClick={openAlerts}
        >
          <Bell aria-hidden />
          {count > 0 ? (
            <span
              aria-hidden
              className="absolute top-2 right-2 flex size-4 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground"
            >
              {count > 9 ? "9+" : count}
            </span>
          ) : null}
        </Button>
      </TooltipTrigger>
      <TooltipContent>Alerts</TooltipContent>
    </Tooltip>
  );
}

export { NotificationBell };
export type { NotificationBellProps };
