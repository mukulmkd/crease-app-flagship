/**
 * Design tokens mirrored from Google Stitch
 * Project: Crease Cricket Team Management — projects/5487252279778690236
 * Canonical DS: Athletic Precision ROUND_EIGHT
 * Asset: assets/6d86c10d6d484fecb655a86c604b00bc
 *
 * Prefer ROUND_EIGHT over the ROUND_FOUR sibling asset — project theme
 * uses 8px default radius and leather-ball red as secondary/urgency.
 */

export const stitchProject = {
  id: "5487252279778690236",
  name: "projects/5487252279778690236",
  title: "Crease Cricket Team Management",
  designSystem: "Athletic Precision",
  designSystemAssetId: "6d86c10d6d484fecb655a86c604b00bc",
  roundness: "ROUND_EIGHT",
} as const;

export const brandColors = {
  /** Cricket pitch green (Stitch primary) */
  primary: "#0d631b",
  primaryContainer: "#2e7d32",
  onPrimaryContainer: "#cbffc2",
  surfaceTint: "#1b6d24",
  /** Leather ball red (Stitch secondary / urgency) */
  urgency: "#b51a1b",
  secondaryContainer: "#d93630",
  /** Tertiary grass green (supporting accents) */
  tertiary: "#1f6223",
  tertiaryContainer: "#3a7b39",
  /** Theme / PWA meta */
  themeLight: "#2e7d32",
  themeDark: "#0d631b",
  splash: "#f9f9f9",
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
} as const;

/** Tailwind class tokens for Stitch type roles */
export const typography = {
  display: "text-display font-bold tracking-tight",
  headline: "text-headline font-bold tracking-tight",
  title: "text-title font-medium tracking-tight",
  body: "text-body font-normal tracking-[0.5px]",
  bodySm: "text-body-sm font-normal tracking-[0.25px]",
  label: "text-label font-medium tracking-[0.1px]",
  caption: "text-caption font-medium tracking-[0.5px]",
  overline: "text-caption font-medium uppercase tracking-[0.5px]",
  /** Dense metrics / scoreboard figures */
  statValue: "text-stat font-bold tracking-tight",
  navLabel: "text-caption font-medium tracking-[0.5px]",
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
  min: "3rem", // 48px — Stitch Athletic Precision
} as const;
