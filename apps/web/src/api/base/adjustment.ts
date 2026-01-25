import type {
  AdjustmentWithCreator,
  AdjustmentListResponse,
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
  AdjustmentListQuery,
  AdjustmentStatus,
  AdjustmentResult,
  UserExpense,
  TransferInfo,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

// Schemas
const TransferInfoSchema: z.ZodType<TransferInfo> = z.object({
  fromUserId: z.number(),
  fromUserNickname: z.string(),
  toUserId: z.number(),
  toUserNickname: z.string(),
  amount: z.number(),
});

const UserExpenseSchema: z.ZodType<UserExpense> = z.object({
  userId: z.number(),
  nickname: z.string(),
  totalExpense: z.number(),
  shouldPay: z.number(),
  difference: z.number(),
});

const AdjustmentResultSchema: z.ZodType<AdjustmentResult> = z.object({
  totalExpense: z.number(),
  perPersonAmount: z.number(),
  userExpenses: z.array(UserExpenseSchema),
  transfers: z.array(TransferInfoSchema),
});

const AdjustmentWithCreatorSchema: z.ZodType<AdjustmentWithCreator> = z.object({
  id: z.number(),
  workspaceId: z.number(),
  name: z.string(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  categoryIds: z.array(z.number()),
  methodIds: z.array(z.number()),
  participantIds: z.array(z.number()),
  status: z.enum(["created", "completed"]) as z.ZodType<AdjustmentStatus>,
  result: AdjustmentResultSchema.optional(),
  creatorId: z.number(),
  completedAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  creator: z.object({
    id: z.number(),
    nickname: z.string().nullable().optional(),
    avatarUrl: z.string().optional(),
  }),
});

const AdjustmentListResponseSchema: z.ZodType<AdjustmentListResponse> = z.object({
  adjustments: z.array(AdjustmentWithCreatorSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  hasMore: z.boolean(),
});

// Response Schemas
const CreateAdjustmentResponseSchema: z.ZodType<DataAndMessageResponse<AdjustmentWithCreator>> = z.object({
  data: AdjustmentWithCreatorSchema,
  message: z.string(),
});

const GetAdjustmentsResponseSchema: z.ZodType<DataAndMessageResponse<AdjustmentListResponse>> = z.object({
  data: AdjustmentListResponseSchema,
  message: z.string(),
});

const GetAdjustmentResponseSchema: z.ZodType<DataAndMessageResponse<AdjustmentWithCreator>> = z.object({
  data: AdjustmentWithCreatorSchema,
  message: z.string(),
});

const UpdateAdjustmentResponseSchema: z.ZodType<DataAndMessageResponse<AdjustmentWithCreator>> = z.object({
  data: AdjustmentWithCreatorSchema,
  message: z.string(),
});

const DeleteAdjustmentResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

const CompleteAdjustmentResponseSchema: z.ZodType<DataAndMessageResponse<AdjustmentWithCreator>> = z.object({
  data: AdjustmentWithCreatorSchema,
  message: z.string(),
});

// API Functions

/**
 * 정산 생성
 */
export const create = async (workspaceId: number, data: CreateAdjustmentDto) => {
  const response = await baseHttpClient.post<typeof CreateAdjustmentResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/adjustments`,
    {
      data,
      schema: CreateAdjustmentResponseSchema,
    }
  );
  return response.data;
};

/**
 * 정산 목록 조회
 */
export const list = async (workspaceId: number, query?: AdjustmentListQuery) => {
  const params = new URLSearchParams();
  if (query?.status) params.set("status", query.status);
  if (query?.page) params.set("page", String(query.page));
  if (query?.limit) params.set("limit", String(query.limit));

  const queryString = params.toString();
  const url = `/api/v1/workspaces/${workspaceId}/adjustments${queryString ? `?${queryString}` : ""}`;

  const response = await baseHttpClient.get<typeof GetAdjustmentsResponseSchema>(url, {
    schema: GetAdjustmentsResponseSchema,
  });
  return response.data;
};

/**
 * 정산 상세 조회
 */
export const get = async (workspaceId: number, adjustmentId: number) => {
  const response = await baseHttpClient.get<typeof GetAdjustmentResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/adjustments/${adjustmentId}`,
    {
      schema: GetAdjustmentResponseSchema,
    }
  );
  return response.data;
};

/**
 * 정산 수정
 */
export const update = async (
  workspaceId: number,
  adjustmentId: number,
  data: UpdateAdjustmentDto
) => {
  const response = await baseHttpClient.patch<typeof UpdateAdjustmentResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/adjustments/${adjustmentId}`,
    {
      data,
      schema: UpdateAdjustmentResponseSchema,
    }
  );
  return response.data;
};

/**
 * 정산 삭제
 */
export const remove = async (workspaceId: number, adjustmentId: number) => {
  const response = await baseHttpClient.delete<typeof DeleteAdjustmentResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/adjustments/${adjustmentId}`,
    {
      schema: DeleteAdjustmentResponseSchema,
    }
  );
  return response;
};

/**
 * 정산 완료 처리
 */
export const complete = async (workspaceId: number, adjustmentId: number) => {
  const response = await baseHttpClient.post<typeof CompleteAdjustmentResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/adjustments/${adjustmentId}/complete`,
    {
      schema: CompleteAdjustmentResponseSchema,
    }
  );
  return response.data;
};
