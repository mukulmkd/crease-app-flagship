import Link from "next/link";

import { cn } from "@/utils";

type AppFooterProps = {
  className?: string;
};

/**
 * Responsive footer — visible on tablet/desktop; mobile uses bottom nav instead.
 */
function AppFooter({ className }: AppFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      data-slot="app-footer"
      className={cn(
        "mt-auto hidden border-t border-outline-variant/40 bg-surface-container-low px-4 py-4 text-caption text-muted-foreground md:block md:px-6",
        className,
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>© {year} Crease · Cricket team management</p>
        <nav
          aria-label="Footer"
          className="flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <Link href="/settings" className="hover:text-foreground">
            Settings
          </Link>
          <Link href="/notifications" className="hover:text-foreground">
            Notifications
          </Link>
          <span className="text-outline">PWA ready</span>
        </nav>
      </div>
    </footer>
  );
}

export { AppFooter };
export type { AppFooterProps };
