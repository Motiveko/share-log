import { singleton } from "tsyringe";
import { Workspace } from "@repo/entities/workspace";
import { WorkspaceMember, MemberRole, MemberStatus } from "@repo/entities/workspace-member";
import { WorkspaceRepository } from "@api/features/workspace/workspace-repository";
import { MemberRepository } from "@api/features/workspace/member-repository";
import { LastVisitService } from "@api/features/workspace/last-visit-service";
import { CreateWorkspaceRequestDto, UpdateWorkspaceRequestDto } from "@api/features/workspace/dto";
import { NotFoundError } from "@api/errors/not-found";

@singleton()
export class WorkspaceService {
  constructor(
    private readonly workspaceRepository: WorkspaceRepository,
    private readonly memberRepository: MemberRepository,
    private readonly lastVisitService: LastVisitService
  ) {}

  /**
   * 워크스페이스 생성 + 생성자를 MASTER 멤버로 추가
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

    return savedWorkspace;
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
  async delete(workspaceId: number): Promise<void> {
    const workspace = await this.workspaceRepository.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError("워크스페이스를 찾을 수 없습니다.");
    }

    await this.workspaceRepository.remove(workspace);
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
