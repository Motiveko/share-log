import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { NotificationSetting, NotificationType } from "@repo/entities/notification-setting";
import { DataSource } from "@/datasource";

@singleton()
export class NotificationSettingRepository extends Repository<NotificationSetting> {
  constructor(dataSource: DataSource) {
    super(NotificationSetting, dataSource.createEntityManager());
  }

  /**
   * 특정 워크스페이스에서 특정 알림 타입이 활성화된 멤버들의 설정 조회
   * @param workspaceId 워크스페이스 ID
   * @param notificationType 알림 타입
   * @param excludeUserId 제외할 유저 ID (이벤트 발생자)
   */
  async findEnabledMembersForNotification(
    workspaceId: number,
    notificationType: NotificationType,
    excludeUserId?: number
  ): Promise<NotificationSetting[]> {
    const qb = this.createQueryBuilder("ns")
      .innerJoinAndSelect("ns.user", "user")
      .where("ns.workspaceId = :workspaceId", { workspaceId })
      .andWhere("ns.enabledTypes @> :notificationType", {
        notificationType: JSON.stringify([notificationType]),
      });

    if (excludeUserId !== undefined) {
      qb.andWhere("ns.userId != :excludeUserId", { excludeUserId });
    }

    return qb.getMany();
  }

  /**
   * 웹 푸시 알림이 활성화된 멤버들 조회
   */
  async findWebPushEnabledMembers(
    workspaceId: number,
    notificationType: NotificationType,
    excludeUserId?: number
  ): Promise<NotificationSetting[]> {
    const settings = await this.findEnabledMembersForNotification(
      workspaceId,
      notificationType,
      excludeUserId
    );
    return settings.filter((s) => s.webPushEnabled);
  }

  /**
   * Slack 알림이 활성화된 멤버들 조회
   */
  async findSlackEnabledMembers(
    workspaceId: number,
    notificationType: NotificationType,
    excludeUserId?: number
  ): Promise<NotificationSetting[]> {
    const settings = await this.findEnabledMembersForNotification(
      workspaceId,
      notificationType,
      excludeUserId
    );
    return settings.filter((s) => s.slackEnabled && s.user.slackWebhookUrl);
  }
}
