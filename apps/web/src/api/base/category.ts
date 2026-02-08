import type {
  LogCategory,
  CreateCategoryDto,
  UpdateCategoryDto,
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
  color: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

// Response Schemas
const CreateCategoryResponseSchema: z.ZodType<DataAndMessageResponse<LogCategory>> = z.object({
  data: CategorySchema,
  message: z.string(),
});

const GetCategoriesResponseSchema: z.ZodType<DataAndMessageResponse<LogCategory[]>> = z.object({
  data: z.array(CategorySchema),
  message: z.string(),
});

const UpdateCategoryResponseSchema: z.ZodType<DataAndMessageResponse<LogCategory>> = z.object({
  data: CategorySchema,
  message: z.string(),
});

const DeleteCategoryResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

// API Functions

/**
 * 카테고리 생성
 */
export const create = async (workspaceId: number, data: CreateCategoryDto) => {
  const response = await baseHttpClient.post<typeof CreateCategoryResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/categories`,
    {
      data,
      schema: CreateCategoryResponseSchema,
    }
  );
  return response.data;
};

/**
 * 카테고리 목록 조회
 */
export const list = async (workspaceId: number) => {
  const response = await baseHttpClient.get<typeof GetCategoriesResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/categories`,
    {
      schema: GetCategoriesResponseSchema,
    }
  );
  return response.data;
};

/**
 * 카테고리 수정
 */
export const update = async (
  workspaceId: number,
  categoryId: number,
  data: UpdateCategoryDto
) => {
  const response = await baseHttpClient.patch<typeof UpdateCategoryResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/categories/${categoryId}`,
    {
      data,
      schema: UpdateCategoryResponseSchema,
    }
  );
  return response.data;
};

/**
 * 카테고리 삭제
 */
export const remove = async (workspaceId: number, categoryId: number) => {
  const response = await baseHttpClient.delete<typeof DeleteCategoryResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/categories/${categoryId}`,
    {
      schema: DeleteCategoryResponseSchema,
    }
  );
  return response;
};
