import { singleton } from "tsyringe";
import { Controller } from "@api/decorators/controller";
import { ValidateQuery } from "@api/decorators/request-validator";
import { StatsService } from "@api/features/log/stats-service";
import { StatsQueryDto, StatsResponseDto } from "@api/features/log/dto";
import type {
  AuthenticatedTypedRequest,
  TypedResponse,
  DataAndMessageResponse,
} from "@api/types/express";
import type { StatsResponse } from "@repo/interfaces";

interface WorkspaceParams {
  id: string;
}

@singleton()
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  /**
   * GET /v1/workspaces/:id/stats - 통계 데이터 조회
   */
  @ValidateQuery(StatsQueryDto)
  async getStats(
    req: AuthenticatedTypedRequest<unknown, WorkspaceParams, StatsQueryDto>,
    res: TypedResponse<DataAndMessageResponse<StatsResponse>>
  ) {
    const workspaceId = parseInt(req.params.id, 10);
    const query = req.query;
    const stats = await this.statsService.getStats(workspaceId, query);
    const dto = StatsResponseDto.create(
      stats.dailyData,
      stats.methodStats,
      stats.categoryStats,
      stats.userStats,
      stats.summary
    );
    res.json({ message: "success", data: dto });
  }
}
