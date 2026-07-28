"use client";

import { BrandMark } from "@/components/common/brand-mark";
import { NavLink } from "@/components/navigation/nav-link";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { primaryNav, secondaryNav } from "@/constants/navigation";
import { cn } from "@/utils";

type SidebarProps = {
  /** Icon-only rail (tablet). Expanded labels on desktop. */
  collapsed?: boolean;
  className?: string;
};

/**
 * Desktop / tablet left navigation — Stitch Athletic Precision rail.
 */
function Sidebar({ collapsed = false, className }: SidebarProps) {
  return (
    <aside
      data-slot="sidebar"
      aria-label="Desktop navigation"
      className={cn(
        "hidden h-full flex-col border-r border-outline-variant/40 bg-surface-container-low md:flex",
        collapsed ? "w-[4.5rem]" : "w-60",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-14 items-center gap-2 px-3",
          collapsed && "justify-center px-0",
        )}
      >
        <BrandMark
          showWordmark={!collapsed}
          className={collapsed ? "justify-center" : undefined}
        />
      </div>

      <ScrollArea className="flex-1 px-2 pb-4">
        <nav className="flex flex-col gap-1" aria-label="Primary">
          {primaryNav
            .filter((item) => item.desktop)
            .map((item) => (
              <NavLink key={item.id} item={item} collapsed={collapsed} />
            ))}
        </nav>

        {!collapsed ? (
          <>
            <Separator className="my-3" />
            <p className="mb-1 px-3 text-caption font-medium tracking-wide text-muted-foreground uppercase">
              More
            </p>
            <nav className="flex flex-col gap-1" aria-label="Secondary">
              {secondaryNav
                .filter((item) => item.desktop)
                .map((item) => (
                  <NavLink key={item.id} item={item} collapsed={collapsed} />
                ))}
            </nav>
          </>
        ) : null}
      </ScrollArea>
    </aside>
  );
}

export { Sidebar };
export type { SidebarProps };
