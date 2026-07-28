"use client";

import { Body, BodySm, SectionHeader, StatusChip } from "@/components/common";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { AppCard, AppCardContent } from "@/components/cards";
import { Button } from "@/components/ui/button";
import { AddPlayerForm } from "@/features/team/components/add-player-form";
import {
  useMyMembership,
  useTeamMembers,
  useUpdateMembership,
} from "@/features/team/hooks";
import {
  membershipRoleLabel,
  membershipStatusLabel,
} from "@/features/team/lib/status";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { toast } from "@/components/feedback/toast";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";

/**
 * Team members — Admin can add/manage; everyone can view the squad.
 */
function TeamMembersView() {
  const membershipQuery = useMyMembership();
  const membersQuery = useTeamMembers({ status: "active", limit: 100 });
  const updateMembership = useUpdateMembership();

  const role = membershipQuery.data?.role;
  const canManage = hasPermission(role, PERMISSIONS.TEAM_MEMBER_ADD);

  if (membershipQuery.isLoading || membersQuery.isLoading) {
    return <LoadingState label="Loading squad" />;
  }

  if (membershipQuery.isError || membersQuery.isError) {
    return (
      <ErrorState
        title="Could not load squad"
        description="Check your connection and try again."
        onRetry={() => {
          void membershipQuery.refetch();
          void membersQuery.refetch();
        }}
      />
    );
  }

  const members = membersQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Ranches Thunders"
        description="Squad members with app access"
      />

      {canManage ? (
        <AppCard>
          <AppCardContent className="space-y-3 pt-6">
            <Body className="font-medium">Add player</Body>
            <AddPlayerForm
              onAdded={() => {
                void membersQuery.refetch();
              }}
            />
          </AppCardContent>
        </AppCard>
      ) : null}

      {members.length === 0 ? (
        <EmptyState
          title="No members yet"
          description="Admin must add players before they can use the app."
        />
      ) : (
        <ul className="space-y-3">
          {members.map((member) => (
            <li key={member.id}>
              <AppCard>
                <AppCardContent className="flex items-center justify-between gap-3 py-4">
                  <div className="min-w-0">
                    <Body className="truncate font-medium">
                      {member.profile.fullName ?? "Player"}
                    </Body>
                    <BodySm className="truncate">
                      {member.profile.phone ?? "—"}
                    </BodySm>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <StatusChip status="info">
                      {membershipRoleLabel(member.role)}
                    </StatusChip>
                    <StatusChip status="success">
                      {membershipStatusLabel(member.status)}
                    </StatusChip>
                    {canManage && member.role === "player" ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-10"
                        disabled={updateMembership.isPending}
                        onClick={async () => {
                          try {
                            await updateMembership.mutateAsync({
                              membershipId: member.id,
                              status: "suspended",
                            });
                            toast.success({ title: "Player suspended" });
                          } catch (error) {
                            toast.error({
                              title: getMutationErrorMessage(error),
                            });
                          }
                        }}
                      >
                        Suspend
                      </Button>
                    ) : null}
                  </div>
                </AppCardContent>
              </AppCard>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export { TeamMembersView };
