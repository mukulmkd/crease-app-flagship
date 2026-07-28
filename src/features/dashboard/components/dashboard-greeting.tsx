"use client";

import { BodySm, Overline, Title } from "@/components/common";
import { useAuth } from "@/hooks/use-auth";
import { formatPhoneDisplay } from "@/lib/auth/utils";
import { cn } from "@/utils";

type DashboardGreetingProps = {
  className?: string;
};

function resolveFirstName(user: ReturnType<typeof useAuth>["user"]): string {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const full =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof meta.name === "string" && meta.name) ||
    null;
  if (full?.trim()) {
    return full.trim().split(/\s+/)[0] ?? "Player";
  }
  if (user?.phone) {
    return formatPhoneDisplay(
      user.phone.startsWith("+") ? user.phone : `+${user.phone}`,
    );
  }
  return "Player";
}

function timeOfDayGreeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * Home hero greeting — Stitch Player Home pattern.
 * Brand-forward first viewport: greeting + one supporting line, no metric spam.
 */
function DashboardGreeting({ className }: DashboardGreetingProps) {
  const { user } = useAuth();
  const firstName = resolveFirstName(user);
  const greeting = timeOfDayGreeting();

  return (
    <header
      data-slot="dashboard-greeting"
      className={cn("space-y-1", className)}
    >
      <Overline className="text-primary">{greeting}</Overline>
      <Title className="text-headline font-bold tracking-tight">
        {firstName}
      </Title>
      <BodySm className="max-w-prose">
        Today&apos;s activity, pending actions, and what&apos;s next.
      </BodySm>
    </header>
  );
}

export { DashboardGreeting };
export type { DashboardGreetingProps };
