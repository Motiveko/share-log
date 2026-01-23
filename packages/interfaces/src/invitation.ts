// Invitation interfaces

export enum InvitationStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  CANCELLED = "cancelled",
}

export interface Invitation {
  id: number;
  workspaceId: number;
  inviterId: number;
  inviteeEmail: string;
  inviteeId?: number;
  status: InvitationStatus;
  emailSent: boolean;
  emailSentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Response types with relations
export interface InvitationWithWorkspace extends Invitation {
  workspace: {
    id: number;
    name: string;
    thumbnailUrl?: string | null;
  };
  inviter: {
    id: number;
    email: string;
    nickname?: string | null;
    avatarUrl?: string;
  };
}

// DTOs
export interface CreateInvitationDto {
  inviteeEmail: string;
}

export interface UpdateInvitationDto {
  action: "accepted" | "rejected";
}
