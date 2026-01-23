import { Invitation, InvitationStatus } from "@repo/entities/invitation";
import { Repository } from "typeorm";
import { singleton } from "tsyringe";
import { DataSource } from "@api/lib/datasource";

@singleton()
export class InvitationRepository extends Repository<Invitation> {
  constructor(private dataSource: DataSource) {
    super(Invitation, dataSource.createEntityManager());
  }

  findById(id: number) {
    return this.findOne({ where: { id } });
  }

  findByIdWithRelations(id: number) {
    return this.findOne({
      where: { id },
      relations: ["workspace", "inviter"],
    });
  }

  /**
   * 워크스페이스와 이메일로 PENDING 초대 조회
   */
  findPendingByWorkspaceAndEmail(workspaceId: number, email: string) {
    return this.findOne({
      where: {
        workspaceId,
        inviteeEmail: email,
        status: InvitationStatus.PENDING,
      },
    });
  }

  /**
   * 이메일로 받은 PENDING 초대 목록 조회 (관계 포함)
   */
  findPendingByInviteeEmail(email: string) {
    return this.find({
      where: {
        inviteeEmail: email,
        status: InvitationStatus.PENDING,
      },
      relations: ["workspace", "inviter"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * userId로 받은 PENDING 초대 목록 조회 (관계 포함)
   */
  findPendingByInviteeId(userId: number) {
    return this.find({
      where: {
        inviteeId: userId,
        status: InvitationStatus.PENDING,
      },
      relations: ["workspace", "inviter"],
      order: { createdAt: "DESC" },
    });
  }

  /**
   * 워크스페이스의 초대 목록 조회
   */
  findByWorkspace(workspaceId: number) {
    return this.find({
      where: { workspaceId },
      relations: ["inviter", "invitee"],
      order: { createdAt: "DESC" },
    });
  }
}
