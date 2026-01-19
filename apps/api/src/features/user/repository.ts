import { User } from "@repo/entities/user";
import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({ where: { id } });
  }
}
