import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { Workspace } from "./workspace";
import { User } from "./user";

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

@Entity("Adjustment")
@Index(["workspaceId", "status"])
export class Adjustment {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  // 정산 이름
  @Column()
  name: string;

  // 정산 기간 시작일
  @Column({ type: "date" })
  startDate: Date;

  // 정산 기간 종료일
  @Column({ type: "date" })
  endDate: Date;

  // 정산 대상 카테고리 ID 목록 (빈 배열이면 전체)
  @Column({ type: "jsonb", default: [] })
  categoryIds: number[];

  // 정산 대상 수단 ID 목록 (빈 배열이면 전체)
  @Column({ type: "jsonb", default: [] })
  methodIds: number[];

  // 정산 참여자 ID 목록 (빈 배열이면 워크스페이스 전체 참여자)
  @Column({ type: "jsonb", default: [] })
  participantIds: number[];

  // 정산 상태
  @Column({ type: "varchar", default: AdjustmentStatus.CREATED })
  status: AdjustmentStatus;

  // 정산 결과 (정산 생성 시 계산되어 저장됨)
  @Column({ type: "jsonb", nullable: true })
  result?: AdjustmentResult;

  // 정산 생성자
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "creatorId" })
  creator: User;

  @Column()
  creatorId: number;

  // 정산 완료일
  @Column({ nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
