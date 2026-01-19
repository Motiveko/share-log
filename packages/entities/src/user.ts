import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from "typeorm";
import { AuthProvider } from "./auth-provider";

// 애플리케이션의 사용자 계정 엔티티
@Entity("User")
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  @Index()
  email?: string;

  // 닉네임 (필수값, 최초 로그인 후 설정 필요)
  @Column({ nullable: true })
  @Index()
  nickname?: string;

  // 프로필 사진 URL
  @Column({ nullable: true })
  avatarUrl?: string;

  // Slack 웹훅 URL (개인 알림용)
  @Column({ nullable: true })
  slackWebhookUrl?: string;

  // 프로필 설정 완료 여부 (닉네임 설정 완료 시 true)
  @Column({ default: false })
  isProfileComplete: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AuthProvider, (authProvider) => authProvider.user, {
    eager: true,
    cascade: true,
  })
  authProviders: AuthProvider[];

  patch(
    dto: Partial<
      Pick<typeof this, "nickname" | "avatarUrl" | "slackWebhookUrl">
    >
  ) {
    Object.assign(this, dto);
    // 닉네임이 설정되면 프로필 완료로 표시
    if (dto.nickname) {
      this.isProfileComplete = true;
    }
    return this;
  }
}
