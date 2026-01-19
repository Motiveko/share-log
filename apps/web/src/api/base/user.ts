import type { User, PatchUserDto, SearchUser } from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

const UserSchema: z.ZodType<User> = z.object({
  id: z.number(),
  email: z.string(),
  nickname: z.string().optional().nullable(),
  avatarUrl: z.string().optional(),
  slackWebhookUrl: z.string().optional().nullable(),
  isProfileComplete: z.boolean(),
  createdAt: z.coerce.date(),
});

const SearchUserSchema: z.ZodType<SearchUser> = z.object({
  id: z.number(),
  email: z.string(),
  nickname: z.string().optional(),
  avatarUrl: z.string().optional(),
});

export const logout = async () => {
  await baseHttpClient.post("/api/v1/auth/logout");
};

const GetUserResponseSchema: z.ZodType<DataAndMessageResponse<User>> = z.object(
  {
    data: UserSchema,
    message: z.string(),
  }
);

export const get = async () => {
  const response = await baseHttpClient.get<typeof GetUserResponseSchema>(
    "/api/v1/user",
    {
      schema: GetUserResponseSchema,
    }
  );

  return response.data;
};

const PatchUserResponseSchema: z.ZodType<DataAndMessageResponse<User>> =
  z.object({
    data: UserSchema,
    message: z.string(),
  });

export const patch = async (data: PatchUserDto) => {
  const response = await baseHttpClient.patch<typeof PatchUserResponseSchema>(
    "/api/v1/user",
    {
      data,
      schema: PatchUserResponseSchema,
    }
  );

  return response.data;
};

const DeleteUserResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

export const deleteAccount = async () => {
  const response = await baseHttpClient.delete<typeof DeleteUserResponseSchema>(
    "/api/v1/user",
    {
      schema: DeleteUserResponseSchema,
    }
  );

  return response;
};

const SearchUserResponseSchema: z.ZodType<DataAndMessageResponse<SearchUser[]>> =
  z.object({
    data: z.array(SearchUserSchema),
    message: z.string(),
  });

export const search = async (query: string) => {
  const response = await baseHttpClient.get<typeof SearchUserResponseSchema>(
    `/api/v1/users/search?q=${encodeURIComponent(query)}`,
    {
      schema: SearchUserResponseSchema,
    }
  );

  return response.data;
};
