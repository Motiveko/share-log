import { Expose, instanceToPlain, plainToInstance } from "class-transformer";
import { IsBoolean, IsOptional, IsArray, IsEnum } from "class-validator";
import {
  NotificationSetting as NotificationSettingInterface,
  NotificationSettingResponse,
  UpdateNotificationSettingDto as UpdateNotificationSettingDtoInterface,
  NotificationType,
} from "@repo/interfaces";
import { NotificationSetting } from "@repo/entities/notification-setting";

export class NotificationSettingResponseDto implements NotificationSettingResponse {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  userId: number;

  @Expose()
  webPushEnabled: boolean;

  @Expose()
  slackEnabled: boolean;

  @Expose()
  enabledTypes: NotificationType[];

  static fromEntity(entity: NotificationSetting) {
    return plainToInstance(NotificationSettingResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class UpdateNotificationSettingRequestDto
  implements UpdateNotificationSettingDtoInterface
{
  @IsOptional()
  @IsBoolean({ message: "webPushEnabled는 boolean 타입이어야 합니다." })
  webPushEnabled?: boolean;

  @IsOptional()
  @IsBoolean({ message: "slackEnabled는 boolean 타입이어야 합니다." })
  slackEnabled?: boolean;

  @IsOptional()
  @IsArray({ message: "enabledTypes는 배열이어야 합니다." })
  @IsEnum(NotificationType, {
    each: true,
    message: "유효한 알림 타입을 입력해주세요.",
  })
  enabledTypes?: NotificationType[];
}
