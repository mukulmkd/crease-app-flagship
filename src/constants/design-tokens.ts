/**
 * Design tokens mirrored from Google Stitch
 * Project: Crease Cricket Team Management — projects/5487252279778690236
 * Canonical DS: Modern Cricket Club ROUND_EIGHT
 * Asset: assets/11807811405223687109
 */

export const brandColors = {
  primary: "#0b5d2a",
  primaryContainer: "#0f7a38",
  onPrimaryContainer: "#ffffff",
  surfaceTint: "#0b5d2a",
  urgency: "#c83e35",
  secondaryContainer: "#f4d8d3",
  /** Electric lime — selected/positive accents only. */
  tertiary: "#c9f64b",
  tertiaryContainer: "#dff995",
  /** Theme / PWA meta */
  themeLight: "#0b5d2a",
  themeDark: "#082417",
  splash: "#f5f2e8",
} as const;

/** Tailwind class tokens for Stitch type roles */
export const typography = {
  display: "font-heading text-display font-extrabold uppercase tracking-tight",
  headline: "font-heading text-headline font-bold uppercase tracking-[-0.01em]",
  title: "font-heading text-title font-bold uppercase tracking-[-0.01em]",
  body: "text-body font-normal",
  bodySm: "text-body-sm font-normal",
  label: "text-label font-semibold",
  caption: "text-caption font-semibold tracking-[0.04em]",
  overline: "text-caption font-semibold uppercase tracking-[0.12em]",
  /** Dense metrics / scoreboard figures */
  statValue: "font-heading text-stat font-bold tracking-tight tabular-nums",
  navLabel: "text-caption font-semibold tracking-[0.02em]",
} as const;
