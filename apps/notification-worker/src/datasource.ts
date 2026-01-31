import { toNumber } from "lodash";
import { singleton } from "tsyringe";
import { DataSource as TypeOrmDataSource } from "typeorm";
import { AuthProvider } from "@repo/entities/auth-provider";
import { PushSubscription } from "@repo/entities/push-subscription";
import { NotificationSetting } from "@repo/entities/notification-setting";
import { Notification } from "@repo/entities/notification";
import { User } from "@repo/entities/user";
import { WorkspaceMember } from "@repo/entities/workspace-member";
import { Workspace } from "@repo/entities/workspace";
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
      entities: [
        AuthProvider,
        PushSubscription,
        NotificationSetting,
        Notification,
        User,
        WorkspaceMember,
        Workspace,
      ],
      migrations: ["dist/migrations/**/*.js"],
      logging: ["error"],
      synchronize: Boolean(Config.TYPEORM_SYNCHRONIZE),
    });
  }
}
