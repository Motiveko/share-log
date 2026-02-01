import { NotificationType } from "@repo/entities/notification-setting";

export interface NotificationMessage {
  title: string;
  body: string;
}

export interface LogEventPayload {
  workspaceId: number;
  workspaceName: string;
  userId: number;
  userNickname: string;
  logId: number;
  amount: number;
  memo?: string;
  categoryName?: string;
}

export interface AdjustmentEventPayload {
  workspaceId: number;
  workspaceName: string;
  userId: number;
  userNickname: string;
  adjustmentId: number;
  title: string;
  totalAmount: number;
}

export interface MemberEventPayload {
  workspaceId: number;
  workspaceName: string;
  userId: number;
  userNickname: string;
  targetUserId?: number;
  targetUserNickname?: string;
  newRole?: string;
}

export interface WorkspaceDeletedEventPayload {
  workspaceId: number;
  workspaceName: string;
  recipientIds: number[];
}

export type WorkspaceEventPayload =
  | LogEventPayload
  | AdjustmentEventPayload
  | MemberEventPayload
  | WorkspaceDeletedEventPayload;

const MESSAGE_TEMPLATES: Record<
  NotificationType,
  { title: string; body: string }
> = {
  [NotificationType.LOG_CREATED]: {
    title: "[{{workspaceName}}] 새 지출/수입 등록",
    body: "{{userNickname}}님이 {{amount}}원을 등록했습니다.",
  },
  [NotificationType.LOG_DELETED]: {
    title: "[{{workspaceName}}] 지출/수입 삭제",
    body: "{{userNickname}}님이 {{amount}}원 기록을 삭제했습니다.",
  },
  [NotificationType.ADJUSTMENT_CREATED]: {
    title: "[{{workspaceName}}] 새 정산 생성",
    body: "{{userNickname}}님이 '{{title}}' 정산을 생성했습니다.",
  },
  [NotificationType.ADJUSTMENT_COMPLETED]: {
    title: "[{{workspaceName}}] 정산 완료",
    body: "'{{title}}' 정산이 완료되었습니다.",
  },
  [NotificationType.MEMBER_JOINED]: {
    title: "[{{workspaceName}}] 새 멤버 참여",
    body: "{{userNickname}}님이 워크스페이스에 참여했습니다.",
  },
  [NotificationType.MEMBER_LEFT]: {
    title: "[{{workspaceName}}] 멤버 탈퇴",
    body: "{{userNickname}}님이 워크스페이스를 나갔습니다.",
  },
  [NotificationType.ROLE_CHANGED]: {
    title: "[{{workspaceName}}] 권한 변경",
    body: "{{targetUserNickname}}님의 권한이 {{newRole}}(으)로 변경되었습니다.",
  },
  [NotificationType.WORKSPACE_DELETED]: {
    title: "워크스페이스 삭제됨",
    body: "'{{workspaceName}}' 워크스페이스가 삭제되었습니다.",
  },
};

/**
 * 알림 메시지 빌더
 * 이벤트 타입과 페이로드를 기반으로 알림 메시지 생성
 */
export class MessageBuilder {
  /**
   * 알림 타입과 페이로드로 메시지 생성
   */
  static build(
    notificationType: NotificationType,
    payload: WorkspaceEventPayload
  ): NotificationMessage {
    const template = MESSAGE_TEMPLATES[notificationType];
    if (!template) {
      return {
        title: "알림",
        body: "새로운 알림이 있습니다.",
      };
    }

    return {
      title: this.interpolate(template.title, payload),
      body: this.interpolate(template.body, payload),
    };
  }

  /**
   * Slack 메시지 포맷으로 변환
   */
  static buildSlackMessage(
    notificationType: NotificationType,
    payload: WorkspaceEventPayload
  ): string {
    const message = this.build(notificationType, payload);
    return `*${message.title}*\n${message.body}`;
  }

  /**
   * 템플릿 문자열에서 {{key}} 형태의 플레이스홀더를 실제 값으로 치환
   */
  private static interpolate(
    template: string,
    values: WorkspaceEventPayload
  ): string {
    const record = values as unknown as Record<string, unknown>;
    return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
      const value = record[key];
      if (value === undefined || value === null) {
        return "";
      }
      if (typeof value === "number") {
        return value.toLocaleString("ko-KR");
      }
      return String(value);
    });
  }
}
