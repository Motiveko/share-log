import { Expose, instanceToPlain } from "class-transformer";
import { IsEmail, IsIn } from "class-validator";
import {
  Invitation as InvitationInterface,
  InvitationWithWorkspace,
  InvitationStatus,
  CreateInvitationDto as CreateInvitationDtoInterface,
  UpdateInvitationDto as UpdateInvitationDtoInterface,
} from "@repo/interfaces";
import { Invitation } from "@repo/entities/invitation";

export class InvitationResponseDto implements InvitationInterface {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  inviterId: number;

  @Expose()
  inviteeEmail: string;

  @Expose()
  inviteeId?: number;

  @Expose()
  status: InvitationStatus;

  @Expose()
  emailSent: boolean;

  @Expose()
  emailSentAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  static fromEntity(entity: Invitation): InvitationResponseDto {
    const dto = new InvitationResponseDto();
    dto.id = entity.id;
    dto.workspaceId = entity.workspaceId;
    dto.inviterId = entity.inviterId;
    dto.inviteeEmail = entity.inviteeEmail;
    dto.inviteeId = entity.inviteeId;
    dto.status = entity.status;
    dto.emailSent = entity.emailSent;
    dto.emailSentAt = entity.emailSentAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    return dto;
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class InvitationWithWorkspaceDto implements InvitationWithWorkspace {
  @Expose()
  id: number;

  @Expose()
  workspaceId: number;

  @Expose()
  inviterId: number;

  @Expose()
  inviteeEmail: string;

  @Expose()
  inviteeId?: number;

  @Expose()
  status: InvitationStatus;

  @Expose()
  emailSent: boolean;

  @Expose()
  emailSentAt?: Date;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  workspace: {
    id: number;
    name: string;
    thumbnailUrl?: string | null;
  };

  @Expose()
  inviter: {
    id: number;
    email: string;
    nickname?: string | null;
    avatarUrl?: string;
  };

  static fromEntity(entity: Invitation): InvitationWithWorkspaceDto {
    const dto = new InvitationWithWorkspaceDto();
    dto.id = entity.id;
    dto.workspaceId = entity.workspaceId;
    dto.inviterId = entity.inviterId;
    dto.inviteeEmail = entity.inviteeEmail;
    dto.inviteeId = entity.inviteeId;
    dto.status = entity.status;
    dto.emailSent = entity.emailSent;
    dto.emailSentAt = entity.emailSentAt;
    dto.createdAt = entity.createdAt;
    dto.updatedAt = entity.updatedAt;
    dto.workspace = {
      id: entity.workspace.id,
      name: entity.workspace.name,
      thumbnailUrl: entity.workspace.thumbnailUrl,
    };
    dto.inviter = {
      id: entity.inviter.id,
      email: entity.inviter.email ?? "",
      nickname: entity.inviter.nickname ?? null,
      avatarUrl: entity.inviter.avatarUrl,
    };
    return dto;
  }

  static fromEntities(entities: Invitation[]): InvitationWithWorkspaceDto[] {
    return entities.map((e) => InvitationWithWorkspaceDto.fromEntity(e));
  }

  toJSON() {
    return instanceToPlain(this);
  }
}

export class CreateInvitationRequestDto implements CreateInvitationDtoInterface {
  @IsEmail({}, { message: "유효한 이메일을 입력해주세요." })
  inviteeEmail: string;
}

export class UpdateInvitationRequestDto implements UpdateInvitationDtoInterface {
  @IsIn(["accepted", "rejected"], { message: "수락 또는 거절만 가능합니다." })
  action: "accepted" | "rejected";
}
