import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { NotificationSettingService } from "./notification-setting-service";
import {
  NotificationSettingResponseDto,
  UpdateNotificationSettingRequestDto,
} from "./dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
} from "@api/types/express";

interface WorkspaceParams {
  workspaceId: string;
}

@singleton()
@Controller()
export class NotificationSettingController {
  constructor(
    private readonly notificationSettingService: NotificationSettingService
  ) {}

  /**
   * GET /v1/workspaces/:workspaceId/notification-settings
   * 알림 설정 조회
   */
  async get(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<NotificationSettingResponseDto>>
  ) {
    const workspaceId = parseInt(req.params.workspaceId, 10);
    const setting = await this.notificationSettingService.getOrCreate(
      workspaceId,
      req.user.id
    );
    const dto = NotificationSettingResponseDto.fromEntity(setting);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:workspaceId/notification-settings
   * 알림 설정 수정
   */
  @ValidateBody(UpdateNotificationSettingRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateNotificationSettingRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<NotificationSettingResponseDto>>
  ) {
    const workspaceId = parseInt(req.params.workspaceId, 10);
    const setting = await this.notificationSettingService.update(
      workspaceId,
      req.user.id,
      req.body
    );
    const dto = NotificationSettingResponseDto.fromEntity(setting);
    res.json({ message: "알림 설정이 수정되었습니다.", data: dto });
  }
}
