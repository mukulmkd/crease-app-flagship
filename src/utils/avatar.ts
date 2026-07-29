import { isSupabaseConfigured, getPublicEnv } from "@/lib/env";

export const AVATARS_BUCKET = "avatars";

/**
 * Resolve a stored avatar path (or legacy absolute URL) to a browser-usable URL.
 */
export function resolveAvatarUrl(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = pathOrUrl.trim();
  if (/^https?:\/\//i.test(value)) return value;
  if (!isSupabaseConfigured()) return null;
  const { NEXT_PUBLIC_SUPABASE_URL } = getPublicEnv();
  return `${NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${AVATARS_BUCKET}/${value}`;
}

/**
 * Extract a storage object path from an avatar_url value for deletion.
 * Returns null for external URLs we do not own.
 */
export function avatarStoragePath(
  pathOrUrl: string | null | undefined,
): string | null {
  if (!pathOrUrl?.trim()) return null;
  const value = pathOrUrl.trim();
  if (!/^https?:\/\//i.test(value)) return value;
  const marker = `/object/public/${AVATARS_BUCKET}/`;
  const index = value.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(value.slice(index + marker.length));
}
