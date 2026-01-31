import { Notification } from "@repo/entities/notification";
import { Repository, LessThan } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class NotificationRepository extends Repository<Notification> {
  constructor(private dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  /**
   * 사용자의 알림 목록 조회 (커서 기반 페이지네이션)
   */
  async findByUserWithCursor(
    userId: number,
    cursor?: string,
    limit: number = 20
  ): Promise<{ notifications: Notification[]; nextCursor?: string; hasMore: boolean }> {
    const queryBuilder = this.createQueryBuilder("notification")
      .where("notification.userId = :userId", { userId })
      .orderBy("notification.createdAt", "DESC")
      .addOrderBy("notification.id", "DESC")
      .take(limit + 1);

    if (cursor) {
      const [timestamp, id] = cursor.split("_");
      const cursorDate = new Date(parseInt(timestamp, 10));
      const cursorId = parseInt(id, 10);

      queryBuilder.andWhere(
        "(notification.createdAt < :cursorDate OR (notification.createdAt = :cursorDate AND notification.id < :cursorId))",
        { cursorDate, cursorId }
      );
    }

    const notifications = await queryBuilder.getMany();
    const hasMore = notifications.length > limit;

    if (hasMore) {
      notifications.pop();
    }

    const lastNotification = notifications[notifications.length - 1];
    const nextCursor = hasMore && lastNotification
      ? `${lastNotification.createdAt.getTime()}_${lastNotification.id}`
      : undefined;

    return { notifications, nextCursor, hasMore };
  }

  /**
   * 안 읽은 알림 존재 여부 확인
   */
  async hasUnread(userId: number): Promise<boolean> {
    const count = await this.count({
      where: { userId, isRead: false },
    });
    return count > 0;
  }

  /**
   * 알림 읽음 처리
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const result = await this.update(
      { id: notificationId, userId },
      { isRead: true }
    );
    return (result.affected ?? 0) > 0;
  }

  /**
   * 사용자의 모든 알림 읽음 처리
   */
  async markAllAsRead(userId: number): Promise<number> {
    const result = await this.update(
      { userId, isRead: false },
      { isRead: true }
    );
    return result.affected ?? 0;
  }

  /**
   * 오래된 알림 삭제 (30일 이상)
   */
  async deleteOldNotifications(daysAgo: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    const result = await this.delete({
      createdAt: LessThan(cutoffDate),
    });
    return result.affected ?? 0;
  }
}
