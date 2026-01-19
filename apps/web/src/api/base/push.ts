import { z } from "zod";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";
import { baseHttpClient } from "@web/api/http-client";

export interface VapidPublicKeyResponse {
  publicKey: string;
}

const VapidPublicKeyResponseSchema: z.ZodType<
  DataAndMessageResponse<VapidPublicKeyResponse>
> = z.object({
  data: z.object({
    publicKey: z.string(),
  }),
  message: z.string(),
});

const MessageResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

const SendTestResponseSchema: z.ZodType<
  DataAndMessageResponse<{ sentCount: number }>
> = z.object({
  data: z.object({
    sentCount: z.number(),
  }),
  message: z.string(),
});

export const getVapidPublicKey = async (): Promise<string> => {
  const response = await baseHttpClient.get("/api/v1/push/vapid-public-key", {
    schema: VapidPublicKeyResponseSchema,
  });
  return response.data.publicKey;
};

export const subscribe = async (
  subscription: PushSubscription
): Promise<void> => {
  const subscriptionJSON = subscription.toJSON();
  await baseHttpClient.post("/api/v1/push/subscribe", {
    data: {
      endpoint: subscriptionJSON.endpoint,
      keys: {
        p256dh: subscriptionJSON.keys?.p256dh,
        auth: subscriptionJSON.keys?.auth,
      },
    },
    schema: MessageResponseSchema,
  });
};

export const unsubscribe = async (endpoint: string): Promise<void> => {
  await baseHttpClient.post("/api/v1/push/unsubscribe", {
    data: { endpoint },
    schema: MessageResponseSchema,
  });
};

export const sendTest = async (
  title?: string,
  body?: string
): Promise<number> => {
  const response = await baseHttpClient.post("/api/v1/push/test", {
    data: { title, body },
    schema: SendTestResponseSchema,
  });
  return response.data.sentCount;
};
