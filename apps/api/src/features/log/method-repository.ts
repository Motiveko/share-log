import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { LogMethod, DefaultMethodType } from "@repo/entities/log-method";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class MethodRepository extends Repository<LogMethod> {
  constructor(private dataSource: DataSource) {
    super(LogMethod, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({ where: { id } });
  }

  findByWorkspaceId(workspaceId: number) {
    return this.find({
      where: { workspaceId },
      order: { sortOrder: "ASC", id: "ASC" },
    });
  }

  findByWorkspaceAndName(workspaceId: number, name: string) {
    return this.findOne({ where: { workspaceId, name } });
  }

  async getMaxSortOrder(workspaceId: number): Promise<number> {
    const result = await this.createQueryBuilder("method")
      .select("MAX(method.sortOrder)", "maxOrder")
      .where("method.workspaceId = :workspaceId", { workspaceId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }

  /**
   * 워크스페이스에 기본 수단 생성
   */
  async createDefaultMethods(workspaceId: number): Promise<LogMethod[]> {
    const defaultMethods = [
      { defaultType: DefaultMethodType.CREDIT_CARD, name: "신용카드", sortOrder: 1 },
      { defaultType: DefaultMethodType.DEBIT_CARD, name: "체크카드", sortOrder: 2 },
      { defaultType: DefaultMethodType.CASH, name: "현금", sortOrder: 3 },
    ];

    const methods = defaultMethods.map((m) => {
      const method = new LogMethod();
      method.workspaceId = workspaceId;
      method.defaultType = m.defaultType;
      method.name = m.name;
      method.sortOrder = m.sortOrder;
      return method;
    });

    return this.save(methods);
  }
}
