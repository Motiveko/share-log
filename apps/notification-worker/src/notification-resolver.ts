import { singleton } from "tsyringe";
import { NotificationType } from "@repo/entities/notification-setting";
import { NotificationSettingRepository } from "@/repositories/notification-setting-repository";

export interface NotificationRecipient {
  userId: number;
  email?: string;
  nickname?: string | null;
  slackWebhookUrl?: string | null;
  webPushEnabled: boolean;
  slackEnabled: boolean;
}

/**
 * 알림 수신자를 결정하는 서비스
 * 워크스페이스 멤버의 알림 설정에 따라 수신자 목록을 반환
 */
@singleton()
export class NotificationResolver {
  constructor(
    private readonly notificationSettingRepository: NotificationSettingRepository
  ) {}

  /**
   * 웹 푸시 알림 수신자 조회
   */
  async getWebPushRecipients(
    workspaceId: number,
    notificationType: NotificationType,
    excludeUserId?: number
  ): Promise<NotificationRecipient[]> {
    const settings =
      await this.notificationSettingRepository.findWebPushEnabledMembers(
        workspaceId,
        notificationType,
        excludeUserId
      );

    return settings.map((setting) => ({
      userId: setting.userId,
      email: setting.user.email,
      nickname: setting.user.nickname,
      slackWebhookUrl: setting.user.slackWebhookUrl,
      webPushEnabled: setting.webPushEnabled,
      slackEnabled: setting.slackEnabled,
    }));
  }

  /**
   * Slack 알림 수신자 조회
   */
  async getSlackRecipients(
    workspaceId: number,
    notificationType: NotificationType,
    excludeUserId?: number
  ): Promise<NotificationRecipient[]> {
    const settings =
      await this.notificationSettingRepository.findSlackEnabledMembers(
        workspaceId,
        notificationType,
        excludeUserId
      );

    return settings.map((setting) => ({
      userId: setting.userId,
      email: setting.user.email,
      nickname: setting.user.nickname,
      slackWebhookUrl: setting.user.slackWebhookUrl,
      webPushEnabled: setting.webPushEnabled,
      slackEnabled: setting.slackEnabled,
    }));
  }

  /**
   * 모든 알림 수신자 조회 (웹 푸시 + Slack)
   */
  async getAllRecipients(
    workspaceId: number,
    notificationType: NotificationType,
    excludeUserId?: number
  ): Promise<{
    webPushRecipients: NotificationRecipient[];
    slackRecipients: NotificationRecipient[];
  }> {
    const [webPushRecipients, slackRecipients] = await Promise.all([
      this.getWebPushRecipients(workspaceId, notificationType, excludeUserId),
      this.getSlackRecipients(workspaceId, notificationType, excludeUserId),
    ]);

    return { webPushRecipients, slackRecipients };
  }
}
