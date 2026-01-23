import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { WorkspaceService } from "@api/features/workspace/workspace-service";
import {
  CreateWorkspaceRequestDto,
  UpdateWorkspaceRequestDto,
  WorkspaceResponseDto,
  WorkspaceWithMemberCountDto,
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

interface LastVisitResponse {
  workspaceId: number | null;
}

@singleton()
@Controller()
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  /**
   * POST /v1/workspaces - 워크스페이스 생성
   */
  @ValidateBody(CreateWorkspaceRequestDto)
  async create(
    req: AuthenticatedTypedRequest<CreateWorkspaceRequestDto>,
    res: TypedResponse<DataAndMessageResponse<WorkspaceResponseDto>>
  ) {
    const workspace = await this.workspaceService.create(req.user.id, req.body);
    const dto = WorkspaceResponseDto.fromEntity(workspace);
    res.status(201).json({ message: "워크스페이스가 생성되었습니다.", data: dto });
  }

  /**
   * GET /v1/workspaces - 사용자의 워크스페이스 목록 조회
   */
  async list(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<WorkspaceWithMemberCountDto[]>>
  ) {
    const workspaces = await this.workspaceService.findAllByUserId(req.user.id);
    const dto = WorkspaceWithMemberCountDto.fromRawMany(workspaces);
    res.json({ message: "success", data: dto });
  }

  /**
   * GET /v1/workspaces/:id - 워크스페이스 상세 조회
   */
  async get(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<WorkspaceWithMemberCountDto>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const workspace = await this.workspaceService.findById(req.user.id, workspaceId);
    const dto = WorkspaceWithMemberCountDto.fromRaw(workspace);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:id - 워크스페이스 수정
   */
  @ValidateBody(UpdateWorkspaceRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateWorkspaceRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<WorkspaceResponseDto>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const workspace = await this.workspaceService.update(workspaceId, req.body);
    const dto = WorkspaceResponseDto.fromEntity(workspace);
    res.json({ message: "워크스페이스가 수정되었습니다.", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id - 워크스페이스 삭제
   */
  async delete(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    await this.workspaceService.delete(workspaceId);
    res.json({ message: "워크스페이스가 삭제되었습니다." });
  }

  /**
   * GET /v1/workspaces/last-visit - 마지막 방문 워크스페이스 조회
   */
  async getLastVisit(
    req: AuthenticatedTypedRequest,
    res: TypedResponse<DataAndMessageResponse<LastVisitResponse>>
  ) {
    const workspaceId = await this.workspaceService.getLastVisitWorkspaceId(
      req.user.id
    );
    res.json({ message: "success", data: { workspaceId } });
  }
}
