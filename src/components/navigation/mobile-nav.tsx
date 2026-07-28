"use client";

import Link from "next/link";

import { NavLink } from "@/components/navigation/nav-link";
import {
  AppDrawer,
  AppDrawerContent,
  AppDrawerHeader,
  AppDrawerTitle,
} from "@/components/dialogs/app-drawer";
import { Separator } from "@/components/ui/separator";
import { primaryNav, secondaryNav } from "@/constants/navigation";

type MobileNavProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Mobile navigation drawer — overflow destinations beyond bottom nav.
 */
function MobileNav({ open, onOpenChange }: MobileNavProps) {
  return (
    <AppDrawer open={open} onOpenChange={onOpenChange}>
      <AppDrawerContent side="left" className="w-[min(100%,20rem)] p-0">
        <AppDrawerHeader className="border-b border-outline-variant/40 px-4 py-4 text-left">
          <AppDrawerTitle className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              C
            </span>
            Crease
          </AppDrawerTitle>
        </AppDrawerHeader>

        <div className="flex flex-col gap-1 p-3">
          <nav aria-label="Mobile primary" className="flex flex-col gap-1">
            {primaryNav.map((item) => (
              <NavLink
                key={item.id}
                item={item}
                className="w-full"
                // close drawer via link navigation; sheet closes on route change by parent
              />
            ))}
          </nav>
          <Separator className="my-3" />
          <nav aria-label="Mobile more" className="flex flex-col gap-1">
            {secondaryNav.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                className="flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground hover:bg-surface-container hover:text-foreground"
                onClick={() => onOpenChange(false)}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </AppDrawerContent>
    </AppDrawer>
  );
}

export { MobileNav };
export type { MobileNavProps };
