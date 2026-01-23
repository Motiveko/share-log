import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";
import { Log, LogType } from "@repo/entities/log";
import type {
  StatsQuery,
  DailyStat,
  MethodStat,
  CategoryStat,
  UserStat,
  StatsSummary,
} from "@repo/interfaces";

@singleton()
export class StatsService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * 일자별 통계
   */
  async getDailyStats(
    workspaceId: number,
    query: StatsQuery
  ): Promise<DailyStat[]> {
    const qb = this.dataSource
      .getRepository(Log)
      .createQueryBuilder("log")
      .select("DATE(log.date)", "date")
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :expense THEN log.amount ELSE 0 END), 0)",
        "expense"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :income THEN log.amount ELSE 0 END), 0)",
        "income"
      )
      .where("log.workspaceId = :workspaceId", { workspaceId })
      .setParameter("expense", LogType.EXPENSE)
      .setParameter("income", LogType.INCOME)
      .groupBy("DATE(log.date)")
      .orderBy("date", "ASC");

    this.applyFilters(qb, query);

    const result = await qb.getRawMany();
    return result.map((r) => ({
      date: r.date,
      expense: Number(r.expense),
      income: Number(r.income),
    }));
  }

  /**
   * 수단별 통계 (지출만)
   */
  async getMethodStats(
    workspaceId: number,
    query: StatsQuery
  ): Promise<MethodStat[]> {
    const qb = this.dataSource
      .getRepository(Log)
      .createQueryBuilder("log")
      .leftJoin("log.method", "method")
      .select("log.methodId", "methodId")
      .addSelect("COALESCE(method.name, '미지정')", "methodName")
      .addSelect("COALESCE(SUM(log.amount), 0)", "expense")
      .where("log.workspaceId = :workspaceId", { workspaceId })
      .andWhere("log.type = :expense", { expense: LogType.EXPENSE })
      .groupBy("log.methodId")
      .addGroupBy("method.name")
      .orderBy("expense", "DESC");

    this.applyFilters(qb, query);

    const result = await qb.getRawMany();
    return result.map((r) => ({
      methodId: r.methodId,
      methodName: r.methodName,
      expense: Number(r.expense),
    }));
  }

  /**
   * 카테고리별 통계
   */
  async getCategoryStats(
    workspaceId: number,
    query: StatsQuery
  ): Promise<CategoryStat[]> {
    const qb = this.dataSource
      .getRepository(Log)
      .createQueryBuilder("log")
      .leftJoin("log.category", "category")
      .select("log.categoryId", "categoryId")
      .addSelect("COALESCE(category.name, '미지정')", "categoryName")
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :expense THEN log.amount ELSE 0 END), 0)",
        "expense"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :income THEN log.amount ELSE 0 END), 0)",
        "income"
      )
      .where("log.workspaceId = :workspaceId", { workspaceId })
      .setParameter("expense", LogType.EXPENSE)
      .setParameter("income", LogType.INCOME)
      .groupBy("log.categoryId")
      .addGroupBy("category.name")
      .orderBy("expense", "DESC");

    this.applyFilters(qb, query);

    const result = await qb.getRawMany();
    return result.map((r) => ({
      categoryId: r.categoryId,
      categoryName: r.categoryName,
      expense: Number(r.expense),
      income: Number(r.income),
    }));
  }

  /**
   * 사용자별 통계
   */
  async getUserStats(
    workspaceId: number,
    query: StatsQuery
  ): Promise<UserStat[]> {
    const qb = this.dataSource
      .getRepository(Log)
      .createQueryBuilder("log")
      .leftJoin("log.user", "user")
      .select("log.userId", "userId")
      .addSelect("user.nickname", "nickname")
      .addSelect("user.avatarUrl", "avatarUrl")
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :expense THEN log.amount ELSE 0 END), 0)",
        "expense"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :income THEN log.amount ELSE 0 END), 0)",
        "income"
      )
      .addSelect("COUNT(*)", "count")
      .where("log.workspaceId = :workspaceId", { workspaceId })
      .setParameter("expense", LogType.EXPENSE)
      .setParameter("income", LogType.INCOME)
      .groupBy("log.userId")
      .addGroupBy("user.nickname")
      .addGroupBy("user.avatarUrl")
      .orderBy("expense", "DESC");

    this.applyFilters(qb, query);

    const result = await qb.getRawMany();
    return result.map((r) => ({
      userId: r.userId,
      nickname: r.nickname ?? null,
      avatarUrl: r.avatarUrl,
      expense: Number(r.expense),
      income: Number(r.income),
      count: Number(r.count),
    }));
  }

  /**
   * 요약 통계
   */
  async getSummary(
    workspaceId: number,
    query: StatsQuery
  ): Promise<StatsSummary> {
    const qb = this.dataSource
      .getRepository(Log)
      .createQueryBuilder("log")
      .select(
        "COALESCE(SUM(CASE WHEN log.type = :expense THEN log.amount ELSE 0 END), 0)",
        "totalExpense"
      )
      .addSelect(
        "COALESCE(SUM(CASE WHEN log.type = :income THEN log.amount ELSE 0 END), 0)",
        "totalIncome"
      )
      .where("log.workspaceId = :workspaceId", { workspaceId })
      .setParameter("expense", LogType.EXPENSE)
      .setParameter("income", LogType.INCOME);

    this.applyFilters(qb, query);

    const result = await qb.getRawOne();
    const totalExpense = Number(result?.totalExpense ?? 0);
    const totalIncome = Number(result?.totalIncome ?? 0);

    return {
      totalExpense,
      totalIncome,
      balance: totalIncome - totalExpense,
    };
  }

  /**
   * 전체 통계 조회
   */
  async getStats(workspaceId: number, query: StatsQuery) {
    const [dailyData, methodStats, categoryStats, userStats, summary] =
      await Promise.all([
        this.getDailyStats(workspaceId, query),
        this.getMethodStats(workspaceId, query),
        this.getCategoryStats(workspaceId, query),
        this.getUserStats(workspaceId, query),
        this.getSummary(workspaceId, query),
      ]);

    return {
      dailyData,
      methodStats,
      categoryStats,
      userStats,
      summary,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private applyFilters(qb: any, query: StatsQuery): void {
    if (query.startDate) {
      qb.andWhere("log.date >= :startDate", { startDate: query.startDate });
    }
    if (query.endDate) {
      qb.andWhere("log.date <= :endDate", { endDate: query.endDate });
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
