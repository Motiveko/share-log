import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from "typeorm";
import { Workspace } from "./workspace";

// 기본 제공 수단 타입
export enum DefaultMethodType {
  CREDIT_CARD = "credit_card", // 신용카드
  DEBIT_CARD = "debit_card", // 체크카드
  CASH = "cash", // 현금
}

@Entity("LogMethod")
@Unique(["workspaceId", "name"])
export class LogMethod {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  // 기본 제공 타입 (null이면 사용자 입력값)
  @Column({ type: "varchar", nullable: true })
  defaultType?: DefaultMethodType;

  // 수단 이름
  @Column()
  name: string;

  // 정렬 순서
  @Column({ default: 0 })
  sortOrder: number;

  // 기본 제공 여부
  get isDefault(): boolean {
    return this.defaultType !== null;
  }

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
