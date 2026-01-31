import { singleton, inject, delay } from "tsyringe";
import { Invitation, InvitationStatus } from "@repo/entities/invitation";
import { MemberRole, MemberStatus } from "@repo/entities/workspace-member";
import { ERROR_CODES } from "@repo/interfaces";
import { InvitationRepository } from "@api/features/invitation/invitation-repository";
import { UserService } from "@api/features/user/service";
import { MemberService } from "@api/features/workspace/member-service";
import { WorkspaceService } from "@api/features/workspace/workspace-service";
import { WorkspaceRepository } from "@api/features/workspace/workspace-repository";
import { ActionQueuePublisher } from "@api/lib/action-queue";
import { NotFoundError } from "@api/errors/not-found";
import { ForbiddenError } from "@api/errors/forbidden";
import { BadRequestError } from "@api/errors/bad-request";
import { NotificationSettingService } from "@api/features/notification-setting/notification-setting-service";

@singleton()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userService: UserService,
    private readonly memberService: MemberService,
    @inject(delay(() => WorkspaceService))
    private readonly workspaceService: WorkspaceService,
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly actionQueuePublisher: ActionQueuePublisher,
    private readonly notificationSettingService: NotificationSettingService
  ) {}

  /**
   * 초대 생성
   */
  async create(
    workspaceId: number,
    inviterId: number,
    inviteeEmail: string
  ): Promise<Invitation> {
    // 워크스페이스 존재 확인
    const workspaceExists = await this.workspaceService.exists(workspaceId);
    if (!workspaceExists) {
      throw new NotFoundError(
        "워크스페이스를 찾을 수 없습니다.",
        ERROR_CODES.WORKSPACE_NOT_FOUND
      );
    }

    // 이메일로 사용자 조회
    const invitee = await this.userService.findByEmail(inviteeEmail);

    // 이미 ACCEPTED 멤버인지 확인
    if (invitee) {
      const isAlreadyMember = await this.memberService.isAcceptedMember(
        workspaceId,
        invitee.id
      );
      if (isAlreadyMember) {
        throw new BadRequestError(
          "이미 워크스페이스 멤버입니다.",
          ERROR_CODES.ALREADY_MEMBER
        );
      }
    }

    // 이미 PENDING 초대가 있는지 확인
    const existingInvitation =
      await this.invitationRepository.findPendingByWorkspaceAndEmail(
        workspaceId,
        inviteeEmail
      );
    if (existingInvitation) {
      throw new BadRequestError(
        "이미 초대가 진행 중입니다.",
        ERROR_CODES.ALREADY_INVITED
      );
    }

    // 자기 자신 초대 방지
    const inviter = await this.userService.getById(inviterId);
    if (inviter && inviter.email === inviteeEmail) {
      throw new BadRequestError(
        "자기 자신을 초대할 수 없습니다.",
        ERROR_CODES.CANNOT_INVITE_SELF
      );
    }

    // 초대 생성
    const invitation = new Invitation();
    invitation.workspaceId = workspaceId;
    invitation.inviterId = inviterId;
    invitation.inviteeEmail = inviteeEmail;
    if (invitee) {
      invitation.inviteeId = invitee.id;
    }
    invitation.status = InvitationStatus.PENDING;

    const saved = await this.invitationRepository.save(invitation);

    // 초대 이메일 발송 이벤트 발행
    await this.publishInvitationCreatedEvent(saved, inviterId);

    return saved;
  }

  /**
   * 내가 받은 초대 목록 조회
   */
  async findMyInvitations(
    userEmail: string,
    userId?: number
  ): Promise<Invitation[]> {
    // 이메일 기반 조회
    const emailInvitations =
      await this.invitationRepository.findPendingByInviteeEmail(userEmail);

    // userId가 있으면 userId 기반 조회도 수행 후 합치기
    if (userId) {
      const userIdInvitations =
        await this.invitationRepository.findPendingByInviteeId(userId);

      // 중복 제거하여 합치기
      const invitationMap = new Map<number, Invitation>();
      [...emailInvitations, ...userIdInvitations].forEach((inv) => {
        invitationMap.set(inv.id, inv);
      });

      return Array.from(invitationMap.values()).sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
    }

    return emailInvitations;
  }

  /**
   * 초대 수락
   */
  async accept(invitationId: number, userId: number): Promise<void> {
    const invitation =
      await this.invitationRepository.findByIdWithRelations(invitationId);

    if (!invitation) {
      throw new NotFoundError(
        "초대를 찾을 수 없습니다.",
        ERROR_CODES.INVITATION_NOT_FOUND
      );
    }

    // 본인의 초대인지 확인
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new NotFoundError(
        "사용자를 찾을 수 없습니다.",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    const isMyInvitation =
      invitation.inviteeId === userId || invitation.inviteeEmail === user.email;

    if (!isMyInvitation) {
      throw new ForbiddenError(
        "본인의 초대만 수락할 수 있습니다.",
        ERROR_CODES.NOT_YOUR_INVITATION
      );
    }

    // PENDING 상태인지 확인
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError(
        "이미 처리된 초대입니다.",
        ERROR_CODES.INVITATION_ALREADY_PROCESSED
      );
    }

    // 이미 멤버인지 확인 (중복 가입 방지)
    const isAlreadyMember = await this.memberService.isAcceptedMember(
      invitation.workspaceId,
      userId
    );
    if (isAlreadyMember) {
      throw new BadRequestError(
        "이미 워크스페이스 멤버입니다.",
        ERROR_CODES.ALREADY_MEMBER
      );
    }

    // WorkspaceMember 생성
    await this.memberService.createMember(
      invitation.workspaceId,
      userId,
      MemberRole.MEMBER,
      MemberStatus.ACCEPTED
    );

    // 새 멤버의 기본 알림 설정 생성
    await this.notificationSettingService.createDefaultForMember(
      invitation.workspaceId,
      userId
    );

    // 초대 상태 변경
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.inviteeId = userId;
    await this.invitationRepository.save(invitation);

    // 멤버 참여 이벤트 발행
    await this.publishMemberJoinedEvent(invitation.workspaceId, userId, user);
  }

  /**
   * 초대 거절
   */
  async reject(invitationId: number, userId: number): Promise<void> {
    const invitation =
      await this.invitationRepository.findByIdWithRelations(invitationId);

    if (!invitation) {
      throw new NotFoundError(
        "초대를 찾을 수 없습니다.",
        ERROR_CODES.INVITATION_NOT_FOUND
      );
    }

    // 본인의 초대인지 확인
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new NotFoundError(
        "사용자를 찾을 수 없습니다.",
        ERROR_CODES.USER_NOT_FOUND
      );
    }

    const isMyInvitation =
      invitation.inviteeId === userId || invitation.inviteeEmail === user.email;

    if (!isMyInvitation) {
      throw new ForbiddenError(
        "본인의 초대만 거절할 수 있습니다.",
        ERROR_CODES.NOT_YOUR_INVITATION
      );
    }

    // PENDING 상태인지 확인
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError(
        "이미 처리된 초대입니다.",
        ERROR_CODES.INVITATION_ALREADY_PROCESSED
      );
    }

    // 초대 상태 변경
    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepository.save(invitation);
  }

  /**
   * 워크스페이스의 PENDING 초대 목록 조회
   */
  async findPendingByWorkspace(workspaceId: number): Promise<Invitation[]> {
    return this.invitationRepository.findPendingByWorkspace(workspaceId);
  }

  /**
   * 초대 취소
   * Master 또는 초대한 본인만 취소 가능
   */
  async cancel(
    invitationId: number,
    userId: number,
    workspaceId: number
  ): Promise<void> {
    const invitation =
      await this.invitationRepository.findByIdWithRelations(invitationId);

    if (!invitation) {
      throw new NotFoundError(
        "초대를 찾을 수 없습니다.",
        ERROR_CODES.INVITATION_NOT_FOUND
      );
    }

    // 워크스페이스 일치 확인
    if (invitation.workspaceId !== workspaceId) {
      throw new NotFoundError(
        "초대를 찾을 수 없습니다.",
        ERROR_CODES.INVITATION_NOT_FOUND
      );
    }

    // PENDING 상태인지 확인
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError(
        "이미 처리된 초대입니다.",
        ERROR_CODES.INVITATION_ALREADY_PROCESSED
      );
    }

    // 권한 확인: Master이거나 초대한 본인만 취소 가능
    const isMaster = await this.memberService.isMaster(workspaceId, userId);
    const isInviter = invitation.inviterId === userId;

    if (!isMaster && !isInviter) {
      throw new ForbiddenError(
        "초대를 취소할 권한이 없습니다.",
        ERROR_CODES.CANNOT_CANCEL_INVITATION
      );
    }

    // 초대 상태 변경
    invitation.status = InvitationStatus.CANCELLED;
    await this.invitationRepository.save(invitation);
  }

  /**
   * 초대 생성 이벤트 발행 (이메일 발송용)
   */
  private async publishInvitationCreatedEvent(
    invitation: Invitation,
    inviterId: number
  ): Promise<void> {
    try {
      const [workspace, inviter] = await Promise.all([
        this.workspaceRepository.findById(invitation.workspaceId),
        this.userService.getById(inviterId),
      ]);

      await this.actionQueuePublisher.publish({
        type: "created",
        aggregateType: "invitation",
        aggregateId: invitation.id,
        userId: inviterId,
        payload: {
          invitationId: invitation.id,
          workspaceId: invitation.workspaceId,
          workspaceName: workspace?.name ?? "",
          inviterEmail: inviter?.email ?? "",
          inviterNickname: inviter?.nickname ?? "",
          inviteeEmail: invitation.inviteeEmail,
        },
      });
    } catch (error) {
      // 이벤트 발행 실패해도 메인 로직에 영향 주지 않음
      console.error("Failed to publish invitation created event:", error);
    }
  }

  /**
   * 멤버 참여 이벤트 발행
   */
  private async publishMemberJoinedEvent(
    workspaceId: number,
    userId: number,
    user: { email?: string; nickname?: string | null }
  ): Promise<void> {
    try {
      const workspace = await this.workspaceRepository.findById(workspaceId);

      await this.actionQueuePublisher.publish({
        type: "joined",
        aggregateType: "member",
        aggregateId: userId,
        userId,
        payload: {
          workspaceId,
          workspaceName: workspace?.name ?? "",
          userId,
          userNickname: user.nickname ?? user.email ?? "",
        },
      });
    } catch (error) {
      // 이벤트 발행 실패해도 메인 로직에 영향 주지 않음
      console.error("Failed to publish member joined event:", error);
    }
  }
}
