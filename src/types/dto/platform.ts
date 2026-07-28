import type { NotificationType } from "@/constants/domain/enums";
import type { IsoDateTime, JsonValue, ProfileId, TeamId } from "@/types/common";

export type CreateNotificationDto = {
  userId: ProfileId | string;
  teamId?: TeamId | string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: JsonValue;
};

export type MarkNotificationReadDto = {
  readAt?: IsoDateTime | null;
};

export type ListNotificationsQuery = {
  userId?: ProfileId | string;
  teamId?: TeamId | string;
  unreadOnly?: boolean;
  type?: NotificationType;
  limit?: number;
  cursor?: string;
};
