import { z } from "zod";
import type { Todo, CreateTodoDto } from "@repo/interfaces";
import type { DataAndMessageResponse } from "@web/api/types";
import { baseHttpClient } from "@web/api/http-client";

const TodoSchema: z.ZodType<Todo> = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  isDone: z.boolean(),
  createdAt: z.coerce.date(),
});

const ListApiResponseSchema: z.ZodType<DataAndMessageResponse<Todo[]>> =
  z.object({
    data: z.array(TodoSchema),
    message: z.string(),
  });

const CreateApiResponseSchema: z.ZodType<DataAndMessageResponse<Todo>> =
  z.object({
    data: TodoSchema,
    message: z.string(),
  });

export const list = async () => {
  const response = await baseHttpClient.get<typeof ListApiResponseSchema>(
    "/api/v1/todo",
    {
      schema: ListApiResponseSchema,
    }
  );
  return response.data;
};

export const create = async (body: CreateTodoDto) => {
  const response = await baseHttpClient.post<typeof CreateApiResponseSchema>(
    "/api/v1/todo",
    {
      schema: CreateApiResponseSchema,
      data: body,
    }
  );
  return response.data;
};

export const toggle = async (id: number) => {
  await baseHttpClient.post(`/api/v1/todo/${id}/toggle`);
};

const _delete = async (id: number) => {
  await baseHttpClient.delete(`/api/v1/todo/${id}`);
};

// delete 예약어 충돌 문제로 사용 불가능해서 별도 export 처리
export { _delete as delete };
