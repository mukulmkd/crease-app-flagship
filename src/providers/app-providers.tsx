"use client";

import type { ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileKeyboardProvider } from "@/providers/mobile-keyboard-provider";
import { PwaUpdateProvider } from "@/providers/pwa-update-provider";
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
          <MobileKeyboardProvider>
            <PwaUpdateProvider />
            <TooltipProvider delayDuration={200}>
              {children}
              <Toaster
                position="bottom-center"
                offset={{ bottom: "var(--toast-bottom-offset)" }}
                mobileOffset={{
                  bottom: "var(--toast-bottom-offset)",
                }}
                closeButton
              />
            </TooltipProvider>
          </MobileKeyboardProvider>
        </SessionProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
