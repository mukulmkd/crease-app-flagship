import { redirect } from "next/navigation";

import { AUTH_ROUTES } from "@/constants/auth";

/** Entry → splash → auth flow or dashboard */
export default function RootPage() {
  redirect(AUTH_ROUTES.splash);
}
