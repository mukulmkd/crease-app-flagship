import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    "src/app/**/*.{ts,tsx}",
    "worker/index.ts",
    "supabase/functions/**/*.ts",
    "scripts/**/*.{js,mjs,cjs,ts}",
  ],
  project: [
    "src/**/*.{ts,tsx}",
    "worker/**/*.{ts,tsx}",
    "supabase/functions/**/*.ts",
    "scripts/**/*.{js,mjs,cjs,ts}",
  ],
  ignore: [
    // Schema-backed audit model kept for a future audit UI; DB table remains.
    "src/types/models/audit.ts",
  ],
  ignoreDependencies: [
    // CLI / design-system toolchain (not imported from app TS).
    "shadcn",
    // Pulled in via CSS `@import` (knip does not follow CSS).
    "tw-animate-css",
    "tailwindcss",
  ],
  ignoreIssues: {
    // shadcn primitives export a full API surface by design.
    "src/components/ui/**": ["exports", "types", "duplicates"],
    // Const arrays primarily exist to derive union types.
    "src/constants/domain/enums.ts": ["exports", "types"],
    // Presentational *Props types are part of the component API.
    "src/components/**": ["types"],
    "src/features/**": ["types"],
  },
};

export default config;
