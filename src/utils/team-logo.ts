import { isSupabaseConfigured, getPublicEnv } from "@/lib/env";

export const TEAM_LOGOS_BUCKET = "team-logos";

/**
 * Resolve a stored team logo path (or legacy absolute URL) to a browser URL.
 */
export function resolveTeamLogoUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = pathOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (!isSupabaseConfigured()) return null;
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${TEAM_LOGOS_BUCKET}/${value}`;
}

/**
 * Extract a storage object path from logo_url for deletion.
 * Returns null for external URLs we do not own.
 */
export function teamLogoStoragePath(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = pathOrUrl.trim();
  if (!/^https?:\/\//i.test(value)) return value;
  const marker = `/object/public/${TEAM_LOGOS_BUCKET}/`;
  const index = value.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(value.slice(index + marker.length));
}
