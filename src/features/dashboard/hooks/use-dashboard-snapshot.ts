"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getDashboardService,
  queryKeys,
  requireActor,
  useActor,
} from "@/lib/query";

export function useDashboardSnapshot() {
  const actor = useActor();
  return useQuery({
    queryKey: queryKeys.dashboard.snapshot(),
    queryFn: () => {
      requireActor(actor);
      return getDashboardService().getSnapshot(actor);
    },
    enabled: Boolean(actor),
  });
}
