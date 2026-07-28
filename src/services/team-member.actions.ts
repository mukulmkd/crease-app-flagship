"use server";

import { MVP_TEAM } from "@/constants/domain/enums";
import { addTeamMemberSchema } from "@/lib/validations/identity";
import { createAdminSupabaseClient } from "@/lib/supabase/admin";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AppError } from "@/lib/errors";
import type { AddTeamMemberDto } from "@/types/dto";
import type { TeamMembership } from "@/types/models";
import { mapTeamMembership } from "@/repositories/shared/mappers";

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+91${digits}`;
  if (digits.startsWith("91") && digits.length === 12) return `+${digits}`;
  if (phone.startsWith("+")) return phone;
  return `+${digits}`;
}

/**
 * Admin adds a player by phone.
 * Uses service role to create/find auth user, then membership under RLS-bypass.
 */
export async function addTeamMemberAction(
  input: AddTeamMemberDto,
): Promise<TeamMembership> {
  const parsed = addTeamMemberSchema.parse({
    ...input,
    teamId: MVP_TEAM.id,
  });
  const phone = normalizePhone(parsed.phone);

  const server = await createServerSupabaseClient();
  const {
    data: { user },
  } = await server.auth.getUser();
  if (!user) throw new AppError("UNAUTHORIZED", "Sign in required", 401);

  const { data: actorMembership, error: actorError } = await server
    .from("team_memberships")
    .select("role, status")
    .eq("team_id", MVP_TEAM.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (actorError) throw new AppError("INTERNAL", actorError.message, 500);
  if (
    !actorMembership ||
    actorMembership.status !== "active" ||
    actorMembership.role !== "admin"
  ) {
    throw new AppError("FORBIDDEN", "Admin role required", 403);
  }

  const admin = createAdminSupabaseClient();

  const { data: listed, error: listError } = await admin.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (listError) throw new AppError("INTERNAL", listError.message, 500);

  let target = listed.users.find((u) => u.phone === phone);

  if (!target) {
    const email = `${phone.replace(/\D/g, "")}@crease.players.local`;
    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        phone,
        email,
        phone_confirm: true,
        email_confirm: true,
        user_metadata: {
          full_name: parsed.fullName ?? null,
          name: parsed.fullName ?? null,
        },
      });
    if (createError) throw new AppError("INTERNAL", createError.message, 500);
    target = created.user;
  }

  if (!target) throw new AppError("INTERNAL", "Failed to resolve user", 500);

  await admin.from("profiles").upsert(
    {
      id: target.id,
      phone,
      full_name: parsed.fullName ?? target.user_metadata?.full_name ?? null,
    },
    { onConflict: "id" },
  );

  const { data: existing } = await admin
    .from("team_memberships")
    .select("*")
    .eq("team_id", MVP_TEAM.id)
    .eq("user_id", target.id)
    .maybeSingle();

  if (existing) {
    const { data, error } = await admin
      .from("team_memberships")
      .update({
        role: parsed.role ?? "player",
        status: "active",
      })
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) throw new AppError("INTERNAL", error.message, 500);
    return mapTeamMembership(data);
  }

  const { data, error } = await admin
    .from("team_memberships")
    .insert({
      team_id: MVP_TEAM.id,
      user_id: target.id,
      role: parsed.role ?? "player",
      status: "active",
    })
    .select("*")
    .single();
  if (error) throw new AppError("INTERNAL", error.message, 500);
  return mapTeamMembership(data);
}
