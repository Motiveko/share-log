import { singleton } from "tsyringe";
import { Adjustment, AdjustmentStatus } from "@repo/entities/adjustment";
import { AdjustmentRepository } from "@api/features/adjustment/adjustment-repository";
import { AdjustmentCalculator } from "@api/features/adjustment/adjustment-calculator";
import { WorkspaceRepository } from "@api/features/workspace/workspace-repository";
import { UserService } from "@api/features/user/service";
import { ActionQueuePublisher } from "@api/lib/action-queue";
import { NotFoundError } from "@api/errors/not-found";
import { ForbiddenError } from "@api/errors/forbidden";
import { BadRequestError } from "@api/errors/bad-request";
import type {
  CreateAdjustmentDto,
  UpdateAdjustmentDto,
  AdjustmentListQuery,
} from "@repo/interfaces";

@singleton()
export class AdjustmentService {
  constructor(
    private readonly adjustmentRepository: AdjustmentRepository,
    private readonly adjustmentCalculator: AdjustmentCalculator,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly userService: UserService,
    private readonly actionQueuePublisher: ActionQueuePublisher
  ) {}

  /**
   * 정산 생성
   */
  async create(
    workspaceId: number,
    creatorId: number,
    dto: CreateAdjustmentDto
  ): Promise<Adjustment> {
    // 날짜 유효성 검사
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (startDate > endDate) {
      throw new BadRequestError("시작일이 종료일보다 늦을 수 없습니다.");
    }

    // 정산 결과 계산
    const result = await this.adjustmentCalculator.calculate({
      workspaceId,
      startDate: dto.startDate,
      endDate: dto.endDate,
      categoryIds: dto.categoryIds ?? [],
      methodIds: dto.methodIds ?? [],
      participantIds: dto.participantIds ?? [],
    });

    const adjustment = new Adjustment();
    adjustment.workspaceId = workspaceId;
    adjustment.creatorId = creatorId;
    adjustment.name = dto.name;
    adjustment.startDate = startDate;
    adjustment.endDate = endDate;
    adjustment.categoryIds = dto.categoryIds ?? [];
    adjustment.methodIds = dto.methodIds ?? [];
    adjustment.participantIds = dto.participantIds ?? [];
    adjustment.status = AdjustmentStatus.CREATED;
    adjustment.result = result;

    const saved = await this.adjustmentRepository.save(adjustment);
    const createdAdjustment = await this.adjustmentRepository.findById(saved.id) as Adjustment;

    // 이벤트 발행
    await this.publishAdjustmentEvent("created", createdAdjustment, creatorId);

    return createdAdjustment;
  }

  /**
   * 워크스페이스의 정산 목록 조회
   */
  async findByWorkspace(workspaceId: number, query: AdjustmentListQuery) {
    return this.adjustmentRepository.findByWorkspaceWithFilter(workspaceId, query);
  }

  /**
   * 정산 상세 조회
   */
  async findById(workspaceId: number, adjustmentId: number): Promise<Adjustment> {
    const adjustment = await this.adjustmentRepository.findById(adjustmentId);
    if (!adjustment || adjustment.workspaceId !== workspaceId) {
      throw new NotFoundError("정산을 찾을 수 없습니다.");
    }
    return adjustment;
  }

  /**
   * 정산 수정 (생성자만, CREATED 상태만)
   */
  async update(
    workspaceId: number,
    adjustmentId: number,
    userId: number,
    dto: UpdateAdjustmentDto
  ): Promise<Adjustment> {
    const adjustment = await this.adjustmentRepository.findById(adjustmentId);
    if (!adjustment || adjustment.workspaceId !== workspaceId) {
      throw new NotFoundError("정산을 찾을 수 없습니다.");
    }

    if (adjustment.creatorId !== userId) {
      throw new ForbiddenError("본인이 생성한 정산만 수정할 수 있습니다.");
    }

    if (adjustment.status !== AdjustmentStatus.CREATED) {
      throw new BadRequestError("완료된 정산은 수정할 수 없습니다.");
    }

    // 필드 업데이트
    if (dto.name !== undefined) adjustment.name = dto.name;
    if (dto.startDate !== undefined) adjustment.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) adjustment.endDate = new Date(dto.endDate);
    if (dto.categoryIds !== undefined) adjustment.categoryIds = dto.categoryIds;
    if (dto.methodIds !== undefined) adjustment.methodIds = dto.methodIds;
    if (dto.participantIds !== undefined) adjustment.participantIds = dto.participantIds;

