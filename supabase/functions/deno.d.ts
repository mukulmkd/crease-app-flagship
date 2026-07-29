// Edge Functions run on Deno, but the repo's TypeScript server is configured for
// the Next.js app. These ambient shims let the editor read these files without a
// Deno toolchain; they are never bundled or deployed.

declare const Deno: {
  env: { get(key: string): string | undefined };
  serve(handler: (req: Request) => Response | Promise<Response>): void;
};

declare module "https://esm.sh/@supabase/supabase-js@2.49.1" {
  export * from "@supabase/supabase-js";
}
