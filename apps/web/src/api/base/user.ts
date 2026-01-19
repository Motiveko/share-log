import type { User } from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse } from "@web/api/types";

const UserSchema: z.ZodType<User> = z.object({
  id: z.number(),
  email: z.string(),
  nickname: z.string().optional(),
  avatarUrl: z.string().optional(),
  slackWebhookUrl: z.string().optional(),
  isProfileComplete: z.boolean(),
  createdAt: z.coerce.date(),
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
