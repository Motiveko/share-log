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

// 알림 타입
export enum NotificationType {
  LOG_CREATED = "log_created", // Log 추가
  LOG_DELETED = "log_deleted", // Log 삭제
  ROLE_CHANGED = "role_changed", // 권한 변경
  ADJUSTMENT_CREATED = "adjustment_created", // 새로운 정산 생성
  ADJUSTMENT_COMPLETED = "adjustment_completed", // 정산 완료
  MEMBER_JOINED = "member_joined", // 새 멤버 참여
  MEMBER_LEFT = "member_left", // 멤버 탈퇴/추방
  WORKSPACE_DELETED = "workspace_deleted", // 워크스페이스 삭제
}

@Entity("NotificationSetting")
@Unique(["workspaceId", "userId"])
export class NotificationSetting {
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

  // 웹 푸시 알림 활성화 여부
  @Column({ default: true })
  webPushEnabled: boolean;

  // Slack 알림 활성화 여부 (유저의 slackWebhookUrl 사용)
  @Column({ default: false })
  slackEnabled: boolean;

  // 알림 받을 타입 목록 (기본값: 모두 활성화)
  @Column({
    type: "jsonb",
    default: [
      NotificationType.LOG_CREATED,
      NotificationType.LOG_DELETED,
      NotificationType.ROLE_CHANGED,
      NotificationType.ADJUSTMENT_CREATED,
      NotificationType.ADJUSTMENT_COMPLETED,
      NotificationType.MEMBER_JOINED,
      NotificationType.MEMBER_LEFT,
      NotificationType.WORKSPACE_DELETED,
    ],
  })
  enabledTypes: NotificationType[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
