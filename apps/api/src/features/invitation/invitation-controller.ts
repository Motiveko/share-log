import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { InvitationService } from "@api/features/invitation/invitation-service";
import {
  CreateInvitationRequestDto,
  UpdateInvitationRequestDto,
  InvitationResponseDto,
  InvitationWithWorkspaceDto,
  WorkspaceInvitationDto,
} from "@api/features/invitation/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";

interface WorkspaceParams {
  id: string;
}

interface InvitationParams {
  id: string;
}

interface WorkspaceInvitationParams {
  id: string;
  invitationId: string;
}

@singleton()
@Controller()
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  /**
   * POST /v1/workspaces/:id/invitations - 초대 생성
   */
  @ValidateBody(CreateInvitationRequestDto)
  async create(
    req: AuthenticatedTypedRequest<CreateInvitationRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<InvitationResponseDto>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const invitation = await this.invitationService.create(
      workspaceId,
      req.user.id,
      req.body.inviteeEmail
    );
    const dto = InvitationResponseDto.fromEntity(invitation);
    res.status(201).json({ message: "초대가 발송되었습니다.", data: dto });
  }

  /**
   * GET /v1/invitations - 내가 받은 초대 목록
   */
  async listMyInvitations(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<InvitationWithWorkspaceDto[]>>
  ) {
    const invitations = await this.invitationService.findMyInvitations(
      req.user.email,
      req.user.id
    );
    const dto = InvitationWithWorkspaceDto.fromEntities(invitations);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/invitations/:id - 초대 수락/거절
   */
  @ValidateBody(UpdateInvitationRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateInvitationRequestDto, InvitationParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const invitationId = parseInt(req.params.id, 10);

    if (req.body.action === "accepted") {
      await this.invitationService.accept(invitationId, req.user.id);
      res.json({ message: "초대를 수락했습니다." });
    } else {
      await this.invitationService.reject(invitationId, req.user.id);
      res.json({ message: "초대를 거절했습니다." });
    }
  }

  /**
   * GET /v1/workspaces/:id/invitations - 워크스페이스 PENDING 초대 목록 조회
   */
  async listWorkspaceInvitations(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<WorkspaceInvitationDto[]>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const invitations =
      await this.invitationService.findPendingByWorkspace(workspaceId);
    const dto = WorkspaceInvitationDto.fromEntities(invitations);
    res.json({ message: "success", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id/invitations/:invitationId - 초대 취소
   */
  async cancel(
    req: AuthenticatedTypedRequest<unknown, WorkspaceInvitationParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const invitationId = parseInt(req.params.invitationId, 10);
    await this.invitationService.cancel(invitationId, req.user.id, workspaceId);
    res.json({ message: "초대가 취소되었습니다." });
  }
}
