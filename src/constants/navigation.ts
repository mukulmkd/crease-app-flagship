import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CreditCard,
  Home,
  Users,
  UserRound,
  Bell,
  Settings,
} from "lucide-react";

import type { Permission } from "@/constants/domain/team-permissions";
import { PERMISSIONS } from "@/constants/domain/team-permissions";

export type NavItem = {
  id: string;
  label: string;
  mobileLabel?: string;
  href: string;
  icon: LucideIcon;
  mobile?: boolean;
  desktop?: boolean;
  permission?: Permission;
};

export const primaryNav: NavItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/home",
    icon: Home,
    mobile: true,
    desktop: true,
  },
  {
    id: "matches",
    label: "Matches",
    href: "/matches",
    icon: CalendarDays,
    mobile: true,
    desktop: true,
  },
  {
    id: "team",
    label: "Team",
    href: "/team",
    icon: Users,
    mobile: true,
    desktop: true,
  },
  {
    id: "profile",
    label: "Profile",
    href: "/profile",
    icon: UserRound,
    mobile: true,
    desktop: true,
  },
];

export const secondaryNav: NavItem[] = [
  {
    id: "payments",
    label: "Payments",
    mobileLabel: "Pay",
    href: "/payments",
    icon: CreditCard,
    mobile: true,
    desktop: true,
  },
  {
    id: "notifications",
    label: "Alerts",
    href: "/notifications",
    icon: Bell,
    desktop: true,
  },
  {
    id: "settings",
    label: "Settings",
    href: "/settings",
    icon: Settings,
    mobile: true,
    desktop: true,
    permission: PERMISSIONS.TEAM_SETTINGS_EDIT,
  },
];

export const desktopOnlyNav: NavItem[] = [];
