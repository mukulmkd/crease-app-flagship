import { AuthShell } from "@/features/auth/components/auth-shell";
import { ProfileCompletionForm } from "@/features/auth/components/profile-completion-form";
import { AUTH_ROUTES } from "@/constants/auth";

export default function CompleteProfilePage() {
  return (
    <AuthShell
      showBack
      backHref={AUTH_ROUTES.login}
      title="Complete your profile"
    >
      <ProfileCompletionForm />
    </AuthShell>
  );
}
