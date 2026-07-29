/**
 * Design tokens mirrored from Google Stitch
 * Project: Crease Cricket Team Management — projects/5487252279778690236
 * Canonical DS: Modern Cricket Club ROUND_EIGHT
 * Asset: assets/11807811405223687109
 */

export const stitchProject = {
  id: "5487252279778690236",
  name: "projects/5487252279778690236",
  title: "Crease Cricket Team Management",
  designSystem: "Modern Cricket Club",
  designSystemAssetId: "11807811405223687109",
  roundness: "ROUND_EIGHT",
} as const;

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

export const radii = {
  sm: "0.25rem",
  DEFAULT: "0.5rem",
  md: "0.75rem",
  lg: "1rem",
  xl: "1.5rem",
  full: "9999px",
} as const;

export const spacing = {
  base: "4px",
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "24px",
  xl: "32px",
  "2xl": "48px",
  stackSm: "8px",
  stackMd: "16px",
  stackLg: "24px",
  gutter: "16px",
  marginMobile: "16px",
  marginDesktop: "24px",
  touchTarget: "48px",
  listRow: "56px",
  /** Mirrors --bottom-nav-height in globals.css (row + home-indicator inset). */
  bottomNavRow: "64px",
  bottomNavMinInset: "12px",
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

/**
 * M3 tonal elevation — prefer surface tone shifts over heavy shadows.
 * Level 0 = background, 1 = cards, 2 = hover/FAB, 3 = dialogs.
 */
export const elevation = {
  level0: "bg-background",
  level1: "bg-surface-container-low",
  level2: "bg-surface-container",
  level3: "bg-surface-container-high",
  hero: "bg-primary/8 dark:bg-primary/15",
} as const;

export const motion = {
  standardMs: 200,
  complexMs: 300,
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
  skeletonCycleMs: 2000,
} as const;

export const touchTarget = {
  min: "3rem", // 48px — Stitch Modern Cricket Club
} as const;
