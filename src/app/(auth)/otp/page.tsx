import { AuthShell } from "@/features/auth/components/auth-shell";
import { OtpForm } from "@/features/auth/components/otp-form";
import { AUTH_ROUTES } from "@/constants/auth";

type OtpPageProps = {
  searchParams: Promise<{ phone?: string }>;
};

export default async function OtpPage({ searchParams }: OtpPageProps) {
  const params = await searchParams;

  return (
    <AuthShell showBack backHref={AUTH_ROUTES.login} title="Crease">
      <OtpForm phone={params.phone ?? ""} />
    </AuthShell>
  );
}
