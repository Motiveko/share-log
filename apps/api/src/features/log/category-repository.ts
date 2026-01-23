import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { LogCategory } from "@repo/entities/log-category";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class CategoryRepository extends Repository<LogCategory> {
  constructor(private dataSource: DataSource) {
    super(LogCategory, dataSource.createEntityManager());
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
    const result = await this.createQueryBuilder("category")
      .select("MAX(category.sortOrder)", "maxOrder")
      .where("category.workspaceId = :workspaceId", { workspaceId })
      .getRawOne();
    return result?.maxOrder ?? 0;
  }
}
