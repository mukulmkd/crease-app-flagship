import type { AuditAction } from "@/constants/domain/enums";
import type {
  Brand,
  IsoDateTime,
  JsonValue,
  ProfileId,
  TeamId,
} from "@/types/common";

type AuditLogId = Brand<string, "AuditLogId">;

export type AuditLog = {
  id: AuditLogId;
  teamId: TeamId | null;
  actorId: ProfileId | null;
  action: AuditAction;
  entityType: string;
  entityId: string | null;
  metadata: JsonValue;
  createdAt: IsoDateTime;
};
