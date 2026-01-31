import { Config } from "@api/config/env";
import { toNumber } from "lodash";
import { singleton } from "tsyringe";
import { DataSource as TypeOrmDataSource } from "typeorm";
// User & Auth
import { User } from "@repo/entities/user";
import { AuthProvider } from "@repo/entities/auth-provider";
import { PushSubscription } from "@repo/entities/push-subscription";
// Workspace
import { Workspace } from "@repo/entities/workspace";
import { WorkspaceMember } from "@repo/entities/workspace-member";
import { Invitation } from "@repo/entities/invitation";
// Log
import { Log } from "@repo/entities/log";
import { LogCategory } from "@repo/entities/log-category";
import { LogMethod } from "@repo/entities/log-method";
// Adjustment
import { Adjustment } from "@repo/entities/adjustment";
// Settings
import { NotificationSetting } from "@repo/entities/notification-setting";
// Notification
import { Notification } from "@repo/entities/notification";

const entities = [
  // User & Auth
  User,
  AuthProvider,
  PushSubscription,
  // Workspace
  Workspace,
  WorkspaceMember,
  Invitation,
  // Log
  Log,
  LogCategory,
  LogMethod,
  // Adjustment
  Adjustment,
  // Settings
  NotificationSetting,
  // Notification
  Notification,
];

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
      // datasource를 동적으로 불러오지 않는 이유
      // 빌드시 번들링을 하지 않아야하는데 이런 설정이 꽤 복잡해진다.
      // dev/prod 환경 분기처리 필요해짐(js, ts 분기)
      // 엔티티가 무한정 늘어나는게 아니기때문에 엔티티 파일을 모두 명시해준다.
      entities,
      migrations: ["dist/migrations/**/*.js"],
      logging: ["error"],
      synchronize: Boolean(Config.TYPEORM_SYNCHRONIZE),
    });
  }
}
