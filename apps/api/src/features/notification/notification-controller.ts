import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { NotificationService } from "@api/features/notification/notification-service";
import {
  NotificationListResponseDto,
} from "@api/features/notification/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";
import type { NotificationListResponse, UnreadExistsResponse } from "@repo/interfaces";

interface NotificationIdParams {
  id: string;
}

interface ListQuery extends Record<string, string | undefined> {
  cursor?: string;
  limit?: string;
}

@singleton()
@Controller()
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  /**
   * GET /v1/notifications - 알림 목록 조회
   */
  async list(
    req: AuthenticatedTypedRequest<Record<string, never>, Record<string, never>, ListQuery>,
    res: TypedResponse<DataAndMessageResponse<NotificationListResponse>>
  ) {
    const { cursor, limit } = req.query;
    const parsedLimit = limit ? parseInt(limit, 10) : 20;

    const result = await this.notificationService.list(
      req.user.id,
      cursor,
      Math.min(parsedLimit, 50)
    );

    const dto = NotificationListResponseDto.create(
      result.notifications,
      result.nextCursor,
      result.hasMore
    );

    res.json({ message: "success", data: dto });
  }

  /**
   * GET /v1/notifications/unread-exists - 안 읽은 알림 존재 여부 확인
   */
  async checkUnread(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<UnreadExistsResponse>>
  ) {
    const hasUnread = await this.notificationService.hasUnread(req.user.id);
    res.json({ message: "success", data: { hasUnread } });
  }

  /**
   * PATCH /v1/notifications/:id/read - 알림 읽음 처리
   */
  async markAsRead(
    req: AuthenticatedTypedRequest<unknown, NotificationIdParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const notificationId = parseInt(req.params.id, 10);
    await this.notificationService.markAsRead(notificationId, req.user.id);
    res.json({ message: "알림을 읽음 처리했습니다." });
  }

  /**
   * PATCH /v1/notifications/read-all - 모든 알림 읽음 처리
   */
  async markAllAsRead(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<{ count: number }>>
  ) {
    const count = await this.notificationService.markAllAsRead(req.user.id);
    res.json({ message: "모든 알림을 읽음 처리했습니다.", data: { count } });
  }
}
