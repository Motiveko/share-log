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
import { User } from "./user";
import { Workspace } from "./workspace";

export enum MemberRole {
  MASTER = "master",
  MEMBER = "member",
}

export enum MemberStatus {
  PENDING = "pending", // 초대중
  ACCEPTED = "accepted", // 수락
  REJECTED = "rejected", // 거부
  EXPELLED = "expelled", // 추방
}

@Entity("WorkspaceMember")
@Unique(["workspaceId", "userId"])
export class WorkspaceMember {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;

  @Column({ type: "varchar", default: MemberRole.MEMBER })
  role: MemberRole;

  @Column({ type: "varchar", default: MemberStatus.PENDING })
  status: MemberStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
