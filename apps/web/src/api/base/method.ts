import type {
  LogMethod,
  CreateMethodDto,
  UpdateMethodDto,
  DefaultMethodType,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

// Schemas
const MethodSchema: z.ZodType<LogMethod> = z.object({
  id: z.number(),
  workspaceId: z.number(),
  defaultType: z.enum(["credit_card", "debit_card", "cash"]).nullable().optional() as z.ZodType<DefaultMethodType | null | undefined>,
  name: z.string(),
  sortOrder: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Response Schemas
const CreateMethodResponseSchema: z.ZodType<DataAndMessageResponse<LogMethod>> = z.object({
  data: MethodSchema,
  message: z.string(),
});

const GetMethodsResponseSchema: z.ZodType<DataAndMessageResponse<LogMethod[]>> = z.object({
  data: z.array(MethodSchema),
  message: z.string(),
});

const UpdateMethodResponseSchema: z.ZodType<DataAndMessageResponse<LogMethod>> = z.object({
  data: MethodSchema,
  message: z.string(),
});

const DeleteMethodResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

// API Functions

/**
 * 수단 생성
 */
export const create = async (workspaceId: number, data: CreateMethodDto) => {
  const response = await baseHttpClient.post<typeof CreateMethodResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/methods`,
    {
      data,
      schema: CreateMethodResponseSchema,
    }
  );
  return response.data;
};

/**
 * 수단 목록 조회
 */
export const list = async (workspaceId: number) => {
  const response = await baseHttpClient.get<typeof GetMethodsResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/methods`,
    {
      schema: GetMethodsResponseSchema,
    }
  );
  return response.data;
};

/**
 * 수단 수정
 */
export const update = async (
  workspaceId: number,
  methodId: number,
  data: UpdateMethodDto
) => {
  const response = await baseHttpClient.patch<typeof UpdateMethodResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/methods/${methodId}`,
    {
      data,
      schema: UpdateMethodResponseSchema,
    }
  );
  return response.data;
};

/**
 * 수단 삭제
 */
export const remove = async (workspaceId: number, methodId: number) => {
  const response = await baseHttpClient.delete<typeof DeleteMethodResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/methods/${methodId}`,
    {
      schema: DeleteMethodResponseSchema,
    }
  );
  return response;
};
