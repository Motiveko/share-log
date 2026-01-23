import { Expose, instanceToPlain, plainToInstance } from "class-transformer";
import { IsString, IsOptional, MinLength, IsUrl, IsEnum, IsArray, IsEmail } from "class-validator";
import {
  Workspace as WorkspaceInterface,
  WorkspaceWithMemberCount,
  WorkspaceMemberWithUser,
  CreateWorkspaceDto as CreateWorkspaceDtoInterface,
  UpdateWorkspaceDto as UpdateWorkspaceDtoInterface,
  UpdateMemberRoleDto as UpdateMemberRoleDtoInterface,
  MemberRole,
  MemberStatus,
} from "@repo/interfaces";
import { Workspace } from "@repo/entities/workspace";
import { WorkspaceMember } from "@repo/entities/workspace-member";

export class WorkspaceResponseDto implements WorkspaceInterface {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  thumbnailUrl?: string;

  @Expose()
  bannerUrl?: string;

  @Expose()
  creatorId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(entity: Workspace) {
    return plainToInstance(WorkspaceResponseDto, entity, {
      excludeExtraneousValues: true,
    });
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class WorkspaceWithMemberCountDto implements WorkspaceWithMemberCount {
  @Expose()
  id: number;

  @Expose()
  name: string;

  @Expose()
  thumbnailUrl?: string;

  @Expose()
  bannerUrl?: string;

  @Expose()
  creatorId: number;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  memberCount: number;

  static fromRaw(raw: Workspace & { memberCount: number }) {
    return plainToInstance(WorkspaceWithMemberCountDto, raw, {
      excludeExtraneousValues: true,
    });
  }

  static fromRawMany(raws: (Workspace & { memberCount: number })[]) {
    return raws.map((r) => WorkspaceWithMemberCountDto.fromRaw(r));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class CreateWorkspaceRequestDto implements CreateWorkspaceDtoInterface {
  @IsString()
  @MinLength(1, { message: "워크스페이스 이름을 입력해주세요." })
  name: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "유효한 URL 형식이어야 합니다." })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "유효한 URL 형식이어야 합니다." })
  bannerUrl?: string;

  @IsOptional()
  @IsArray()
  @IsEmail({}, { each: true, message: "유효한 이메일 주소를 입력해주세요." })
  inviteeEmails?: string[];
}

export class UpdateWorkspaceRequestDto implements UpdateWorkspaceDtoInterface {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: "워크스페이스 이름을 입력해주세요." })
  name?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "유효한 URL 형식이어야 합니다." })
  thumbnailUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({}, { message: "유효한 URL 형식이어야 합니다." })
  bannerUrl?: string;
}

export class UpdateMemberRoleRequestDto implements UpdateMemberRoleDtoInterface {
  @IsEnum(MemberRole, { message: "유효한 역할을 입력해주세요." })
  role: MemberRole;
}

export class WorkspaceMemberWithUserDto implements WorkspaceMemberWithUser {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  userId: number;

  @Expose()
  role: MemberRole;

  @Expose()
  status: MemberStatus;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  user: {
    id: number;
    email: string;
    nickname?: string | null;
    avatarUrl?: string;
  };

  static fromEntity(entity: WorkspaceMember) {
    const dto = new WorkspaceMemberWithUserDto();
    dto.id = entity.id;
    dto.workspaceId = entity.workspaceId;
    dto.userId = entity.userId;
    dto.role = entity.role;
    dto.status = entity.status;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.user = {
      id: entity.user.id,
      email: entity.user.email ?? "",
      nickname: entity.user.nickname ?? null,
      avatarUrl: entity.user.avatarUrl,
    };
    return dto;
  }

  static fromEntities(entities: WorkspaceMember[]) {
    return entities.map((e) => WorkspaceMemberWithUserDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}
