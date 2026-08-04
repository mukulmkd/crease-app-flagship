/**
 * Crease design tokens — Modern Scorebook Utility (Ink + Amber)
 * Docs: docs/UI.md
 */

export const brandColors = {
  primary: "#1a1a1a",
  primaryContainer: "#2e2e2e",
  onPrimaryContainer: "#ffffff",
  surfaceTint: "#1a1a1a",
  urgency: "#c44b42",
  secondaryContainer: "#d8d8d6",
  /** Amber — selected/positive accents only. */
  tertiary: "#e0b84a",
  tertiaryContainer: "#f5e6c0",
  /** Theme / PWA meta */
  themeLight: "#1a1a1a",
  /** Neutral Night chrome — PWA theme-color in dark */
  themeDark: "#0c0e0d",
  splash: "#f2f2f1",
  clubhouse: "#0a0c0b",
} as const;

/**
 * Runtime semantic colors resolve to the CSS custom properties in globals.css.
 * Keep theme values in CSS; TypeScript consumers should use these references.
 */
export const semanticColors = {
  background: "var(--background)",
  foreground: "var(--foreground)",
  primary: "var(--primary)",
  primaryForeground: "var(--primary-foreground)",
  secondary: "var(--secondary)",
  secondaryForeground: "var(--secondary-foreground)",
  tertiary: "var(--tertiary)",
  tertiaryForeground: "var(--tertiary-foreground)",
  destructive: "var(--destructive)",
  destructiveForeground: "var(--destructive-foreground)",
  success: "var(--success)",
  warning: "var(--warning)",
  info: "var(--info)",
  muted: "var(--muted)",
  mutedForeground: "var(--muted-foreground)",
  accent: "var(--accent)",
  accentForeground: "var(--accent-foreground)",
  border: "var(--border)",
  ring: "var(--ring)",
  clubhouse: "var(--clubhouse)",
  surface: {
    base: "var(--surface)",
    dim: "var(--surface-dim)",
    bright: "var(--surface-bright)",
    lowest: "var(--surface-container-lowest)",
    low: "var(--surface-container-low)",
    container: "var(--surface-container)",
    high: "var(--surface-container-high)",
    highest: "var(--surface-container-highest)",
  },
} as const;

/** Tailwind class tokens for Modern Scorebook Utility type roles. */
export const typography = {
  display: "font-heading text-display font-bold tracking-tight",
  headline: "font-heading text-headline font-semibold tracking-[-0.01em]",
  title: "font-heading text-title font-semibold tracking-[-0.01em]",
  body: "text-body font-normal",
  bodySm: "text-body-sm font-normal",
  label: "text-label font-semibold",
  caption: "text-caption font-semibold tracking-[0.02em]",
  overline: "text-caption font-semibold uppercase tracking-[0.1em]",
  /** Dense metrics / scoreboard figures */
  statValue: "font-heading text-stat font-semibold tracking-tight tabular-nums",
  navLabel: "text-caption font-semibold tracking-[0.02em]",
} as const;

/** 4px base scale, matching the `--spacing-ds-*` theme tokens. */
export const spacing = {
  0: "0px",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
} as const;

export const radii = {
  sm: "0.25rem",
  md: "0.5rem",
  lg: "0.75rem",
  xl: "1rem",
  "2xl": "1.5rem",
  "3xl": "1.75rem",
  "4xl": "2rem",
  default: "var(--radius)",
} as const;

export const motion = {
  duration: {
    fast: "120ms",
    default: "200ms",
    sheet: "220ms",
  },
  easing: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
  },
} as const;

export const geometry = {
  touchTarget: "3rem",
  contentMaxWidth: "72rem",
  bottomNavHeight: "var(--bottom-nav-height)",
  bottomNavInset: "var(--bottom-nav-inset)",
  pushBannerHeight: "var(--push-banner-height)",
  toastBottomOffset: "var(--toast-bottom-offset)",
  keyboardInset: "var(--keyboard-inset)",
  sheetMaxHeight: "var(--sheet-max-height)",
} as const;

/** The only elevated brand surface is the dominant match ticket. */
export const elevation = {
  ticket: "var(--shadow-ticket)",
} as const;
