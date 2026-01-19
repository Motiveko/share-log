import { toNumber } from "lodash";
import { singleton } from "tsyringe";
import { DataSource as TypeOrmDataSource } from "typeorm";
import { PushSubscription } from "@repo/entities/push-subscription";
import { Config } from "@/config/env";

@singleton()
export class DataSource extends TypeOrmDataSource {
  constructor() {
    super({
      type: "postgres",
      username: Config.TYPEORM_USERNAME,
      password: Config.TYPEORM_PASSWORD,
      host: Config.TYPEORM_HOST,
      database: Config.TYPEORM_DATABASE,
      schema: Config.TYPEORM_SCHEMA,
      port: toNumber(Config.TYPEORM_PORT),
      entities: [PushSubscription],
      migrations: ["dist/migrations/**/*.js"],
      logging: ["error"],
      synchronize: Boolean(Config.TYPEORM_SYNCHRONIZE),
    });
  }
}
