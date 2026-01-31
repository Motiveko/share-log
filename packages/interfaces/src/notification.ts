import { NotificationType } from "./notification-setting";

// Notification data structure
export interface NotificationData {
  landingUrl?: string;
  mobileUrl?: string;
  entityId?: number;
  entityType?: string;
}

// Notification interface
export interface Notification {
  id: number;
  userId: number;
  workspaceId?: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: NotificationData;
  createdAt: Date;
}

// Response types
export interface NotificationResponse {
  id: number;
  userId: number;
  workspaceId?: number;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  data?: NotificationData;
  createdAt: string;
}

export interface NotificationListResponse {
  notifications: NotificationResponse[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface UnreadExistsResponse {
  hasUnread: boolean;
}
