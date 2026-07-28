"use client";

import { Sidebar } from "@/components/navigation/sidebar";
import { cn } from "@/utils";

type DesktopNavProps = {
  /** Collapsed icon rail on tablet (md), expanded on lg+ when false */
  collapsed?: boolean;
  className?: string;
};

/**
 * Desktop navigation shell — wraps Sidebar for tablet/desktop breakpoints.
 */
function DesktopNav({ collapsed = false, className }: DesktopNavProps) {
  return (
    <div
      data-slot="desktop-nav"
      className={cn("hidden h-full md:flex", className)}
    >
      <Sidebar collapsed={collapsed} />
    </div>
  );
}

export { DesktopNav };
export type { DesktopNavProps };
