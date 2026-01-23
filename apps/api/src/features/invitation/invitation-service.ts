import { singleton, inject, delay } from "tsyringe";
import { Invitation, InvitationStatus } from "@repo/entities/invitation";
import { MemberRole, MemberStatus } from "@repo/entities/workspace-member";
import { InvitationRepository } from "@api/features/invitation/invitation-repository";
import { UserService } from "@api/features/user/service";
import { MemberService } from "@api/features/workspace/member-service";
import { WorkspaceService } from "@api/features/workspace/workspace-service";
import { NotFoundError } from "@api/errors/not-found";
import { ForbiddenError } from "@api/errors/forbidden";
import { BadRequestError } from "@api/errors/bad-request";

@singleton()
export class InvitationService {
  constructor(
    private readonly invitationRepository: InvitationRepository,
    private readonly userService: UserService,
    private readonly memberService: MemberService,
    @inject(delay(() => WorkspaceService))
    private readonly workspaceService: WorkspaceService
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
      throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");
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
        throw new BadRequestError("이미 워크스페이스 멤버입니다.");
      }
    }

    // 이미 PENDING 초대가 있는지 확인
    const existingInvitation =
      await this.invitationRepository.findPendingByWorkspaceAndEmail(
        workspaceId,
        inviteeEmail
      );
    if (existingInvitation) {
      throw new BadRequestError("이미 초대가 진행 중입니다.");
    }

    // 자기 자신 초대 방지
    const inviter = await this.userService.getById(inviterId);
    if (inviter && inviter.email === inviteeEmail) {
      throw new BadRequestError("자기 자신을 초대할 수 없습니다.");
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

    return this.invitationRepository.save(invitation);
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
      throw new NotFoundError("초대를 찾을 수 없습니다.");
    }

    // 본인의 초대인지 확인
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.");
    }

    const isMyInvitation =
      invitation.inviteeId === userId || invitation.inviteeEmail === user.email;

    if (!isMyInvitation) {
      throw new ForbiddenError("본인의 초대만 수락할 수 있습니다.");
    }

    // PENDING 상태인지 확인
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError("이미 처리된 초대입니다.");
    }

    // 이미 멤버인지 확인 (중복 가입 방지)
    const isAlreadyMember = await this.memberService.isAcceptedMember(
      invitation.workspaceId,
      userId
    );
    if (isAlreadyMember) {
      throw new BadRequestError("이미 워크스페이스 멤버입니다.");
    }

    // WorkspaceMember 생성
    await this.memberService.createMember(
      invitation.workspaceId,
      userId,
      MemberRole.MEMBER,
      MemberStatus.ACCEPTED
    );

    // 초대 상태 변경
    invitation.status = InvitationStatus.ACCEPTED;
    invitation.inviteeId = userId;
    await this.invitationRepository.save(invitation);
  }

  /**
   * 초대 거절
   */
  async reject(invitationId: number, userId: number): Promise<void> {
    const invitation =
      await this.invitationRepository.findByIdWithRelations(invitationId);

    if (!invitation) {
      throw new NotFoundError("초대를 찾을 수 없습니다.");
    }

    // 본인의 초대인지 확인
    const user = await this.userService.getById(userId);
    if (!user) {
      throw new NotFoundError("사용자를 찾을 수 없습니다.");
    }

    const isMyInvitation =
      invitation.inviteeId === userId || invitation.inviteeEmail === user.email;

    if (!isMyInvitation) {
      throw new ForbiddenError("본인의 초대만 거절할 수 있습니다.");
    }

    // PENDING 상태인지 확인
    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestError("이미 처리된 초대입니다.");
    }

    // 초대 상태 변경
    invitation.status = InvitationStatus.REJECTED;
    await this.invitationRepository.save(invitation);
  }
}
