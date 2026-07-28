import type { NotificationType } from "@/constants/domain/enums";
import type {
  IsoDateTime,
  JsonValue,
  NotificationId,
  ProfileId,
  TeamId,
} from "@/types/common";

export type Notification = {
  id: NotificationId;
  teamId: TeamId | null;
  userId: ProfileId | null;
  type: NotificationType;
  title: string;
  body: string;
  data: JsonValue;
  readAt: IsoDateTime | null;
  createdAt: IsoDateTime;
};
