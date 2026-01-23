import { Workspace } from "@repo/entities/workspace";
import { WorkspaceMember, MemberStatus } from "@repo/entities/workspace-member";
import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class WorkspaceRepository extends Repository<Workspace> {
  constructor(private dataSource: DataSource) {
    super(Workspace, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({ where: { id } });
  }

  /**
   * 사용자가 ACCEPTED 상태인 멤버로 속한 워크스페이스 목록 조회
   */
  async findByUserId(userId: number): Promise<Workspace[]> {
    const memberRepository = this.dataSource.getRepository(WorkspaceMember);

    const members = await memberRepository.find({
      where: {
        userId,
        status: MemberStatus.ACCEPTED,
      },
      relations: ["workspace"],
    });

    return members.map((m) => m.workspace);
  }

  /**
   * 워크스페이스와 멤버 수 함께 조회
   */
  async findWithMemberCount(
    workspaceId: number
  ): Promise<(Workspace & { memberCount: number }) | null> {
    const result = await this.createQueryBuilder("workspace")
      .leftJoin(
        "WorkspaceMember",
        "member",
        "member.workspaceId = workspace.id AND member.status = :status",
        { status: MemberStatus.ACCEPTED }
      )
      .select("workspace.*")
      .addSelect("COUNT(member.id)", "memberCount")
      .where("workspace.id = :workspaceId", { workspaceId })
      .groupBy("workspace.id")
      .getRawOne();

    if (!result) return null;

    return {
      ...result,
      memberCount: parseInt(result.memberCount, 10),
    };
  }

  /**
   * 사용자의 워크스페이스 목록과 각 멤버 수 조회
   */
  async findAllWithMemberCountByUserId(
    userId: number
  ): Promise<(Workspace & { memberCount: number })[]> {
    const result = await this.createQueryBuilder("workspace")
      .innerJoin(
        "WorkspaceMember",
        "userMember",
        "userMember.workspaceId = workspace.id AND userMember.userId = :userId AND userMember.status = :status",
        { userId, status: MemberStatus.ACCEPTED }
      )
      .leftJoin(
        "WorkspaceMember",
        "member",
        "member.workspaceId = workspace.id AND member.status = :status",
        { status: MemberStatus.ACCEPTED }
      )
      .select("workspace.*")
      .addSelect("COUNT(DISTINCT member.id)", "memberCount")
      .groupBy("workspace.id")
      .orderBy("workspace.createdAt", "DESC")
      .getRawMany();

    return result.map((r) => ({
      ...r,
      memberCount: parseInt(r.memberCount, 10),
    }));
  }
}
