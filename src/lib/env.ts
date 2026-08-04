import { z } from "zod";

/**
 * Environment configuration — public (browser-safe) vs server-only secrets.
 * Never put service-role keys in NEXT_PUBLIC_* vars.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().min(1).optional(),
});

const serverEnvSchema = publicEnvSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  VAPID_PRIVATE_KEY: z.string().min(1).optional(),
  VAPID_SUBJECT: z.string().min(1).optional(),
  CRON_SECRET: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).optional(),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

function readPublicRaw() {
  return {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
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

/**
 * Server-only env. Call exclusively from Server Components, Route Handlers,
 * Server Actions, or Node scripts — never from Client Components.
 */
export function getServerEnv(): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    ...readPublicRaw(),
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
    CRON_SECRET: process.env.CRON_SECRET,
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

/** True when VAPID public + private keys are configured for Web Push. */
export function isWebPushConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() &&
    process.env.VAPID_PRIVATE_KEY?.trim(),
  );
}
