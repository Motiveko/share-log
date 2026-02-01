import { singleton } from "tsyringe";
import { Workspace } from "@repo/entities/workspace";
import { WorkspaceMember, MemberRole, MemberStatus } from "@repo/entities/workspace-member";
import { WorkspaceRepository } from "@api/features/workspace/workspace-repository";
import { MemberRepository } from "@api/features/workspace/member-repository";
import { LastVisitService } from "@api/features/workspace/last-visit-service";
import { InvitationService } from "@api/features/invitation/invitation-service";
import { MethodService } from "@api/features/log/method-service";
import { CreateWorkspaceRequestDto, UpdateWorkspaceRequestDto } from "@api/features/workspace/dto";
import { NotFoundError } from "@api/errors/not-found";
import { ActionQueuePublisher } from "@api/lib/action-queue";
import logger from "@api/lib/logger";

@singleton()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly memberRepository: MemberRepository,
    private readonly lastVisitService: LastVisitService,
    private readonly invitationService: InvitationService,
    private readonly methodService: MethodService,
    private readonly actionQueuePublisher: ActionQueuePublisher
  ) {}

  /**
   * 워크스페이스 생성 + 생성자를 MASTER 멤버로 추가 + 초대 생성
   */
  async create(userId: number, dto: CreateWorkspaceRequestDto): Promise<Workspace> {
    // 워크스페이스 생성
    const workspace = new Workspace();
    workspace.name = dto.name;
    workspace.thumbnailUrl = dto.thumbnailUrl;
    workspace.bannerUrl = dto.bannerUrl;
    workspace.creatorId = userId;

    const savedWorkspace = await this.workspaceRepository.save(workspace);

    // 생성자를 MASTER 멤버로 추가
    const member = new WorkspaceMember();
    member.workspaceId = savedWorkspace.id;
    member.userId = userId;
    member.role = MemberRole.MASTER;
    member.status = MemberStatus.ACCEPTED;

    await this.memberRepository.save(member);

    // 마지막 방문 워크스페이스 갱신
    await this.lastVisitService.set(userId, savedWorkspace.id);

    // 기본 결제 수단 생성
    await this.methodService.createDefaultMethods(savedWorkspace.id);

    // 초대 생성 (inviteeEmails가 있는 경우)
    if (dto.inviteeEmails && dto.inviteeEmails.length > 0) {
      await this.createInvitations(savedWorkspace.id, userId, dto.inviteeEmails);
    }

    return savedWorkspace;
  }

  /**
   * 워크스페이스에 여러 사용자 초대 생성 (실패해도 워크스페이스 생성은 유지)
   */
  private async createInvitations(
    workspaceId: number,
    inviterId: number,
    inviteeEmails: string[]
  ): Promise<void> {
    for (const email of inviteeEmails) {
      try {
        await this.invitationService.create(workspaceId, inviterId, email);
      } catch (error) {
        // 개별 초대 실패는 로그만 남기고 계속 진행
        logger.warn({ message: `워크스페이스 생성 시 초대 실패 - email: ${email}`, error });
      }
    }
  }

  /**
   * 사용자의 워크스페이스 목록 조회 (멤버 수 포함)
   */
  async findAllByUserId(userId: number) {
    return this.workspaceRepository.findAllWithMemberCountByUserId(userId);
  }

  /**
   * 워크스페이스 상세 조회 (멤버 수 포함)
   */
  async findById(userId: number, workspaceId: number) {
    const workspace = await this.workspaceRepository.findWithMemberCount(workspaceId);
    if (!workspace) {
      throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");
    }

    // 마지막 방문 워크스페이스 갱신
    await this.lastVisitService.set(userId, workspaceId);

    return workspace;
  }

  /**
   * 워크스페이스 수정 (MASTER만 가능)
   */
  async update(workspaceId: number, dto: UpdateWorkspaceRequestDto): Promise<Workspace> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");
    }

    if (dto.name !== undefined) workspace.name = dto.name;
    if (dto.thumbnailUrl !== undefined) workspace.thumbnailUrl = dto.thumbnailUrl;
    if (dto.bannerUrl !== undefined) workspace.bannerUrl = dto.bannerUrl;

    return this.workspaceRepository.save(workspace);
  }

  /**
   * 워크스페이스 삭제 (MASTER만 가능)
   */
  async delete(workspaceId: number, requestUserId: number): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");
    }

    // 삭제 전 멤버 목록 조회 (알림 발송용)
    const members = await this.memberRepository.findAcceptedMembersWithUser(workspaceId);
    const recipientIds = members
      .map((m) => m.userId)
      .filter((userId) => userId !== requestUserId);

    // 삭제 알림 이벤트 발행 (DB 삭제 전에 발행)
    if (recipientIds.length > 0) {
      await this.actionQueuePublisher.publish({
        type: "deleted",
        aggregateType: "workspace",
        aggregateId: workspaceId,
        userId: requestUserId,
        payload: {
          workspaceId,
          workspaceName: workspace.name,
          recipientIds,
        },
      });
    }

    await this.workspaceRepository.remove(workspace);
  }

  /**
   * 워크스페이스 존재 여부 확인
   */
  async exists(workspaceId: number): Promise<boolean> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    return workspace !== null;
  }

  /**
   * 마지막 방문 워크스페이스 조회
   */
  async getLastVisitWorkspaceId(userId: number): Promise<number | null> {
    const workspaceId = await this.lastVisitService.get(userId);
    if (!workspaceId) return null;

    // 해당 워크스페이스의 멤버인지 확인
    const member = await this.memberRepository.findAcceptedByWorkspaceAndUser(
      workspaceId,
      userId
    );

    if (!member) {
      // 멤버가 아니면 마지막 방문 기록 삭제
      await this.lastVisitService.delete(userId);
      return null;
    }

    return workspaceId;
  }
}
