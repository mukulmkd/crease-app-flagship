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

export type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  mobile?: boolean;
  desktop?: boolean;
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
    href: "/payments",
    icon: CreditCard,
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
    desktop: true,
  },
];

export const desktopOnlyNav: NavItem[] = [];
