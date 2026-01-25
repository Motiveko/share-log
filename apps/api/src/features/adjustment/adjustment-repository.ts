import { Repository, SelectQueryBuilder } from "typeorm";
import { singleton } from "tsyringe";
import { Adjustment } from "@repo/entities/adjustment";
import { DataSource } from "@api/lib/datasource";
import type { AdjustmentListQuery } from "@repo/interfaces";

@singleton()
export class AdjustmentRepository extends Repository<Adjustment> {
  constructor(private dataSource: DataSource) {
    super(Adjustment, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({
      where: { id },
      relations: ["creator"],
    });
  }

  /**
   * 워크스페이스의 정산 목록 조회 (필터, 페이지네이션)
   */
  async findByWorkspaceWithFilter(
    workspaceId: number,
    query: AdjustmentListQuery
  ): Promise<{ adjustments: Adjustment[]; total: number }> {
    const qb = this.createQueryBuilder("adjustment")
      .leftJoinAndSelect("adjustment.creator", "creator")
      .where("adjustment.workspaceId = :workspaceId", { workspaceId });

    this.applyFilters(qb, query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    qb.orderBy("adjustment.createdAt", "DESC")
      .addOrderBy("adjustment.id", "DESC")
      .skip(skip)
      .take(limit);

    const [adjustments, total] = await qb.getManyAndCount();
    return { adjustments, total };
  }

  private applyFilters(
    qb: SelectQueryBuilder<Adjustment>,
    query: AdjustmentListQuery
  ): void {
    if (query.status) {
      qb.andWhere("adjustment.status = :status", { status: query.status });
    }
  }
}
