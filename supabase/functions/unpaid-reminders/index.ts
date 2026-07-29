import { requireCronSecret } from "../_shared/cron.ts";

Deno.serve(async (req) => {
  const denied = requireCronSecret(req);
  if (denied) return denied;

  // Deprecated: the product sends exactly one payment notification from the
  // Sunday weekend-settlement Cron. Keep this endpoint inert for safe rollback.
  return new Response(JSON.stringify({ reminded: 0, disabled: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
