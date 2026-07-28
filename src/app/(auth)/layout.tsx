/**
 * Auth route group — no app chrome (sidebar / bottom nav).
 */
export default function AuthGroupLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
