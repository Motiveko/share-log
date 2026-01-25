import { NotificationSetting } from "@repo/entities/notification-setting";
import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class NotificationSettingRepository extends Repository<NotificationSetting> {
  constructor(private dataSource: DataSource) {
    super(NotificationSetting, dataSource.createEntityManager());
  }

  /**
   * 워크스페이스와 유저로 알림 설정 조회
   */
  findByWorkspaceAndUser(workspaceId: number, userId: number) {
    return this.findOne({
      where: { workspaceId, userId },
    });
  }

  /**
   * 워크스페이스의 모든 알림 설정 조회
   */
  findByWorkspace(workspaceId: number) {
    return this.find({
      where: { workspaceId },
      relations: ["user"],
    });
  }

  /**
   * 특정 알림 타입이 활성화된 워크스페이스 멤버 조회
   */
  async findEnabledMembersForNotification(
    workspaceId: number,
    notificationType: string,
    excludeUserId?: number
  ): Promise<NotificationSetting[]> {
    const qb = this.createQueryBuilder("ns")
      .innerJoinAndSelect("ns.user", "user")
      .where("ns.workspaceId = :workspaceId", { workspaceId })
      .andWhere("ns.enabledTypes @> :notificationType", {
        notificationType: JSON.stringify([notificationType]),
      });

    if (excludeUserId !== undefined) {
      qb.andWhere("ns.userId != :excludeUserId", { excludeUserId });
    }

    return qb.getMany();
  }
}
