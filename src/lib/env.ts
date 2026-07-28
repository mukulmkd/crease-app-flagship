import { z } from "zod";

/**
 * Environment configuration — public (browser-safe) vs server-only secrets.
 * Never put service-role keys in NEXT_PUBLIC_* vars.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function readPublicRaw() {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
}

function isPlaceholderSupabase(
  url: string | undefined,
  key: string | undefined,
) {
  return (
    !url || !key || url.includes("your-project") || key === "your-anon-key"
  );
}

/** True when real public Supabase credentials are present. */
export function isSupabaseConfigured(): boolean {
  const raw = readPublicRaw();
  if (
    isPlaceholderSupabase(
      raw.NEXT_PUBLIC_SUPABASE_URL,
      raw.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  ) {
    return false;
  }
  return publicEnvSchema.safeParse(raw).success;
}

/** Throws when public Supabase env is missing or still placeholder. */
export function assertSupabaseConfigured(): void {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.",
    );
  }
}

export function getPublicEnv(): PublicEnv {
  const parsed = publicEnvSchema.safeParse(readPublicRaw());
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables:\n${parsed.error.issues
        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }
  if (
    isPlaceholderSupabase(
      parsed.data.NEXT_PUBLIC_SUPABASE_URL,
      parsed.data.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    )
  ) {
    throw new Error(
      "Supabase env still uses placeholder values. Update .env.local with project credentials.",
    );
  }
  return parsed.data;
}

/** @deprecated Prefer getPublicEnv() */
export function env(): PublicEnv {
  return getPublicEnv();
}

/**
 * Server-only env. Call exclusively from Server Components, Route Handlers,
 * Server Actions, or Node scripts — never from Client Components.
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    ...readPublicRaw(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    LOG_LEVEL: process.env.LOG_LEVEL,
  });

  if (!parsed.success) {
    throw new Error(
      `Invalid server environment variables:\n${parsed.error.issues
        .map((issue) => `- ${issue.path.join(".")}: ${issue.message}`)
        .join("\n")}`,
    );
  }

  return parsed.data;
}

export function hasServiceRoleKey(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
