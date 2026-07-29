"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { LogOut } from "lucide-react";
import { useForm } from "react-hook-form";

import { StatusChip } from "@/components/common";
import { Body, BodySm, Title } from "@/components/common/typography";
import { FormField } from "@/components/forms/form-field";
import { ErrorState, LoadingState } from "@/components/feedback";
import { toast } from "@/components/feedback/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getMutationErrorMessage,
  useSignOut,
} from "@/features/auth/hooks/use-auth-mutations";
import { ProfileAvatarControl } from "@/features/profile/components/profile-avatar-control";
import { useMyProfile, useUpdateMyProfile } from "@/features/profile/hooks";
import { useMvpTeam, useMyMembership } from "@/features/team/hooks";
import {
  membershipRoleChip,
  membershipRoleLabel,
} from "@/features/team/lib/status";
import { formatPhoneDisplay } from "@/lib/auth/utils";
import {
  updateOwnProfileSchema,
  type UpdateOwnProfileInput,
} from "@/lib/validations/auth";

/**
 * Profile hub — view identity, edit name, sign out.
 */
function ProfileShell() {
  const profileQuery = useMyProfile();
  const membershipQuery = useMyMembership();
  const teamQuery = useMvpTeam();
  const updateProfile = useUpdateMyProfile();
  const signOut = useSignOut();

  const role = membershipQuery.data?.role;

  const form = useForm<UpdateOwnProfileInput>({
    resolver: zodResolver(updateOwnProfileSchema),
    defaultValues: { name: "" },
  });

  useEffect(() => {
    if (profileQuery.data?.fullName) {
      form.reset({ name: profileQuery.data.fullName });
    }
  }, [profileQuery.data?.fullName, form]);

  if (
    profileQuery.isLoading ||
    membershipQuery.isLoading ||
    teamQuery.isLoading
  ) {
    return <LoadingState label="Loading profile" />;
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <ErrorState
        title="Could not load profile"
        onRetry={() => void profileQuery.refetch()}
      />
    );
  }

  const profile = profileQuery.data;
  const displayName = profile.fullName?.trim() || "Player";
  const phone = profile.phone
    ? formatPhoneDisplay(
        profile.phone.startsWith("+") ? profile.phone : `+${profile.phone}`,
      )
    : "Not set";
  const roleLabel = role ? membershipRoleLabel(role) : "Member";

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col gap-6 pb-8">
      <header className="flex flex-col items-center gap-3 pt-2 text-center">
        <ProfileAvatarControl name={displayName} imageUrl={profile.avatarUrl} />
        <div className="space-y-1">
          <Title>{displayName}</Title>
          <Body className="text-muted-foreground">{phone}</Body>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {role ? (
            <StatusChip status={membershipRoleChip(role)}>
              {roleLabel}
            </StatusChip>
          ) : null}
          <StatusChip status="success">Active</StatusChip>
        </div>
        {teamQuery.data ? (
          <BodySm className="text-muted-foreground">
            {teamQuery.data.name}
          </BodySm>
        ) : null}
      </header>

      <section className="space-y-4 rounded-xl bg-surface-container-low p-4">
        <p className="text-caption font-medium tracking-wide text-muted-foreground uppercase">
          Edit profile
        </p>
        <form
          className="space-y-4"
          onSubmit={form.handleSubmit(async (values) => {
            try {
              await updateProfile.mutateAsync(values);
              toast.success({ title: "Profile updated" });
            } catch (error) {
              toast.error({ title: getMutationErrorMessage(error) });
            }
          })}
        >
          <FormField
            label="Full name"
            htmlFor="profile-name"
            error={form.formState.errors.name?.message}
            required
          >
            <Input
              id="profile-name"
              autoComplete="name"
              {...form.register("name")}
            />
          </FormField>
          <FormField
            label="Mobile number"
            htmlFor="profile-phone"
            description="Phone is your login identity and can’t be changed here."
          >
            <Input id="profile-phone" value={phone} disabled readOnly />
          </FormField>
          <Button
            type="submit"
            className="w-full"
            loading={updateProfile.isPending}
            disabled={!form.formState.isDirty}
          >
            Save changes
          </Button>
        </form>
      </section>

      <Button
        type="button"
        variant="outline"
        className="h-12 w-full justify-start gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
        loading={signOut.isPending}
        aria-label="Sign out"
        onClick={() => {
          signOut.mutate(undefined, {
            onError: (error) => {
              toast.error({
                title: "Could not sign out",
                description: getMutationErrorMessage(error),
              });
            },
          });
        }}
      >
        <LogOut className="size-4" aria-hidden />
        Sign out
      </Button>
    </div>
  );
}

export { ProfileShell };
