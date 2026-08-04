import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import {
  mapSettlementCharge,
  mapSettlementOrganizerPayout,
  mapSettlementReimbursement,
  mapWeekendSettlement,
} from "@/repositories/shared/mappers";
import type { TablesInsert, TablesUpdate } from "@/types/database";
import type { Paginated, TeamId } from "@/types/common";
import type {
  ChargeStatus,
  ReimbursementStatus,
} from "@/constants/domain/enums";
import type {
  SettlementCharge,
  SettlementOrganizerPayout,
  SettlementReimbursement,
  WeekendSettlement,
} from "@/types/models";

/**
 * Weekend settlements and per-player charges — CRUD only.
 */
export class PaymentRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async findSettlementByWeek(
    teamId: TeamId | string,
    weekStartDate: string,
  ): Promise<WeekendSettlement | null> {
    const { data, error } = await this.client
      .from("weekend_settlements")
      .select("*")
      .eq("team_id", teamId)
      .eq("week_start_date", weekStartDate)
      .maybeSingle();
    this.assertOk(error, "settlement.findByWeek");
    return data ? mapWeekendSettlement(data) : null;
  }

  async findSettlementById(id: string): Promise<WeekendSettlement | null> {
    const { data, error } = await this.client
      .from("weekend_settlements")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "settlement.findById");
    return data ? mapWeekendSettlement(data) : null;
  }

  async findSettlementByIdOrThrow(id: string): Promise<WeekendSettlement> {
    const row = await this.findSettlementById(id);
    if (!row) throw new AppError("NOT_FOUND", "Settlement not found", 404);
    return row;
  }

  async createSettlement(
    input: TablesInsert<"weekend_settlements">,
  ): Promise<WeekendSettlement> {
    const { data, error } = await this.client
      .from("weekend_settlements")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "settlement.create");
    return mapWeekendSettlement(this.requireData(data, "settlement.create"));
  }

  async updateSettlement(
    id: string,
    input: TablesUpdate<"weekend_settlements">,
  ): Promise<WeekendSettlement> {
    const { data, error } = await this.client
      .from("weekend_settlements")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "settlement.update");
    return mapWeekendSettlement(this.requireData(data, "settlement.update"));
  }

  async listChargesForSettlement(
    settlementId: string,
  ): Promise<SettlementCharge[]> {
    const { data, error } = await this.client
      .from("settlement_charges")
      .select("*")
      .eq("settlement_id", settlementId)
      .order("created_at", { ascending: true });
    this.assertOk(error, "charge.listForSettlement");
    return (data ?? []).map(mapSettlementCharge);
  }

  async listChargesByMatch(matchId: string): Promise<SettlementCharge[]> {
    const { data, error } = await this.client
      .from("settlement_charges")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: true });
    this.assertOk(error, "charge.listByMatch");
    return (data ?? []).map(mapSettlementCharge);
  }

  async listChargesForUser(
    teamId: TeamId | string,
    userId: string,
    status?: ChargeStatus,
  ): Promise<SettlementCharge[]> {
    let query = this.client
      .from("settlement_charges")
      .select("*")
      .eq("team_id", teamId)
      .eq("user_id", userId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query.order("created_at", {
      ascending: false,
    });
    this.assertOk(error, "charge.listForUser");
    return (data ?? []).map(mapSettlementCharge);
  }

  async listTeamCharges(
    teamId: TeamId | string,
    status?: ChargeStatus,
  ): Promise<SettlementCharge[]> {
    let query = this.client
      .from("settlement_charges")
      .select("*")
      .eq("team_id", teamId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(200);
    this.assertOk(error, "charge.listTeam");
    return (data ?? []).map(mapSettlementCharge);
  }

  async findChargeById(id: string): Promise<SettlementCharge | null> {
    const { data, error } = await this.client
      .from("settlement_charges")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "charge.findById");
    return data ? mapSettlementCharge(data) : null;
  }

  async findChargeByIdOrThrow(id: string): Promise<SettlementCharge> {
    const row = await this.findChargeById(id);
    if (!row) throw new AppError("NOT_FOUND", "Charge not found", 404);
    return row;
  }

  /**
   * Regeneration write. Settled rows are protected in the statement itself —
   * an app-level read-then-write check could clobber a payment that lands
   * between the read and the update.
   */
  async upsertCharge(
    input: TablesInsert<"settlement_charges">,
  ): Promise<SettlementCharge> {
    const existing = await this.findChargeByMatchUser(
      String(input.match_id),
      String(input.user_id),
    );

    if (existing) {
      if (existing.status !== "pending") return existing;

      const { data, error } = await this.client
        .from("settlement_charges")
        .update(input)
        .eq("id", String(existing.id))
        .eq("status", "pending")
        .select("*")
        .maybeSingle();
      this.assertOk(error, "charge.upsert.update");
      if (data) return mapSettlementCharge(data);
      // Paid concurrently — keep the settled row.
      return this.findChargeByIdOrThrow(String(existing.id));
    }

    const { data, error } = await this.client
      .from("settlement_charges")
      .upsert(input, { onConflict: "match_id,user_id" })
      .select("*")
      .single();
    this.assertOk(error, "charge.upsert");
    return mapSettlementCharge(this.requireData(data, "charge.upsert"));
  }

  async findChargeByMatchUser(
    matchId: string,
    userId: string,
  ): Promise<SettlementCharge | null> {
    const { data, error } = await this.client
      .from("settlement_charges")
      .select("*")
      .eq("match_id", matchId)
      .eq("user_id", userId)
      .maybeSingle();
    this.assertOk(error, "charge.findByMatchUser");
    return data ? mapSettlementCharge(data) : null;
  }

  /** Delete pending charges for a match whose players are no longer in the squad. */
  async deletePendingOrphanCharges(
    matchId: string,
    keepUserIds: string[],
  ): Promise<void> {
    const keep = new Set(keepUserIds);
    const charges = await this.listChargesByMatch(matchId);
    const orphanIds = charges
      .filter(
        (charge) =>
          charge.status === "pending" && !keep.has(String(charge.userId)),
      )
      .map((charge) => String(charge.id));
    if (orphanIds.length === 0) return;

    const { error } = await this.client
      .from("settlement_charges")
      .delete()
      .in("id", orphanIds);
    this.assertOk(error, "charge.deletePendingOrphans");
  }

  async updateCharge(
    id: string,
    input: TablesUpdate<"settlement_charges">,
  ): Promise<SettlementCharge> {
    const { data, error } = await this.client
      .from("settlement_charges")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "charge.update");
    return mapSettlementCharge(this.requireData(data, "charge.update"));
  }

  /**
   * One statement for a whole weekend payment, so a player's match lines can
   * never end up half paid. Only rows still pending are touched.
   */
  async updatePendingCharges(
    ids: string[],
    input: TablesUpdate<"settlement_charges">,
  ): Promise<SettlementCharge[]> {
    if (ids.length === 0) return [];
    const { data, error } = await this.client
      .from("settlement_charges")
      .update(input)
      .in("id", ids)
      .eq("status", "pending")
      .select("*");
    this.assertOk(error, "charge.updatePendingMany");
    return (data ?? []).map(mapSettlementCharge);
  }

  async listOpenSettlements(
    teamId: TeamId | string,
  ): Promise<Paginated<WeekendSettlement>> {
    const { data, error } = await this.client
      .from("weekend_settlements")
      .select("*")
      .eq("team_id", teamId)
      .in("status", ["open", "collecting"])
      .order("week_start_date", { ascending: false })
      .limit(10);
    this.assertOk(error, "settlement.listOpen");
    return this.paginate((data ?? []).map(mapWeekendSettlement), 10, 0);
  }

  async listReimbursementsForSettlement(
    settlementId: string,
  ): Promise<SettlementReimbursement[]> {
    const { data, error } = await this.client
      .from("settlement_reimbursements")
      .select("*")
      .eq("settlement_id", settlementId)
      .order("created_at", { ascending: true });
    this.assertOk(error, "reimbursement.listForSettlement");
    return (data ?? []).map(mapSettlementReimbursement);
  }

  async listTeamReimbursements(
    teamId: TeamId | string,
    status?: ReimbursementStatus,
  ): Promise<SettlementReimbursement[]> {
    let query = this.client
      .from("settlement_reimbursements")
      .select("*")
      .eq("team_id", teamId);
    if (status) query = query.eq("status", status);
    const { data, error } = await query
      .order("created_at", { ascending: false })
      .limit(200);
    this.assertOk(error, "reimbursement.listTeam");
    return (data ?? []).map(mapSettlementReimbursement);
  }

  async findReimbursementById(
    id: string,
  ): Promise<SettlementReimbursement | null> {
    const { data, error } = await this.client
      .from("settlement_reimbursements")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "reimbursement.findById");
    return data ? mapSettlementReimbursement(data) : null;
  }

  async findReimbursementByIdOrThrow(
    id: string,
  ): Promise<SettlementReimbursement> {
    const row = await this.findReimbursementById(id);
    if (!row) throw new AppError("NOT_FOUND", "Reimbursement not found", 404);
    return row;
  }

  async upsertReimbursement(
    input: TablesInsert<"settlement_reimbursements">,
  ): Promise<SettlementReimbursement> {
    const { data: existing } = await this.client
      .from("settlement_reimbursements")
      .select("*")
      .eq("settlement_id", input.settlement_id)
      .eq("user_id", input.user_id)
      .maybeSingle();

    if (
      existing &&
      (existing.status === "paid" || existing.status === "offline_paid")
    ) {
      return mapSettlementReimbursement(existing);
    }

    const { data, error } = await this.client
      .from("settlement_reimbursements")
      .upsert(input, { onConflict: "settlement_id,user_id" })
      .select("*")
      .single();
    this.assertOk(error, "reimbursement.upsert");
    return mapSettlementReimbursement(
      this.requireData(data, "reimbursement.upsert"),
    );
  }

  async updateReimbursement(
    id: string,
    input: TablesUpdate<"settlement_reimbursements">,
  ): Promise<SettlementReimbursement> {
    const { data, error } = await this.client
      .from("settlement_reimbursements")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "reimbursement.update");
    return mapSettlementReimbursement(
      this.requireData(data, "reimbursement.update"),
    );
  }

  async deletePendingOrphanReimbursements(
    settlementId: string,
    keepUserIds: string[],
  ): Promise<void> {
    const keep = new Set(keepUserIds);
    const rows = await this.listReimbursementsForSettlement(settlementId);
    const orphanIds = rows
      .filter(
        (row) => row.status === "pending" && !keep.has(String(row.userId)),
      )
      .map((row) => String(row.id));
    if (orphanIds.length === 0) return;

    const { error } = await this.client
      .from("settlement_reimbursements")
      .delete()
      .in("id", orphanIds);
    this.assertOk(error, "reimbursement.deletePendingOrphans");
  }

  async listOrganizerPayoutsForSettlement(
    settlementId: string,
  ): Promise<SettlementOrganizerPayout[]> {
    const { data, error } = await this.client
      .from("settlement_organizer_payouts")
      .select("*")
      .eq("settlement_id", settlementId)
      .order("created_at", { ascending: true });
    this.assertOk(error, "organizerPayout.listForSettlement");
    return (data ?? []).map(mapSettlementOrganizerPayout);
  }

  async findOrganizerPayoutById(
    id: string,
  ): Promise<SettlementOrganizerPayout | null> {
    const { data, error } = await this.client
      .from("settlement_organizer_payouts")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "organizerPayout.findById");
    return data ? mapSettlementOrganizerPayout(data) : null;
  }

  async findOrganizerPayoutByIdOrThrow(
    id: string,
  ): Promise<SettlementOrganizerPayout> {
    const row = await this.findOrganizerPayoutById(id);
    if (!row) {
      throw new AppError("NOT_FOUND", "Organizer payout not found", 404);
    }
    return row;
  }

  async createOrganizerPayout(
    input: TablesInsert<"settlement_organizer_payouts">,
  ): Promise<SettlementOrganizerPayout> {
    const { data, error } = await this.client
      .from("settlement_organizer_payouts")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "organizerPayout.create");
    return mapSettlementOrganizerPayout(
      this.requireData(data, "organizerPayout.create"),
    );
  }

  async updateOrganizerPayout(
    id: string,
    input: TablesUpdate<"settlement_organizer_payouts">,
  ): Promise<SettlementOrganizerPayout> {
    const { data, error } = await this.client
      .from("settlement_organizer_payouts")
      .update(input)
      .eq("id", id)
      .select("*")
      .single();
    this.assertOk(error, "organizerPayout.update");
    return mapSettlementOrganizerPayout(
      this.requireData(data, "organizerPayout.update"),
    );
  }

  async deletePendingOrganizerPayouts(settlementId: string): Promise<void> {
    const { error } = await this.client
      .from("settlement_organizer_payouts")
      .delete()
      .eq("settlement_id", settlementId)
      .eq("status", "pending");
    this.assertOk(error, "organizerPayout.deletePending");
  }
}

export function createBrowserPaymentRepository(): PaymentRepository {
  return new PaymentRepository(createBrowserSupabaseClient());
}
