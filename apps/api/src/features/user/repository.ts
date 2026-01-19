import { User } from "@repo/entities/user";
import { Repository, ILike } from "typeorm";
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

  searchByNicknameOrEmail(query: string, limit: number = 10) {
    return this.find({
      where: [
        { nickname: ILike(`%${query}%`) },
        { email: ILike(`%${query}%`) },
      ],
      take: limit,
    });
  }
}
