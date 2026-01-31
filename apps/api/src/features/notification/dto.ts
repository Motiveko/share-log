import { Expose, instanceToPlain } from "class-transformer";
import type {
  NotificationResponse,
  NotificationListResponse,
  NotificationData,
} from "@repo/interfaces";
import type { NotificationType } from "@repo/entities/notification-setting";
import type { Notification } from "@repo/entities/notification";

export class NotificationResponseDto implements NotificationResponse {
  @Expose()
  id: number;

  @Expose()
  userId: number;

  @Expose()
  workspaceId?: number;

  @Expose()
  type: NotificationType;

  @Expose()
  title: string;

  @Expose()
  body: string;

  @Expose()
  isRead: boolean;

  @Expose()
  data?: NotificationData;

  @Expose()
  createdAt: string;

  static fromEntity(entity: Notification): NotificationResponseDto {
    const dto = new NotificationResponseDto();
    dto.id = entity.id;
    dto.userId = entity.userId;
    dto.workspaceId = entity.workspaceId;
    dto.type = entity.type;
    dto.title = entity.title;
    dto.body = entity.body;
    dto.isRead = entity.isRead;
    dto.data = entity.data;
    dto.createdAt = entity.createdAt.toISOString();
    return dto;
  }

  static fromEntities(entities: Notification[]): NotificationResponseDto[] {
    return entities.map((e) => NotificationResponseDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class NotificationListResponseDto implements NotificationListResponse {
  @Expose()
  notifications: NotificationResponseDto[];

  @Expose()
  nextCursor?: string;

  @Expose()
  hasMore: boolean;

  static create(
    notifications: Notification[],
    nextCursor?: string,
    hasMore: boolean = false
  ): NotificationListResponseDto {
    const dto = new NotificationListResponseDto();
    dto.notifications = NotificationResponseDto.fromEntities(notifications);
    dto.nextCursor = nextCursor;
    dto.hasMore = hasMore;
    return dto;
  }

  toJSON() {
    return instanceToPlain(this);
  }
}
