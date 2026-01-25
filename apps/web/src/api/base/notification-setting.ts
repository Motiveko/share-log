import type {
  NotificationSettingResponse,
  UpdateNotificationSettingDto,
  NotificationType,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse } from "@web/api/types";

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

const NotificationSettingSchema: z.ZodType<NotificationSettingResponse> =
  z.object({
    id: z.number(),
    workspaceId: z.number(),
    userId: z.number(),
    webPushEnabled: z.boolean(),
    slackEnabled: z.boolean(),
    enabledTypes: z.array(NotificationTypeSchema),
  });

// Response Schemas
const GetNotificationSettingResponseSchema: z.ZodType<
  DataAndMessageResponse<NotificationSettingResponse>
> = z.object({
  data: NotificationSettingSchema,
  message: z.string(),
});

const UpdateNotificationSettingResponseSchema: z.ZodType<
  DataAndMessageResponse<NotificationSettingResponse>
> = z.object({
  data: NotificationSettingSchema,
  message: z.string(),
});

// API Functions

/**
 * 알림 설정 조회
 */
export const get = async (workspaceId: number) => {
  const response = await baseHttpClient.get<
    typeof GetNotificationSettingResponseSchema
  >(`/api/v1/workspaces/${workspaceId}/notification-settings`, {
    schema: GetNotificationSettingResponseSchema,
  });
  return response.data;
};

/**
 * 알림 설정 수정
 */
export const update = async (
  workspaceId: number,
  data: UpdateNotificationSettingDto
) => {
  const response = await baseHttpClient.patch<
    typeof UpdateNotificationSettingResponseSchema
  >(`/api/v1/workspaces/${workspaceId}/notification-settings`, {
    data,
    schema: UpdateNotificationSettingResponseSchema,
  });
  return response.data;
};
