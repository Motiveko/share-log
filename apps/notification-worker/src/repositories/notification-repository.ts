import { Repository, LessThan } from "typeorm";
import { singleton } from "tsyringe";
import { Notification, NotificationData } from "@repo/entities/notification";
import { NotificationType } from "@repo/entities/notification-setting";
import { DataSource } from "@/datasource";

export interface CreateNotificationParams {
  userId: number;
  workspaceId?: number;
  type: NotificationType;
  title: string;
  body: string;
  data?: NotificationData;
}

@singleton()
export class NotificationRepository extends Repository<Notification> {
  constructor(dataSource: DataSource) {
    super(Notification, dataSource.createEntityManager());
  }

  /**
   * 알림 생성
   */
  async createNotification(params: CreateNotificationParams): Promise<Notification> {
    const notification = this.create({
      userId: params.userId,
      workspaceId: params.workspaceId,
      type: params.type,
      title: params.title,
      body: params.body,
      data: params.data,
      isRead: false,
    });
    return this.save(notification);
  }

  /**
   * 여러 사용자에게 동일한 알림 생성
   */
  async createNotifications(
    userIds: number[],
    workspaceId: number | undefined,
    type: NotificationType,
    title: string,
    body: string,
    data?: NotificationData
  ): Promise<Notification[]> {
    if (userIds.length === 0) {
      return [];
    }

    const notifications = userIds.map((userId) =>
      this.create({
        userId,
        workspaceId,
        type,
        title,
        body,
        data,
        isRead: false,
      })
    );

    return this.save(notifications);
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
