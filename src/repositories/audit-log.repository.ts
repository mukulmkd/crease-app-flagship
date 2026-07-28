import type { AuditAction } from "@/constants/domain/enums";
import { AppError } from "@/lib/errors";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import type { TypedSupabaseClient } from "@/lib/supabase/types";
import { BaseRepository } from "@/repositories/base.repository";
import { mapAuditLog } from "@/repositories/shared/mappers";
import type { RepositoryListParams } from "@/repositories/shared/pagination";
import type { TablesInsert } from "@/types/database";
import type {
  AuditLogId,
  IsoDateTime,
  Paginated,
  ProfileId,
  TeamId,
} from "@/types/common";
import type { AuditLog } from "@/types/models";

export type AuditLogListFilter = RepositoryListParams & {
  teamId?: TeamId | string;
  actorId?: ProfileId | string;
  entityType?: string;
  entityId?: string;
  action?: AuditAction;
  from?: IsoDateTime;
  to?: IsoDateTime;
};

export class AuditLogRepository extends BaseRepository {
  constructor(client: TypedSupabaseClient) {
    super(client);
  }

  async findById(id: AuditLogId | string): Promise<AuditLog | null> {
    const { data, error } = await this.client
      .from("audit_logs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    this.assertOk(error, "audit.findById");
    return data ? mapAuditLog(data) : null;
  }

  async list(filter: AuditLogListFilter = {}): Promise<Paginated<AuditLog>> {
    const { limit, offset, from, to } = this.pageRange(filter);
    const { column, ascending } = this.sort(filter, "created_at");

    let query = this.client.from("audit_logs").select("*");
    if (filter.teamId) query = query.eq("team_id", filter.teamId);
    if (filter.actorId) query = query.eq("actor_id", filter.actorId);
    if (filter.entityType) query = query.eq("entity_type", filter.entityType);
    if (filter.entityId) query = query.eq("entity_id", filter.entityId);
    if (filter.action) query = query.eq("action", filter.action);
    if (filter.from) query = query.gte("created_at", filter.from);
    if (filter.to) query = query.lte("created_at", filter.to);

    const { data, error } = await query
      .order(column, { ascending })
      .order("id", { ascending })
      .range(from, to);

    this.assertOk(error, "audit.list");
    return this.paginate((data ?? []).map(mapAuditLog), limit, offset);
  }

  async create(input: TablesInsert<"audit_logs">): Promise<AuditLog> {
    const { data, error } = await this.client
      .from("audit_logs")
      .insert(input)
      .select("*")
      .single();
    this.assertOk(error, "audit.create");
    if (!data) throw new AppError("NOT_FOUND", "audit.create: no row", 404);
    return mapAuditLog(data);
  }
}

export function createBrowserAuditLogRepository(): AuditLogRepository {
  return new AuditLogRepository(createBrowserSupabaseClient());
}
