import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from "typeorm";
import { User } from "./user";
import { Workspace } from "./workspace";
import { NotificationType } from "./notification-setting";

// 인앱 알림 데이터 구조
export interface NotificationData {
  landingUrl?: string;
  mobileUrl?: string;
  entityId?: number;
  entityType?: string;
}

@Entity("Notification")
@Index(["userId", "createdAt"])
@Index(["userId", "isRead"])
export class Notification {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE", nullable: true })
  @JoinColumn({ name: "workspaceId" })
  workspace?: Workspace;

  @Column({ nullable: true })
  workspaceId?: number;

  @Column({ type: "varchar" })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: "jsonb", nullable: true })
  data?: NotificationData;

  @CreateDateColumn()
  createdAt: Date;
}
