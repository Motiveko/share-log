import { NotificationType } from "@repo/entities/notification-setting";
import { NotificationData } from "@repo/entities/notification";
import { Config } from "@/config/env";
import {
  LogEventPayload,
  AdjustmentEventPayload,
  MemberEventPayload,
  WorkspaceEventPayload,
} from "@/message-builder";

/**
 * NotificationType별 landing URL을 생성하는 빌더
 */
export class LandingUrlBuilder {
  private static baseUrl = Config.APP_BASE_URL;

  /**
   * 알림 타입과 페이로드로 NotificationData 생성
   */
  static build(
    notificationType: NotificationType,
    payload: WorkspaceEventPayload
  ): NotificationData {
    const workspaceId = payload.workspaceId;

    switch (notificationType) {
      case NotificationType.LOG_CREATED:
      case NotificationType.LOG_DELETED:
        return this.buildLogLanding(workspaceId, payload as LogEventPayload);

      case NotificationType.ADJUSTMENT_CREATED:
      case NotificationType.ADJUSTMENT_COMPLETED:
        return this.buildAdjustmentLanding(
          workspaceId,
          payload as AdjustmentEventPayload
        );

      case NotificationType.MEMBER_JOINED:
      case NotificationType.MEMBER_LEFT:
      case NotificationType.ROLE_CHANGED:
        return this.buildMemberLanding(workspaceId);

      case NotificationType.WORKSPACE_DELETED:
        return this.buildHomeLanding();

      default:
        return this.buildDefaultLanding(workspaceId);
    }
  }

  /**
   * 로그 관련 알림 landing URL
   */
  private static buildLogLanding(
    workspaceId: number,
    payload: LogEventPayload
  ): NotificationData {
    return {
      landingUrl: `${this.baseUrl}/workspace/${workspaceId}`,
      entityId: payload.logId,
      entityType: "log",
    };
  }

  /**
   * 정산 관련 알림 landing URL
   */
  private static buildAdjustmentLanding(
    workspaceId: number,
    payload: AdjustmentEventPayload
  ): NotificationData {
    return {
      landingUrl: `${this.baseUrl}/workspace/${workspaceId}/adjustment/${payload.adjustmentId}`,
      entityId: payload.adjustmentId,
      entityType: "adjustment",
    };
  }

  /**
   * 멤버 관련 알림 landing URL
   */
  private static buildMemberLanding(workspaceId: number): NotificationData {
    return {
      landingUrl: `${this.baseUrl}/workspace/${workspaceId}/settings`,
      entityType: "member",
    };
  }

  /**
   * 기본 landing URL (워크스페이스 대시보드)
   */
  private static buildDefaultLanding(workspaceId: number): NotificationData {
    return {
      landingUrl: `${this.baseUrl}/workspace/${workspaceId}`,
    };
  }

  /**
   * 홈 landing URL (워크스페이스 삭제 시)
   */
  private static buildHomeLanding(): NotificationData {
    return {
      landingUrl: this.baseUrl,
    };
  }
}
