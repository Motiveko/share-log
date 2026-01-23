import { Repository, SelectQueryBuilder } from "typeorm";
import { singleton } from "tsyringe";
import { Log } from "@repo/entities/log";
import { DataSource } from "@api/lib/datasource";
import type { LogListQuery } from "@repo/interfaces";

@singleton()
export class LogRepository extends Repository<Log> {
  constructor(private dataSource: DataSource) {
    super(Log, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({
      where: { id },
      relations: ["category", "method", "user"],
    });
  }

  /**
   * 워크스페이스의 로그 목록 조회 (필터, 페이지네이션)
   */
  async findByWorkspaceWithFilter(
    workspaceId: number,
    query: LogListQuery
  ): Promise<{ logs: Log[]; total: number }> {
    const qb = this.createQueryBuilder("log")
      .leftJoinAndSelect("log.category", "category")
      .leftJoinAndSelect("log.method", "method")
      .leftJoinAndSelect("log.user", "user")
      .where("log.workspaceId = :workspaceId", { workspaceId });

    this.applyFilters(qb, query);

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    qb.orderBy("log.date", "DESC")
      .addOrderBy("log.id", "DESC")
      .skip(skip)
      .take(limit);

    const [logs, total] = await qb.getManyAndCount();
    return { logs, total };
  }

  private applyFilters(qb: SelectQueryBuilder<Log>, query: LogListQuery): void {
    if (query.startDate) {
      qb.andWhere("log.date >= :startDate", { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere("log.date <= :endDate", { endDate: query.endDate });
    }
    if (query.type) {
      qb.andWhere("log.type = :type", { type: query.type });
    }
    if (query.userId) {
      qb.andWhere("log.userId = :userId", { userId: query.userId });
    }
    if (query.categoryId) {
      qb.andWhere("log.categoryId = :categoryId", {
        categoryId: query.categoryId,
      });
    }
    if (query.methodId) {
      qb.andWhere("log.methodId = :methodId", { methodId: query.methodId });
    }
  }
}
