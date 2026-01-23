import type {
  Workspace,
  WorkspaceWithMemberCount,
  WorkspaceMemberWithUser,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateMemberRoleDto,
  MemberRole,
  MemberStatus,
} from "@repo/interfaces";
import { z } from "zod";
import { baseHttpClient } from "@web/api/http-client";
import type { DataAndMessageResponse, MessageResponse } from "@web/api/types";

// Schemas
const WorkspaceBaseSchema = z.object({
  id: z.number(),
  name: z.string(),
  thumbnailUrl: z.string().nullish(),
  bannerUrl: z.string().nullish(),
  creatorId: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

const WorkspaceSchema: z.ZodType<Workspace> = WorkspaceBaseSchema;

const WorkspaceWithMemberCountSchema: z.ZodType<WorkspaceWithMemberCount> =
  WorkspaceBaseSchema.extend({
    memberCount: z.number(),
  });

const WorkspaceMemberWithUserSchema: z.ZodType<WorkspaceMemberWithUser> =
  z.object({
    id: z.number(),
    workspaceId: z.number(),
    userId: z.number(),
    role: z.nativeEnum({
      MASTER: "master",
      MEMBER: "member",
    } as const) as z.ZodType<MemberRole>,
    status: z.nativeEnum({
      PENDING: "pending",
      ACCEPTED: "accepted",
      REJECTED: "rejected",
      EXPELLED: "expelled",
    } as const) as z.ZodType<MemberStatus>,
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    user: z.object({
      id: z.number(),
      email: z.string(),
      nickname: z.string().optional().nullable(),
      avatarUrl: z.string().optional(),
    }),
  });

// Response Schemas
const CreateWorkspaceResponseSchema: z.ZodType<
  DataAndMessageResponse<Workspace>
> = z.object({
  data: WorkspaceSchema,
  message: z.string(),
});

const GetWorkspacesResponseSchema: z.ZodType<
  DataAndMessageResponse<WorkspaceWithMemberCount[]>
> = z.object({
  data: z.array(WorkspaceWithMemberCountSchema),
  message: z.string(),
});

const GetWorkspaceResponseSchema: z.ZodType<
  DataAndMessageResponse<WorkspaceWithMemberCount>
> = z.object({
  data: WorkspaceWithMemberCountSchema,
  message: z.string(),
});

const UpdateWorkspaceResponseSchema: z.ZodType<
  DataAndMessageResponse<Workspace>
> = z.object({
  data: WorkspaceSchema,
  message: z.string(),
});

const DeleteWorkspaceResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

const GetMembersResponseSchema: z.ZodType<
  DataAndMessageResponse<WorkspaceMemberWithUser[]>
> = z.object({
  data: z.array(WorkspaceMemberWithUserSchema),
  message: z.string(),
});

const UpdateMemberRoleResponseSchema: z.ZodType<
  DataAndMessageResponse<WorkspaceMemberWithUser>
> = z.object({
  data: WorkspaceMemberWithUserSchema,
  message: z.string(),
});

const ExpelMemberResponseSchema: z.ZodType<MessageResponse> = z.object({
  message: z.string(),
});

const GetLastVisitResponseSchema: z.ZodType<
  DataAndMessageResponse<{ workspaceId: number | null }>
> = z.object({
  data: z.object({
    workspaceId: z.number().nullable(),
  }),
  message: z.string(),
});

// API Functions

/**
 * 워크스페이스 생성
 */
export const create = async (data: CreateWorkspaceDto) => {
  const response = await baseHttpClient.post<typeof CreateWorkspaceResponseSchema>(
    "/api/v1/workspaces",
    {
      data,
      schema: CreateWorkspaceResponseSchema,
    }
  );
  return response.data;
};

/**
 * 워크스페이스 목록 조회
 */
export const list = async () => {
  const response = await baseHttpClient.get<typeof GetWorkspacesResponseSchema>(
    "/api/v1/workspaces",
    {
      schema: GetWorkspacesResponseSchema,
    }
  );
  return response.data;
};

/**
 * 워크스페이스 상세 조회
 */
export const get = async (workspaceId: number) => {
  const response = await baseHttpClient.get<typeof GetWorkspaceResponseSchema>(
    `/api/v1/workspaces/${workspaceId}`,
    {
      schema: GetWorkspaceResponseSchema,
    }
  );
  return response.data;
};

/**
 * 워크스페이스 수정
 */
export const update = async (workspaceId: number, data: UpdateWorkspaceDto) => {
  const response = await baseHttpClient.patch<typeof UpdateWorkspaceResponseSchema>(
    `/api/v1/workspaces/${workspaceId}`,
    {
      data,
      schema: UpdateWorkspaceResponseSchema,
    }
  );
  return response.data;
};

/**
 * 워크스페이스 삭제
 */
export const remove = async (workspaceId: number) => {
  const response = await baseHttpClient.delete<typeof DeleteWorkspaceResponseSchema>(
    `/api/v1/workspaces/${workspaceId}`,
    {
      schema: DeleteWorkspaceResponseSchema,
    }
  );
  return response;
};

/**
 * 마지막 방문 워크스페이스 조회
 */
export const getLastVisit = async () => {
  const response = await baseHttpClient.get<typeof GetLastVisitResponseSchema>(
    "/api/v1/workspaces/last-visit",
    {
      schema: GetLastVisitResponseSchema,
    }
  );
  return response.data;
};

/**
 * 워크스페이스 멤버 목록 조회
 */
export const getMembers = async (workspaceId: number) => {
  const response = await baseHttpClient.get<typeof GetMembersResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/members`,
    {
      schema: GetMembersResponseSchema,
    }
  );
  return response.data;
};

/**
 * 멤버 권한 변경
 */
export const updateMemberRole = async (
  workspaceId: number,
  userId: number,
  data: UpdateMemberRoleDto
) => {
  const response = await baseHttpClient.patch<typeof UpdateMemberRoleResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/members/${userId}`,
    {
      data,
      schema: UpdateMemberRoleResponseSchema,
    }
  );
  return response.data;
};

/**
 * 멤버 추방
 */
export const expelMember = async (workspaceId: number, userId: number) => {
  const response = await baseHttpClient.delete<typeof ExpelMemberResponseSchema>(
    `/api/v1/workspaces/${workspaceId}/members/${userId}`,
    {
      schema: ExpelMemberResponseSchema,
    }
  );
  return response;
};
