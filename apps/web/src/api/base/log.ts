import type {
  LogWithRelations,
  LogListResponse,
  CreateLogDto,
  UpdateLogDto,
  LogListQuery,
  LogType,
  LogCategory,
  LogMethod,
  DefaultMethodType,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

// Schemas
const CategorySchema: z.ZodType<LogCategory> = z.object({
  id: z.number(),
  workspaceId: z.number(),
  name: z.string(),
  sortOrder: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const MethodSchema: z.ZodType<LogMethod> = z.object({
  id: z.number(),
  workspaceId: z.number(),
  defaultType: z.enum(["credit_card", "debit_card", "cash"]).nullable().optional() as z.ZodType<DefaultMethodType | null | undefined>,
  name: z.string(),
  sortOrder: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const LogWithRelationsSchema: z.ZodType<LogWithRelations> = z.object({
  id: z.number(),
  workspaceId: z.number(),
  type: z.enum(["expense", "income"]) as z.ZodType<LogType>,
  categoryId: z.number().nullable().optional(),
  methodId: z.number().nullable().optional(),
  date: z.coerce.date(),
  amount: z.number(),
  memo: z.string().nullable().optional(),
  userId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  category: CategorySchema.nullable().optional(),
  method: MethodSchema.nullable().optional(),
  user: z.object({
    id: z.number(),
    nickname: z.string().nullable().optional(),
    avatarUrl: z.string().optional(),
  }),
});

const LogListResponseSchema: z.ZodType<LogListResponse> = z.object({
  logs: z.array(LogWithRelationsSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

// Response Schemas
const CreateLogResponseSchema: z.ZodType<DataAndMessageResponse<LogWithRelations>> = z.object({
  data: LogWithRelationsSchema,
  message: z.string(),
});

const GetLogsResponseSchema: z.ZodType<DataAndMessageResponse<LogListResponse>> = z.object({
  data: LogListResponseSchema,
  message: z.string(),
});

const UpdateLogResponseSchema: z.ZodType<DataAndMessageResponse<LogWithRelations>> = z.object({
  data: LogWithRelationsSchema,
  message: z.string(),
});

const DeleteLogResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

// API Functions

/**
 * 로그 생성
 */
export const create = async (workspaceId: number, data: CreateLogDto) => {
  const response = await baseHttpClient.post<typeof CreateLogResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/logs`,
    {
      data,
      schema: CreateLogResponseSchema,
    }
  );
  return response.data;
};

/**
 * 로그 목록 조회
 */
export const list = async (workspaceId: number, query?: LogListQuery) => {
  const params = new URLSearchParams();
  if (query?.startDate) params.set("startDate", query.startDate);
  if (query?.endDate) params.set("endDate", query.endDate);
  if (query?.type) params.set("type", query.type);
  if (query?.userId) params.set("userId", String(query.userId));
  if (query?.categoryId) params.set("categoryId", String(query.categoryId));
  if (query?.methodId) params.set("methodId", String(query.methodId));
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));

  const queryString = params.toString();
  const url = `/api/v1/workspaces/${workspaceId}/logs${queryString ? `?${queryString}` : ""}`;

  const response = await baseHttpClient.get<typeof GetLogsResponseSchema>(url, {
    schema: GetLogsResponseSchema,
  });
  return response.data;
};

/**
 * 로그 수정
 */
export const update = async (
  workspaceId: number,
  logId: number,
  data: UpdateLogDto
) => {
  const response = await baseHttpClient.patch<typeof UpdateLogResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/logs/${logId}`,
    {
      data,
      schema: UpdateLogResponseSchema,
    }
  );
  return response.data;
};

/**
 * 로그 삭제
 */
export const remove = async (workspaceId: number, logId: number) => {
  const response = await baseHttpClient.delete<typeof DeleteLogResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/logs/${logId}`,
    {
      schema: DeleteLogResponseSchema,
    }
  );
  return response;
};
