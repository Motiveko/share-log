import {
  WorkspaceMember,
  MemberStatus,
  MemberRole,
} from "@repo/entities/workspace-member";
import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class MemberRepository extends Repository<WorkspaceMember> {
  constructor(private dataSource: DataSource) {
    super(WorkspaceMember, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({ where: { id } });
  }

  findByWorkspaceAndUser(workspaceId: number, userId: number) {
    return this.findOne({
      where: { workspaceId, userId },
    });
  }

  findAcceptedByWorkspaceAndUser(workspaceId: number, userId: number) {
    return this.findOne({
      where: { workspaceId, userId, status: MemberStatus.ACCEPTED },
    });
  }

  findMasterByWorkspaceAndUser(workspaceId: number, userId: number) {
    return this.findOne({
      where: {
        workspaceId,
        userId,
        status: MemberStatus.ACCEPTED,
        role: MemberRole.MASTER,
      },
    });
  }

  /**
   * 워크스페이스의 ACCEPTED 멤버 목록 조회 (유저 정보 포함)
   */
  findAcceptedMembersWithUser(workspaceId: number) {
    return this.find({
      where: { workspaceId, status: MemberStatus.ACCEPTED },
      relations: ["user"],
      order: { createdAt: "ASC" },
    });
  }

  /**
   * 워크스페이스의 MASTER 수 조회
   */
  async countMastersByWorkspace(workspaceId: number): Promise<number> {
    return this.count({
      where: {
        workspaceId,
        status: MemberStatus.ACCEPTED,
        role: MemberRole.MASTER,
      },
    });
  }
}
