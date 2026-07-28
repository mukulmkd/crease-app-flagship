import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/middleware";

/**
 * Next.js 16+ network boundary (formerly middleware).
 * Keeps Supabase auth cookies fresh before SSR.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icons/|manifest.webmanifest|sw.js|workbox-.*|fallback-.*|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
