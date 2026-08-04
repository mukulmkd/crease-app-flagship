/** Local preference: push is on by default; players may opt out. */

const STORAGE_KEY = "crease.push.optOut";

export function isPushOptedOut(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Persist explicit opt-out (or clear it when re-enabling). */
export function setPushOptedOut(optedOut: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (optedOut) {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Private mode / blocked storage — preference is best-effort.
  }
}
