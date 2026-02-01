// Notification Setting interfaces

export enum NotificationType {
  LOG_CREATED = "log_created",
  LOG_DELETED = "log_deleted",
  ROLE_CHANGED = "role_changed",
  ADJUSTMENT_CREATED = "adjustment_created",
  ADJUSTMENT_COMPLETED = "adjustment_completed",
  MEMBER_JOINED = "member_joined",
  MEMBER_LEFT = "member_left",
  WORKSPACE_DELETED = "workspace_deleted",
}

export interface NotificationSetting {
  id: number;
  workspaceId: number;
  userId: number;
  webPushEnabled: boolean;
  slackEnabled: boolean;
  enabledTypes: NotificationType[];
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface UpdateNotificationSettingDto {
  webPushEnabled?: boolean;
  slackEnabled?: boolean;
  enabledTypes?: NotificationType[];
}

// Response types
export interface NotificationSettingResponse {
  id: number;
  workspaceId: number;
  userId: number;
  webPushEnabled: boolean;
  slackEnabled: boolean;
  enabledTypes: NotificationType[];
}
