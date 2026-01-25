import { singleton } from "tsyringe";
import { NotificationSetting, NotificationType } from "@repo/entities/notification-setting";
import { NotificationSettingRepository } from "./notification-setting-repository";
import { UpdateNotificationSettingRequestDto } from "./dto";

@singleton()
export class NotificationSettingService {
  constructor(
    private readonly notificationSettingRepository: NotificationSettingRepository
  ) {}

  /**
   * 워크스페이스의 사용자 알림 설정 조회 (없으면 기본값으로 생성)
   */
  async getOrCreate(
    workspaceId: number,
    userId: number
  ): Promise<NotificationSetting> {
    let setting = await this.notificationSettingRepository.findByWorkspaceAndUser(
      workspaceId,
      userId
    );

    if (!setting) {
      setting = new NotificationSetting();
      setting.workspaceId = workspaceId;
      setting.userId = userId;
      setting.webPushEnabled = true;
      setting.slackEnabled = false;
      setting.enabledTypes = Object.values(NotificationType);

      setting = await this.notificationSettingRepository.save(setting);
    }

    return setting;
  }

  /**
   * 알림 설정 수정
   */
  async update(
    workspaceId: number,
    userId: number,
    updateDto: UpdateNotificationSettingRequestDto
  ): Promise<NotificationSetting> {
    const setting = await this.getOrCreate(workspaceId, userId);

    if (updateDto.webPushEnabled !== undefined) {
      setting.webPushEnabled = updateDto.webPushEnabled;
    }

    if (updateDto.slackEnabled !== undefined) {
      setting.slackEnabled = updateDto.slackEnabled;
    }

    if (updateDto.enabledTypes !== undefined) {
      setting.enabledTypes = updateDto.enabledTypes;
    }

    return this.notificationSettingRepository.save(setting);
  }

  /**
   * 멤버 참여 시 기본 알림 설정 생성
   */
  async createDefaultForMember(
    workspaceId: number,
    userId: number
  ): Promise<NotificationSetting> {
    return this.getOrCreate(workspaceId, userId);
  }
}
