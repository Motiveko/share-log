import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { MemberService } from "@api/features/workspace/member-service";
import {
  UpdateMemberRoleRequestDto,
  WorkspaceMemberWithUserDto,
} from "@api/features/workspace/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";

interface WorkspaceParams {
  id: string;
}

interface MemberParams extends WorkspaceParams {
  userId: string;
}

@singleton()
@Controller()
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  /**
   * GET /v1/workspaces/:id/members - 워크스페이스 멤버 목록 조회
   */
  async list(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<WorkspaceMemberWithUserDto[]>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const members = await this.memberService.findMembersByWorkspace(workspaceId);
    const dto = WorkspaceMemberWithUserDto.fromEntities(members);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:id/members/:userId - 멤버 권한 변경
   */
  @ValidateBody(UpdateMemberRoleRequestDto)
  async updateRole(
    req: AuthenticatedTypedRequest<UpdateMemberRoleRequestDto, MemberParams>,
    res: TypedResponse<DataAndMessageResponse<WorkspaceMemberWithUserDto>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    const member = await this.memberService.updateRole(
      workspaceId,
      targetUserId,
      req.body.role,
      req.user.id
    );
    // 유저 정보를 다시 조회해서 반환
    const members = await this.memberService.findMembersByWorkspace(workspaceId);
    const updatedMember = members.find((m) => m.userId === targetUserId);
    const dto = updatedMember
      ? WorkspaceMemberWithUserDto.fromEntity(updatedMember)
      : WorkspaceMemberWithUserDto.fromEntity(member);
    res.json({ message: "멤버 권한이 변경되었습니다.", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id/members/:userId - 멤버 추방
   */
  async expel(
    req: AuthenticatedTypedRequest<unknown, MemberParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const targetUserId = parseInt(req.params.userId, 10);
    await this.memberService.expelMember(workspaceId, targetUserId, req.user.id);
    res.json({ message: "멤버가 추방되었습니다." });
  }
}
