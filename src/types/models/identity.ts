import type {
  MembershipRole,
  MembershipStatus,
} from "@/constants/domain/enums";
import type {
  IsoDateTime,
  ProfileId,
  TeamId,
  TeamMembershipId,
  TeamScoped,
  Timestamps,
} from "@/types/common";

export type Profile = Timestamps & {
  id: ProfileId;
  phone: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  profileCompletedAt: IsoDateTime | null;
};

export type Team = Timestamps & {
  id: TeamId;
  name: string;
  slug: string;
  logoUrl: string | null;
  upiVpa: string | null;
  whatsappNotifyUrl: string | null;
  carpoolFeeInr: number;
  /** QA: squad of 4, past weekend fixtures, dummy payment proofs. */
  demoMode: boolean;
  /** Active Admin who collects weekend UPI — exactly one when set. */
  collectorUserId: ProfileId | null;
  archivedAt: IsoDateTime | null;
};

export type TeamMembership = Timestamps &
  TeamScoped & {
    id: TeamMembershipId;
    userId: ProfileId;
    role: MembershipRole;
    status: MembershipStatus;
    joinedAt: IsoDateTime;
  };

export type TeamMembershipWithProfile = TeamMembership & {
  profile: Pick<Profile, "id" | "fullName" | "avatarUrl" | "phone">;
};
