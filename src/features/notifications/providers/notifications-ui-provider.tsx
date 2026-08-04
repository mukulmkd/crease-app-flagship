"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

import { ALERTS_QUERY_PARAM } from "@/constants/alerts";

type NotificationsUiContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  openAlerts: () => void;
};

const NotificationsUiContext =
  createContext<NotificationsUiContextValue | null>(null);

function NotificationsUiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const openAlerts = useCallback(() => setOpen(true), []);

  // Push / teaser deep-link: any route with ?alerts=1
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get(ALERTS_QUERY_PARAM) !== "1") return;

    params.delete(ALERTS_QUERY_PARAM);
    const query = params.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    window.history.replaceState(null, "", next);

    // Defer open so we don't sync-setState inside the effect body.
    const timer = window.setTimeout(() => setOpen(true), 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  const value = useMemo(
    () => ({ open, setOpen, openAlerts }),
    [open, openAlerts],
  );

  return (
    <NotificationsUiContext.Provider value={value}>
      {children}
    </NotificationsUiContext.Provider>
  );
}

function useNotificationsUi() {
  const ctx = useContext(NotificationsUiContext);
  if (!ctx) {
    throw new Error(
      "useNotificationsUi must be used within NotificationsUiProvider",
    );
  }
  return ctx;
}

export { NotificationsUiProvider, useNotificationsUi };
