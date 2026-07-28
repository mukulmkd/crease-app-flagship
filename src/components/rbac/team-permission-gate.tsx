"use client";

import type { ReactNode } from "react";

import { LoadingState } from "@/components/feedback/loading-state";
import { useMyMembership } from "@/features/team/hooks";
import { canTeamPermission } from "@/lib/rbac/team-permissions";
import type { TeamPermission } from "@/constants/domain/team-permissions";

type TeamPermissionGateProps = {
  permission: TeamPermission;
  children: ReactNode;
  fallback?: ReactNode;
  loadingFallback?: ReactNode;
};

function TeamPermissionGate({
  permission,
  children,
  fallback = null,
  loadingFallback = null,
}: TeamPermissionGateProps) {
  const membershipQuery = useMyMembership();

  if (membershipQuery.isLoading) {
    return loadingFallback ?? <LoadingState label="Loading permissions" />;
  }

  const role = membershipQuery.data?.role ?? null;
  if (!canTeamPermission(role, permission)) return <>{fallback}</>;

  return <>{children}</>;
}

export { TeamPermissionGate };
export type { TeamPermissionGateProps };
