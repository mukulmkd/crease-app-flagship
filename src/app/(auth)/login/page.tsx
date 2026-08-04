import { AuthShell } from "@/features/auth/components/auth-shell";
import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <AuthShell title="Crease">
      <LoginForm />
    </AuthShell>
  );
}
