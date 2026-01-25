// Adjustment interfaces

export enum AdjustmentStatus {
  CREATED = "created", // 생성됨
  COMPLETED = "completed", // 정산 완료됨
}

// 송금 정보
export interface TransferInfo {
  fromUserId: number;
  fromUserNickname: string;
  toUserId: number;
  toUserNickname: string;
  amount: number;
}

// 개인별 지출 정보
export interface UserExpense {
  userId: number;
  nickname: string;
  totalExpense: number;
  shouldPay: number; // 1인당 부담 금액
  difference: number; // 차액 (양수: 돈 받을 금액, 음수: 보내야 할 금액)
}

// 정산 결과
export interface AdjustmentResult {
  totalExpense: number; // 총 지출 금액
  perPersonAmount: number; // 1인당 부담 금액
  userExpenses: UserExpense[]; // 개인별 지출 정보
  transfers: TransferInfo[]; // 송금 정보 리스트
}

// 정산 기본 인터페이스
export interface Adjustment {
  id: number;
  workspaceId: number;
  name: string;
  startDate: Date;
  endDate: Date;
  categoryIds: number[];
  methodIds: number[];
  participantIds: number[];
  status: AdjustmentStatus;
  result?: AdjustmentResult;
  creatorId: number;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// 생성자 정보 포함한 응답용 인터페이스
export interface AdjustmentWithCreator extends Adjustment {
  creator: {
    id: number;
    nickname?: string | null;
    avatarUrl?: string;
  };
}

// DTOs
export interface CreateAdjustmentDto {
  name: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  categoryIds?: number[];
  methodIds?: number[];
  participantIds?: number[];
}

export interface UpdateAdjustmentDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  categoryIds?: number[];
  methodIds?: number[];
  participantIds?: number[];
}

// Query/Response
export interface AdjustmentListQuery {
  status?: AdjustmentStatus;
  page?: number; // default: 1
  limit?: number; // default: 20
}

export interface AdjustmentListResponse {
  adjustments: AdjustmentWithCreator[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
