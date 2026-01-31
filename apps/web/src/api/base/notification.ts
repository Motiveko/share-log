import type {
  NotificationListResponse,
  NotificationResponse,
  UnreadExistsResponse,
  NotificationData,
} from "@repo/interfaces";
import type { NotificationType } from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

// Schemas
const NotificationTypeSchema = z.enum([
  "log_created",
  "log_deleted",
  "role_changed",
  "adjustment_created",
  "adjustment_completed",
  "member_joined",
  "member_left",
]) as z.ZodType<NotificationType>;

const NotificationDataSchema: z.ZodType<NotificationData> = z.object({
  landingUrl: z.string().optional(),
  mobileUrl: z.string().optional(),
  entityId: z.number().optional(),
  entityType: z.string().optional(),
});

const NotificationSchema: z.ZodType<NotificationResponse> = z.object({
  id: z.number(),
  userId: z.number(),
  workspaceId: z.number().optional(),
  type: NotificationTypeSchema,
  title: z.string(),
  body: z.string(),
  isRead: z.boolean(),
  data: NotificationDataSchema.optional(),
  createdAt: z.string(),
});

const NotificationListResponseSchema: z.ZodType<NotificationListResponse> =
  z.object({
    notifications: z.array(NotificationSchema),
    nextCursor: z.string().optional(),
    hasMore: z.boolean(),
  });

const UnreadExistsResponseSchema: z.ZodType<UnreadExistsResponse> = z.object({
  hasUnread: z.boolean(),
});

// Response Schemas
const ListNotificationsResponseSchema: z.ZodType<
  DataAndMessageResponse<NotificationListResponse>
> = z.object({
  data: NotificationListResponseSchema,
  message: z.string(),
});

const CheckUnreadResponseSchema: z.ZodType<
  DataAndMessageResponse<UnreadExistsResponse>
> = z.object({
  data: UnreadExistsResponseSchema,
  message: z.string(),
});

const MarkAsReadResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

const MarkAllAsReadResponseSchema: z.ZodType<
  DataAndMessageResponse<{ count: number }>
> = z.object({
  data: z.object({ count: z.number() }),
  message: z.string(),
});

// API Functions

/**
 * 알림 목록 조회 (커서 기반 페이지네이션)
 */
export const list = async (cursor?: string, limit: number = 20) => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  params.set("limit", String(limit));

  const response = await baseHttpClient.get<typeof ListNotificationsResponseSchema>(
    `/api/v1/notifications?${params.toString()}`,
    { schema: ListNotificationsResponseSchema }
  );
  return response.data;
};

/**
 * 안 읽은 알림 존재 여부 확인
 */
export const checkUnread = async () => {
  const response = await baseHttpClient.get<typeof CheckUnreadResponseSchema>(
    "/api/v1/notifications/unread-exists",
    { schema: CheckUnreadResponseSchema }
  );
  return response.data;
};

/**
 * 알림 읽음 처리
 */
export const markAsRead = async (id: number) => {
  const response = await baseHttpClient.patch<typeof MarkAsReadResponseSchema>(
    `/api/v1/notifications/${id}/read`,
    { schema: MarkAsReadResponseSchema }
  );
  return response;
};

/**
 * 모든 알림 읽음 처리
 */
export const markAllAsRead = async () => {
  const response = await baseHttpClient.patch<typeof MarkAllAsReadResponseSchema>(
    "/api/v1/notifications/read-all",
    { schema: MarkAllAsReadResponseSchema }
  );
  return response.data;
};
