/**
 * Seed Ranches Thunders — Admin + Player memberships for local OTP testing.
 *
 * Usage: npm run seed:dev
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Apply MVP migrations first (team row is seeded by SQL).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, "dev-seed.json"), "utf8"),
);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function upsertAuthUser(persona) {
  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw listError;

  const existing = listed.users.find(
    (u) => u.phone === persona.phone || u.email === persona.email,
  );

  const metadata = {
    full_name: persona.fullName,
    name: persona.fullName,
    role: persona.membershipRole,
  };

  if (existing) {
    const { data, error } = await admin.auth.admin.updateUserById(existing.id, {
      phone: persona.phone,
      email: persona.email,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (error) throw error;
    return data.user;
  }

  const { data, error } = await admin.auth.admin.createUser({
    phone: persona.phone,
    email: persona.email,
    phone_confirm: true,
    email_confirm: true,
    user_metadata: metadata,
  });
  if (error) throw error;
  return data.user;
}

async function ensureMembership(teamId, userId, role) {
  const { data: existing } = await admin
    .from("team_memberships")
    .select("*")
    .eq("team_id", teamId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from("team_memberships")
      .update({
        role,
        status: "active",
        joined_at: existing.joined_at ?? new Date().toISOString(),
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await admin
    .from("team_memberships")
    .insert({
      team_id: teamId,
      user_id: userId,
      role,
      status: "active",
      joined_at: new Date().toISOString(),
    })
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

async function main() {
  console.log("Seeding Ranches Thunders…");

  const teamId = fixture.team.id;

  const { data: team, error: teamLookupError } = await admin
    .from("teams")
    .select("id, name, slug")
    .eq("id", teamId)
    .maybeSingle();
  if (teamLookupError) throw teamLookupError;

  if (!team) {
    const { error: teamError } = await admin.from("teams").insert({
      id: teamId,
      name: fixture.team.name,
      slug: fixture.team.slug,
      carpool_fee_inr: 100,
    });
    if (teamError) throw teamError;
  }
  console.log(`  team: ${fixture.team.name}`);

  const { error: fundError } = await admin
    .from("team_fund_accounts")
    .upsert({ team_id: teamId, balance_inr: 0 }, { onConflict: "team_id" });
  if (fundError) throw fundError;
  console.log("  fund: account ready");

  for (const persona of fixture.personas) {
    const user = await upsertAuthUser(persona);
    console.log(`  auth: ${persona.fullName} (${persona.phone})`);

    const { error: profileError } = await admin.from("profiles").upsert(
      {
        id: user.id,
        phone: persona.phone,
        full_name: persona.fullName,
        profile_completed_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (profileError) throw profileError;

    await ensureMembership(teamId, user.id, persona.membershipRole);
    console.log(`  member: ${persona.fullName} (${persona.membershipRole})`);
  }

  console.log("\nDone. Login with any of:");
  for (const p of fixture.personas) {
    console.log(`  ${p.localPhone}  OTP ${fixture.otp}  (${p.fullName})`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
