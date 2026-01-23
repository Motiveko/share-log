import type {
  Invitation,
  InvitationWithWorkspace,
  InvitationStatus,
  CreateInvitationDto,
  UpdateInvitationDto,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

// Schemas
const InvitationStatusSchema = z.enum([
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]) as z.ZodType<InvitationStatus>;

const InvitationBaseSchema = z.object({
  id: z.number(),
  workspaceId: z.number(),
  inviterId: z.number(),
  inviteeEmail: z.string(),
  inviteeId: z.number().optional(),
  status: InvitationStatusSchema,
  emailSent: z.boolean(),
  emailSentAt: z.coerce.date().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const InvitationSchema: z.ZodType<Invitation> = InvitationBaseSchema;

const InvitationWithWorkspaceSchema: z.ZodType<InvitationWithWorkspace> =
  InvitationBaseSchema.extend({
    workspace: z.object({
      id: z.number(),
      name: z.string(),
      thumbnailUrl: z.string().nullish(),
    }),
    inviter: z.object({
      id: z.number(),
      email: z.string(),
      nickname: z.string().nullish(),
      avatarUrl: z.string().optional(),
    }),
  });

// Response Schemas
const CreateInvitationResponseSchema: z.ZodType<
  DataAndMessageResponse<Invitation>
> = z.object({
  data: InvitationSchema,
  message: z.string(),
});

const GetInvitationsResponseSchema: z.ZodType<
  DataAndMessageResponse<InvitationWithWorkspace[]>
> = z.object({
  data: z.array(InvitationWithWorkspaceSchema),
  message: z.string(),
});

const UpdateInvitationResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

// API Functions

/**
 * 초대 생성
 */
export const create = async (workspaceId: number, data: CreateInvitationDto) => {
  const response = await baseHttpClient.post<
    typeof CreateInvitationResponseSchema
  >(`/api/v1/workspaces/${workspaceId}/invitations`, {
    data,
    schema: CreateInvitationResponseSchema,
  });
  return response.data;
};

/**
 * 내가 받은 초대 목록 조회
 */
export const listMyInvitations = async () => {
  const response = await baseHttpClient.get<typeof GetInvitationsResponseSchema>(
    "/api/v1/invitations",
    {
      schema: GetInvitationsResponseSchema,
    }
  );
  return response.data;
};

/**
 * 초대 수락
 */
export const accept = async (invitationId: number) => {
  const data: UpdateInvitationDto = { action: "accepted" };
  const response = await baseHttpClient.patch<
    typeof UpdateInvitationResponseSchema
  >(`/api/v1/invitations/${invitationId}`, {
    data,
    schema: UpdateInvitationResponseSchema,
  });
  return response;
};

/**
 * 초대 거절
 */
export const reject = async (invitationId: number) => {
  const data: UpdateInvitationDto = { action: "rejected" };
  const response = await baseHttpClient.patch<
    typeof UpdateInvitationResponseSchema
  >(`/api/v1/invitations/${invitationId}`, {
    data,
    schema: UpdateInvitationResponseSchema,
  });
  return response;
};
