import { singleton } from "tsyringe";
import {
  WorkspaceMember,
  MemberRole,
  MemberStatus,
} from "@repo/entities/workspace-member";
import { ERROR_CODES } from "@repo/interfaces";
import { MemberRepository } from "@api/features/workspace/member-repository";
import { WorkspaceRepository } from "@api/features/workspace/workspace-repository";
import { UserService } from "@api/features/user/service";
import { ActionQueuePublisher } from "@api/lib/action-queue";
import { NotFoundError } from "@api/errors/not-found";
import { ForbiddenError } from "@api/errors/forbidden";

@singleton()
export class MemberService {
  constructor(
    private readonly memberRepository: MemberRepository,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly userService: UserService,
    private readonly actionQueuePublisher: ActionQueuePublisher
  ) {}

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
   * 해당 사용자가 워크스페이스의 MASTER인지 확인
   */
  async isMaster(workspaceId: number, userId: number): Promise<boolean> {
    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      userId
    );
    return member !== null && member.role === MemberRole.MASTER;
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
    newRole: MemberRole,
    requestUserId: number
  ) {
    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      targetUserId
    );

    if (!member) {
      throw new NotFoundError(
        "멤버를 찾을 수 없습니다.",
        ERROR_CODES.MEMBER_NOT_FOUND
      );
    }

    // MASTER → MEMBER로 강등 시, 마지막 MASTER인지 확인
    if (member.role === MemberRole.MASTER && newRole === MemberRole.MEMBER) {
      const masterCount =
        await this.memberRepository.countMastersByWorkspace(workspaceId);
      if (masterCount <= 1) {
        throw new ForbiddenError(
          "워크스페이스에는 최소 1명의 MASTER가 필요합니다.",
          ERROR_CODES.LAST_MASTER_CANNOT_LEAVE
        );
      }
    }

    member.role = newRole;
    const saved = await this.memberRepository.save(member);

    // 이벤트 발행
    await this.publishMemberEvent(
      "role_changed",
      workspaceId,
      targetUserId,
      requestUserId,
      newRole
    );

    return saved;
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
      throw new ForbiddenError(
        "자기 자신을 추방할 수 없습니다.",
        ERROR_CODES.CANNOT_EXPEL_SELF
      );
    }

    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      targetUserId
    );

    if (!member) {
      throw new NotFoundError(
        "멤버를 찾을 수 없습니다.",
        ERROR_CODES.MEMBER_NOT_FOUND
      );
    }

    // MASTER 추방 시, 마지막 MASTER인지 확인
    if (member.role === MemberRole.MASTER) {
      const masterCount =
        await this.memberRepository.countMastersByWorkspace(workspaceId);
      if (masterCount <= 1) {
        throw new ForbiddenError(
          "워크스페이스에는 최소 1명의 MASTER가 필요합니다.",
          ERROR_CODES.LAST_MASTER_CANNOT_LEAVE
        );
      }
    }

    // 레코드 삭제 대신 status를 EXPELLED로 변경
    member.status = MemberStatus.EXPELLED;
    const saved = await this.memberRepository.save(member);

    // 이벤트 발행
    await this.publishMemberEvent(
      "left",
      workspaceId,
      targetUserId,
      requestUserId
    );

    return saved;
  }

  /**
   * 멤버 이벤트 발행 헬퍼
   */
  private async publishMemberEvent(
    type: "joined" | "left" | "role_changed",
    workspaceId: number,
    targetUserId: number,
    requestUserId: number,
    newRole?: MemberRole
  ): Promise<void> {
    try {
      const [workspace, targetUser] = await Promise.all([
        this.workspaceRepository.findById(workspaceId),
        this.userService.getById(targetUserId),
      ]);

      await this.actionQueuePublisher.publish({
        type,
        aggregateType: "member",
        aggregateId: targetUserId,
        userId: requestUserId,
        payload: {
          workspaceId,
          workspaceName: workspace?.name ?? "",
          userId: targetUserId,
          userNickname: targetUser?.nickname ?? targetUser?.email ?? "",
          targetUserId,
          targetUserNickname: targetUser?.nickname ?? targetUser?.email ?? "",
          newRole: newRole ?? undefined,
        },
      });
    } catch (error) {
      // 이벤트 발행 실패해도 메인 로직에 영향 주지 않음
      console.error("Failed to publish member event:", error);
    }
  }
}
