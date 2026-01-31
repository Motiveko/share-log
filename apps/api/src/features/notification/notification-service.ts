import { singleton } from "tsyringe";
import { NotificationRepository } from "@api/features/notification/notification-repository";
import { NotFoundError } from "@api/errors/not-found";
import { ERROR_CODES } from "@repo/interfaces";

@singleton()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository
  ) {}

  /**
   * 알림 목록 조회 (커서 기반 페이지네이션)
   */
  async list(userId: number, cursor?: string, limit: number = 20) {
    return this.notificationRepository.findByUserWithCursor(userId, cursor, limit);
  }

  /**
   * 안 읽은 알림 존재 여부 확인
   */
  async hasUnread(userId: number): Promise<boolean> {
    return this.notificationRepository.hasUnread(userId);
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: number, userId: number): Promise<void> {
    const success = await this.notificationRepository.markAsRead(
      notificationId,
      userId
    );
    if (!success) {
      throw new NotFoundError(
        "알림을 찾을 수 없습니다.",
        ERROR_CODES.NOTIFICATION_NOT_FOUND
      );
    }
  }

  /**
   * 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: number): Promise<number> {
    return this.notificationRepository.markAllAsRead(userId);
  }
}