    // 날짜 유효성 검사
    if (adjustment.startDate > adjustment.endDate) {
      throw new BadRequestError("시작일이 종료일보다 늦을 수 없습니다.");
    }

    // 정산 결과 재계산
    const result = await this.adjustmentCalculator.calculate({
      workspaceId,
      startDate: adjustment.startDate.toISOString().split("T")[0],
      endDate: adjustment.endDate.toISOString().split("T")[0],
      categoryIds: adjustment.categoryIds,
      methodIds: adjustment.methodIds,
      participantIds: adjustment.participantIds,
    });
    adjustment.result = result;

    const saved = await this.adjustmentRepository.save(adjustment);
    return this.adjustmentRepository.findById(saved.id) as Promise<Adjustment>;
  }

  /**
   * 정산 완료 처리 (생성자만)
   */
  async complete(
    workspaceId: number,
    adjustmentId: number,
    userId: number
  ): Promise<Adjustment> {
    const adjustment = await this.adjustmentRepository.findById(adjustmentId);
    if (!adjustment || adjustment.workspaceId !== workspaceId) {
      throw new NotFoundError("정산을 찾을 수 없습니다.");
    }

    if (adjustment.creatorId !== userId) {
      throw new ForbiddenError("본인이 생성한 정산만 완료 처리할 수 있습니다.");
    }

    if (adjustment.status === AdjustmentStatus.COMPLETED) {
      throw new BadRequestError("이미 완료된 정산입니다.");
    }

    adjustment.status = AdjustmentStatus.COMPLETED;
    adjustment.completedAt = new Date();

    const saved = await this.adjustmentRepository.save(adjustment);
    const completedAdjustment = await this.adjustmentRepository.findById(saved.id) as Adjustment;

    // 이벤트 발행
    await this.publishAdjustmentEvent("completed", completedAdjustment, userId);

    return completedAdjustment;
  }

  /**
   * 정산 삭제 (생성자만)
   */
  async delete(
    workspaceId: number,
    adjustmentId: number,
    userId: number
  ): Promise<void> {
    const adjustment = await this.adjustmentRepository.findById(adjustmentId);
    if (!adjustment || adjustment.workspaceId !== workspaceId) {
      throw new NotFoundError("정산을 찾을 수 없습니다.");
    }

    if (adjustment.creatorId !== userId) {
      throw new ForbiddenError("본인이 생성한 정산만 삭제할 수 있습니다.");
    }

    await this.adjustmentRepository.remove(adjustment);
  }

  /**
   * 정산 이벤트 발행 헬퍼
   */
  private async publishAdjustmentEvent(
    type: "created" | "completed",
    adjustment: Adjustment,
    userId: number
  ): Promise<void> {
    try {
      const [workspace, user] = await Promise.all([
        this.workspaceRepository.findById(adjustment.workspaceId),
        this.userService.getById(userId),
      ]);

      await this.actionQueuePublisher.publish({
        type,
        aggregateType: "adjustment",
        aggregateId: adjustment.id,
        userId,
        payload: {
          workspaceId: adjustment.workspaceId,
          workspaceName: workspace?.name ?? "",
          userId,
          userNickname: user?.nickname ?? user?.email ?? "",
          adjustmentId: adjustment.id,
          title: adjustment.name,
          totalAmount: adjustment.result?.totalExpense ?? 0,
        },
      });
    } catch (error) {
      // 이벤트 발행 실패해도 메인 로직에 영향 주지 않음
      console.error("Failed to publish adjustment event:", error);
    }
  }
}
