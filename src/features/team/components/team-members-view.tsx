"use client";

import { useMemo, useState } from "react";
import { MoreVertical, Plus, Search, Users } from "lucide-react";

import { UserAvatar } from "@/components/common";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetHeader,
  BottomSheetTitle,
} from "@/components/dialogs";
import { EmptyState, ErrorState, LoadingState } from "@/components/feedback";
import { SegmentedControl } from "@/components/forms";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  hasPermission,
  PERMISSIONS,
} from "@/constants/domain/team-permissions";
import { getMutationErrorMessage } from "@/features/auth/hooks/use-auth-mutations";
import { AddPlayerForm } from "@/features/team/components/add-player-form";
import { MemberActionsSheet } from "@/features/team/components/member-actions-sheet";
import {
  useMyMembership,
  useTeamMembers,
  useUpdateMembership,
} from "@/features/team/hooks";
import type { TeamMembershipWithProfile } from "@/types/models";

type RoleFilter = "all" | "admin" | "player";

function TeamMembersView() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<RoleFilter>("all");
  const [addOpen, setAddOpen] = useState(false);
  const [selectedMember, setSelectedMember] =
    useState<TeamMembershipWithProfile | null>(null);
  const membership = useMyMembership();
  const members = useTeamMembers({ status: "active", limit: 100 });
  const updateMembership = useUpdateMembership();
  const role = membership.data?.role;
  const canAdd = hasPermission(role, PERMISSIONS.TEAM_MEMBER_ADD);
  const canManage = hasPermission(role, PERMISSIONS.TEAM_MEMBER_REMOVE);
  const myUserId = membership.data?.userId;

  const activeAdminCount = useMemo(
    () =>
      (members.data?.items ?? []).filter((member) => member.role === "admin")
        .length,
    [members.data?.items],
  );

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return (members.data?.items ?? []).filter((member) => {
      const matchesRole = filter === "all" || member.role === filter;
      const matchesQuery =
        !normalized ||
        member.profile.fullName?.toLowerCase().includes(normalized) ||
        member.profile.phone?.includes(normalized);
      return matchesRole && matchesQuery;
    });
  }, [filter, members.data?.items, query]);

  async function runMembershipUpdate(
    input: Parameters<typeof updateMembership.mutateAsync>[0],
    successTitle: string,
  ) {
    try {
      await updateMembership.mutateAsync(input);
      toast.success({ title: successTitle });
      setSelectedMember(null);
    } catch (error) {
      toast.error({ title: getMutationErrorMessage(error) });
    }
  }

  if (membership.isLoading || members.isLoading) {
    return <LoadingState label="Loading squad" />;
  }

  if (membership.isError || members.isError) {
    return (
      <ErrorState
        title="Could not load squad"
        description="Check your connection and try again."
        onRetry={() => {
          void membership.refetch();
          void members.refetch();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold tracking-[0.12em] text-primary uppercase">
            Team
          </p>
          <h1 className="font-heading text-4xl font-extrabold uppercase">
            Ranches Thunders
          </h1>
          <p className="mt-1 inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="size-4" aria-hidden />
            {members.data?.items.length ?? 0} active players
            {!canAdd ? " · View only" : null}
          </p>
        </div>
        {canAdd ? (
          <Button
            type="button"
            size="icon"
            aria-label="Add player"
            onClick={() => setAddOpen(true)}
          >
            <Plus aria-hidden />
          </Button>
        ) : null}
      </header>

      <div className="space-y-3">
        <label className="relative block">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <span className="sr-only">Search members</span>
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players"
            className="pl-10"
          />
        </label>
        <SegmentedControl
          aria-label="Filter team members"
          value={filter}
          onValueChange={setFilter}
          options={[
            { value: "all", label: "All" },
            { value: "admin", label: "Admins" },
            { value: "player", label: "Players" },
          ]}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title={query ? "No players found" : "No members yet"}
          description={
            query
              ? "Try another name or phone number."
              : canAdd
                ? "Add players so they can sign in and join polls."
                : "Your admin will add squad members here."
          }
        />
      ) : (
        <ul className="divide-y divide-outline-variant">
          {filtered.map((member) => (
            <MemberRow
              key={member.id}
              member={member}
              canManage={canManage}
              onOpenActions={() => setSelectedMember(member)}
            />
          ))}
        </ul>
      )}

      {canAdd ? (
        <BottomSheet open={addOpen} onOpenChange={setAddOpen}>
          <BottomSheetContent className="bg-surface-container-lowest">
            <BottomSheetHeader className="text-left">
              <BottomSheetTitle className="font-heading text-2xl font-bold uppercase">
                Add team member
              </BottomSheetTitle>
            </BottomSheetHeader>
            <div className="px-4 pb-6">
              <AddPlayerForm
                onAdded={() => {
                  setAddOpen(false);
                  void members.refetch();
                }}
              />
            </div>
          </BottomSheetContent>
        </BottomSheet>
      ) : null}

      {canManage ? (
        <MemberActionsSheet
          member={selectedMember}
          open={selectedMember != null}
          onOpenChange={(open) => {
            if (!open) setSelectedMember(null);
          }}
          pending={updateMembership.isPending}
          isSelf={selectedMember != null && selectedMember.userId === myUserId}
          activeAdminCount={activeAdminCount}
          onPromote={() =>
            runMembershipUpdate(
              { membershipId: selectedMember!.id, role: "admin" },
              "Promoted to Admin",
            )
          }
          onDemote={() =>
            runMembershipUpdate(
              { membershipId: selectedMember!.id, role: "player" },
              "Demoted to Player",
            )
          }
          onSuspend={() =>
            runMembershipUpdate(
              { membershipId: selectedMember!.id, status: "suspended" },
              "Player suspended",
            )
          }
        />
      ) : null}
    </div>
  );
}

function MemberRow({
  member,
  canManage,
  onOpenActions,
}: {
  member: TeamMembershipWithProfile;
  canManage: boolean;
  onOpenActions: () => void;
}) {
  const name = member.profile.fullName ?? "Player";
  return (
    <li className="flex min-h-18 items-center gap-3 py-3">
      <UserAvatar name={name} imageUrl={member.profile.avatarUrl} size="lg" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{name}</p>
        <p className="truncate text-sm text-muted-foreground">
          {member.profile.phone ?? "Phone unavailable"}
        </p>
      </div>
      <div className="text-right">
        <span className="text-xs font-bold tracking-[0.08em] text-primary uppercase">
          {member.role}
        </span>
        <p className="mt-1 text-xs text-muted-foreground">
          <span className="mr-1 inline-block size-1.5 rounded-full bg-success" />
          Active
        </p>
      </div>
      {canManage ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Manage ${name}`}
          onClick={onOpenActions}
        >
          <MoreVertical aria-hidden />
        </Button>
      ) : null}
    </li>
  );
}

export { TeamMembersView };
