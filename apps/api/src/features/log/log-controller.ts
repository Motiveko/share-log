import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateBody, ValidateQuery } from "@api/decorators/request-validator";
import { LogService } from "@api/features/log/log-service";
import {
  LogResponseDto,
  LogListResponseDto,
  CreateLogRequestDto,
  UpdateLogRequestDto,
  LogListQueryDto,
} from "@api/features/log/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
  MessageResponse,
} from "@api/types/express";
import type { LogWithRelations, LogListResponse } from "@repo/interfaces";

interface WorkspaceParams {
  id: string;
}

interface LogParams extends WorkspaceParams {
  logId: string;
}

@singleton()
@Controller()
export class LogController {
  constructor(private readonly logService: LogService) {}

  /**
   * POST /v1/workspaces/:id/logs - 로그 생성
   */
  @ValidateBody(CreateLogRequestDto)
  async create(
    req: AuthenticatedTypedRequest<CreateLogRequestDto, WorkspaceParams>,
    res: TypedResponse<DataAndMessageResponse<LogWithRelations>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const log = await this.logService.create(workspaceId, req.user.id, req.body);
    const dto = LogResponseDto.fromEntity(log);
    res.status(201).json({ message: "로그가 생성되었습니다.", data: dto });
  }

  /**
   * GET /v1/workspaces/:id/logs - 로그 목록 조회 (필터, 페이지네이션)
   */
  @ValidateQuery(LogListQueryDto)
  async list(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams, LogListQueryDto>,
    res: TypedResponse<DataAndMessageResponse<LogListResponse>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const query = req.query;
    const { logs, total } = await this.logService.findByWorkspace(
      workspaceId,
      query
    );
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const dto = LogListResponseDto.create(logs, total, page, limit);
    res.json({ message: "success", data: dto });
  }

  /**
   * PATCH /v1/workspaces/:id/logs/:logId - 로그 수정 (본인만)
   */
  @ValidateBody(UpdateLogRequestDto)
  async update(
    req: AuthenticatedTypedRequest<UpdateLogRequestDto, LogParams>,
    res: TypedResponse<DataAndMessageResponse<LogWithRelations>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const logId = parseInt(req.params.logId, 10);
    const log = await this.logService.update(
      workspaceId,
      logId,
      req.user.id,
      req.body
    );
    const dto = LogResponseDto.fromEntity(log);
    res.json({ message: "로그가 수정되었습니다.", data: dto });
  }

  /**
   * DELETE /v1/workspaces/:id/logs/:logId - 로그 삭제 (본인만)
   */
  async delete(
    req: AuthenticatedTypedRequest<unknown, LogParams>,
    res: TypedResponse<MessageResponse>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const logId = parseInt(req.params.logId, 10);
    await this.logService.delete(workspaceId, logId, req.user.id);
    res.json({ message: "로그가 삭제되었습니다." });
  }
}
