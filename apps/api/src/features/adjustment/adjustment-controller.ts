import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody, ValidateQuery } from "@api/decorators/request-validator";
import { AdjustmentService } from "@api/features/adjustment/adjustment-service";
import {
  AdjustmentResponseDto,
  AdjustmentListResponseDto,
  CreateAdjustmentRequestDto,
  UpdateAdjustmentRequestDto,
  AdjustmentListQueryDto,
} from "@api/features/adjustment/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";
import type { AdjustmentWithCreator, AdjustmentListResponse } from "@repo/interfaces";

interface WorkspaceParams {
  id: string;
}

interface AdjustmentParams extends WorkspaceParams {
  adjustmentId: string;
}

@singleton()
@Controller()
export class AdjustmentController {
  constructor(private readonly adjustmentService: AdjustmentService) {}

  /**
   * POST /v1/workspaces/:id/adjustments - 정산 생성
   */
  @ValidateBody(CreateAdjustmentRequestDto)
  async create(
    req: AuthenticatedTypedRequest<CreateAdjustmentRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<AdjustmentWithCreator>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const adjustment = await this.adjustmentService.create(
      workspaceId,
      req.user.id,
      req.body
    );
    const dto = AdjustmentResponseDto.fromEntity(adjustment);
    res.status(201).json({ message: "정산이 생성되었습니다.", data: dto });
  }

  /**
   * GET /v1/workspaces/:id/adjustments - 정산 목록 조회
   */
  @ValidateQuery(AdjustmentListQueryDto)
  async list(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams, AdjustmentListQueryDto>,
    res: TypedResponse<DataAndMessageResponse<AdjustmentListResponse>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const query = req.query;
    const { adjustments, total } = await this.adjustmentService.findByWorkspace(
      workspaceId,
      query
    );
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const dto = AdjustmentListResponseDto.create(adjustments, total, page, limit);
    res.json({ message: "success", data: dto });
  }

  /**
   * GET /v1/workspaces/:id/adjustments/:adjustmentId - 정산 상세 조회
   */
  async get(
    req: AuthenticatedTypedRequest<unknown, AdjustmentParams>,
    res: TypedResponse<DataAndMessageResponse<AdjustmentWithCreator>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const adjustmentId = parseInt(req.params.adjustmentId, 10);
    const adjustment = await this.adjustmentService.findById(
      workspaceId,
      adjustmentId
    );
    const dto = AdjustmentResponseDto.fromEntity(adjustment);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:id/adjustments/:adjustmentId - 정산 수정 (생성자만, CREATED 상태만)
   */
  @ValidateBody(UpdateAdjustmentRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateAdjustmentRequestDto, AdjustmentParams>,
    res: TypedResponse<DataAndMessageResponse<AdjustmentWithCreator>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const adjustmentId = parseInt(req.params.adjustmentId, 10);
    const adjustment = await this.adjustmentService.update(
      workspaceId,
      adjustmentId,
      req.user.id,
      req.body
    );
    const dto = AdjustmentResponseDto.fromEntity(adjustment);
    res.json({ message: "정산이 수정되었습니다.", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id/adjustments/:adjustmentId - 정산 삭제 (생성자만)
   */
  async delete(
    req: AuthenticatedTypedRequest<unknown, AdjustmentParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const adjustmentId = parseInt(req.params.adjustmentId, 10);
    await this.adjustmentService.delete(
      workspaceId,
      adjustmentId,
      req.user.id
    );
    res.json({ message: "정산이 삭제되었습니다." });
  }

  /**
   * POST /v1/workspaces/:id/adjustments/:adjustmentId/complete - 정산 완료 처리 (생성자만)
   */
  async complete(
    req: AuthenticatedTypedRequest<unknown, AdjustmentParams>,
    res: TypedResponse<DataAndMessageResponse<AdjustmentWithCreator>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const adjustmentId = parseInt(req.params.adjustmentId, 10);
    const adjustment = await this.adjustmentService.complete(
      workspaceId,
      adjustmentId,
      req.user.id
    );
    const dto = AdjustmentResponseDto.fromEntity(adjustment);
    res.json({ message: "정산이 완료되었습니다.", data: dto });
  }
}
