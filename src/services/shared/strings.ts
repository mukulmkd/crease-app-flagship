/**
 * Pure string helpers for services — no I/O.
 */

export function slugify(input: string): string {
  const slug = input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return slug.length >= 2 ? slug : `team-${Date.now().toString(36)}`;
}

/** Short invite code — collision handled by caller / unique index. */
export function generateInviteCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}

export function uniqueSlug(base: string, suffix?: string): string {
  const root = slugify(base).slice(0, 48);
  if (!suffix) return root;
  return `${root}-${suffix}`.slice(0, 60);
}
