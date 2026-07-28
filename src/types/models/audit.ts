import type { AuditAction } from "@/constants/domain/enums";
import type {
  AuditLogId,
  IsoDateTime,
  JsonValue,
  ProfileId,
  TeamId,
} from "@/types/common";

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
