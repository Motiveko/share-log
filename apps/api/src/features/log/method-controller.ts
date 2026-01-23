import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody } from "@api/decorators/request-validator";
import { MethodService } from "@api/features/log/method-service";
import {
  MethodResponseDto,
  CreateMethodRequestDto,
  UpdateMethodRequestDto,
} from "@api/features/log/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";
import type { LogMethod } from "@repo/interfaces";

interface WorkspaceParams {
  id: string;
}

interface MethodParams extends WorkspaceParams {
  methodId: string;
}

@singleton()
@Controller()
export class MethodController {
  constructor(private readonly methodService: MethodService) {}

  /**
   * POST /v1/workspaces/:id/methods - 수단 생성
   */
  @ValidateBody(CreateMethodRequestDto)
  async create(
    req: AuthenticatedTypedRequest<CreateMethodRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<LogMethod>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const method = await this.methodService.create(workspaceId, req.body);
    const dto = MethodResponseDto.fromEntity(method);
    res.status(201).json({ message: "수단이 생성되었습니다.", data: dto });
  }

  /**
   * GET /v1/workspaces/:id/methods - 수단 목록 조회
   */
  async list(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<LogMethod[]>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const methods = await this.methodService.findByWorkspace(workspaceId);
    const dto = MethodResponseDto.fromEntities(methods);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:id/methods/:methodId - 수단 수정
   */
  @ValidateBody(UpdateMethodRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateMethodRequestDto, MethodParams>,
    res: TypedResponse<DataAndMessageResponse<LogMethod>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const methodId = parseInt(req.params.methodId, 10);
    const method = await this.methodService.update(
      workspaceId,
      methodId,
      req.body
    );
    const dto = MethodResponseDto.fromEntity(method);
    res.json({ message: "수단이 수정되었습니다.", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id/methods/:methodId - 수단 삭제 (MASTER만, 기본 수단 삭제 불가)
   */
  async delete(
    req: AuthenticatedTypedRequest<unknown, MethodParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const methodId = parseInt(req.params.methodId, 10);
    await this.methodService.delete(workspaceId, methodId);
    res.json({ message: "수단이 삭제되었습니다." });
  }
}
