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
import { User } from "./user";
import { Workspace } from "./workspace";
import { LogCategory } from "./log-category";
import { LogMethod } from "./log-method";

export enum LogType {
  EXPENSE = "expense", // 지출
  INCOME = "income", // 수입
}

@Entity("Log")
@Index(["workspaceId", "date"])
@Index(["workspaceId", "userId"])
@Index(["workspaceId", "categoryId"])
@Index(["workspaceId", "methodId"])
export class Log {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  // 지출/수입 구분
  @Column({ type: "varchar" })
  type: LogType;

  // 카테고리
  @ManyToOne(() => LogCategory, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "categoryId" })
  category?: LogCategory | null;

  @Column({ nullable: true })
  categoryId?: number | null;

  // 결제 수단
  @ManyToOne(() => LogMethod, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "methodId" })
  method?: LogMethod | null;

  @Column({ nullable: true })
  methodId?: number | null;

  // 날짜
  @Column({ type: "date" })
  date: Date;

  // 금액 (소수점 2자리까지, 원화 기준 정수 사용도 가능)
  @Column({ type: "decimal", precision: 15, scale: 2 })
  amount: number;

  // 메모
  @Column({ nullable: true, type: "text" })
  memo?: string | null;

  // 작성자
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
