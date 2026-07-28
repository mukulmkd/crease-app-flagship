import { AppShell } from "@/components/layout/app-shell";

/**
 * Authenticated app chrome. Feature routes nest under this group.
 * Titles for nested team routes are resolved inside AppShell.
 */
export default function AppGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <AppShell>{children}</AppShell>;
}
