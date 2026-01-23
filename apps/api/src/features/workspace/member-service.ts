import { singleton } from "tsyringe";
import {
  WorkspaceMember,
  MemberRole,
  MemberStatus,
} from "@repo/entities/workspace-member";
import { MemberRepository } from "@api/features/workspace/member-repository";
import { NotFoundError } from "@api/errors/not-found";
import { ForbiddenError } from "@api/errors/forbidden";

@singleton()
export class MemberService {
  constructor(private readonly memberRepository: MemberRepository) {}

  /**
   * 워크스페이스의 ACCEPTED 멤버 목록 조회
   */
  async findMembersByWorkspace(workspaceId: number) {
    return this.memberRepository.findAcceptedMembersWithUser(workspaceId);
  }

  /**
   * 워크스페이스와 사용자로 ACCEPTED 멤버 조회
   */
  async findAcceptedByWorkspaceAndUser(
    workspaceId: number,
    userId: number
  ): Promise<WorkspaceMember | null> {
    return this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      userId
    );
  }

  /**
   * 해당 사용자가 워크스페이스의 ACCEPTED 멤버인지 확인
   */
  async isAcceptedMember(workspaceId: number, userId: number): Promise<boolean> {
    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      userId
    );
    return member !== null;
  }

  /**
   * 새 멤버 생성
   */
  async createMember(
    workspaceId: number,
    userId: number,
    role: MemberRole,
    status: MemberStatus
  ): Promise<WorkspaceMember> {
    const member = new WorkspaceMember();
    member.workspaceId = workspaceId;
    member.userId = userId;
    member.role = role;
    member.status = status;

    return this.memberRepository.save(member);
  }

  /**
   * 멤버 권한 변경 (MASTER만 가능)
   */
  async updateRole(
    workspaceId: number,
    targetUserId: number,
    newRole: MemberRole
  ) {
    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      targetUserId
    );

    if (!member) {
      throw new NotFoundError("멤버를 찾을 수 없습니다.");
    }

    // MASTER → MEMBER로 강등 시, 마지막 MASTER인지 확인
    if (member.role === MemberRole.MASTER && newRole === MemberRole.MEMBER) {
      const masterCount =
        await this.memberRepository.countMastersByWorkspace(workspaceId);
      if (masterCount <= 1) {
        throw new ForbiddenError(
          "워크스페이스에는 최소 1명의 MASTER가 필요합니다."
        );
      }
    }

    member.role = newRole;
    return this.memberRepository.save(member);
  }

  /**
   * 멤버 추방 (MASTER만 가능, status를 EXPELLED로 변경)
   */
  async expelMember(
    workspaceId: number,
    targetUserId: number,
    requestUserId: number
  ) {
    // 자기 자신은 추방 불가
    if (targetUserId === requestUserId) {
      throw new ForbiddenError("자기 자신을 추방할 수 없습니다.");
    }

    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      targetUserId
    );

    if (!member) {
      throw new NotFoundError("멤버를 찾을 수 없습니다.");
    }

    // MASTER 추방 시, 마지막 MASTER인지 확인
    if (member.role === MemberRole.MASTER) {
      const masterCount =
        await this.memberRepository.countMastersByWorkspace(workspaceId);
      if (masterCount <= 1) {
        throw new ForbiddenError(
          "워크스페이스에는 최소 1명의 MASTER가 필요합니다."
        );
      }
    }

    // 레코드 삭제 대신 status를 EXPELLED로 변경
    member.status = MemberStatus.EXPELLED;
    return this.memberRepository.save(member);
  }
}
