"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/providers/session-provider";
import { QueryProvider } from "@/providers/query-provider";
import { ThemeProvider } from "@/providers/theme-provider";

type AppProvidersProps = {
  children: ReactNode;
};

/**
 * Root client providers. Keep global state limited to auth, theme, and notifications.
 */
export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <QueryProvider>
        <SessionProvider>
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster position="bottom-center" richColors closeButton />
          </TooltipProvider>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
