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

export enum InvitationStatus {
  PENDING = "pending", // 초대중
  ACCEPTED = "accepted", // 초대완료(수락)
  REJECTED = "rejected", // 초대거부
  CANCELLED = "cancelled", // 초대취소
}

@Entity("Invitation")
@Index(["workspaceId", "inviteeEmail"])
export class Invitation {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  // 초대하는 사람 (발신자)
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "inviterId" })
  inviter: User;

  @Column()
  inviterId: number;

  // 초대받는 사람의 이메일 (아직 가입하지 않은 유저도 초대 가능)
  @Column()
  @Index()
  inviteeEmail: string;

  // 초대받는 사람 (가입된 유저인 경우)
  @ManyToOne(() => User, { nullable: true, onDelete: "CASCADE" })
  @JoinColumn({ name: "inviteeId" })
  invitee?: User;

  @Column({ nullable: true })
  inviteeId?: number;

  // 이메일 발송 여부
  @Column({ default: false })
  emailSent: boolean;

  // 이메일 발송 시간
  @Column({ nullable: true })
  emailSentAt?: Date;

  @Column({ type: "varchar", default: InvitationStatus.PENDING })
  status: InvitationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
