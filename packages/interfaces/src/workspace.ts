// Workspace interfaces

export enum MemberRole {
  MASTER = "master",
  MEMBER = "member",
}

export enum MemberStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EXPELLED = "expelled",
}

export interface Workspace {
  id: number;
  name: string;
  thumbnailUrl?: string | null;
  bannerUrl?: string | null;
  creatorId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceMember {
  id: number;
  workspaceId: number;
  userId: number;
  role: MemberRole;
  status: MemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

// DTOs
export interface CreateWorkspaceDto {
  name: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
  inviteeEmails?: string[];
}

export interface UpdateWorkspaceDto {
  name?: string;
  thumbnailUrl?: string;
  bannerUrl?: string;
}

export interface UpdateMemberRoleDto {
  role: MemberRole;
}

// Response types with relations
export interface WorkspaceWithMemberCount extends Workspace {
  memberCount: number;
}

export interface WorkspaceMemberWithUser extends WorkspaceMember {
  user: {
    id: number;
    email: string;
    nickname?: string | null;
    avatarUrl?: string;
  };
}
