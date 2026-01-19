import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index, // Index 추가
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

  @Column({ nullable: true })
  displayName?: string;

  // 프로필 사진 URL
  @Column({ nullable: true })
  avatarUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => AuthProvider, (authProvider) => authProvider.user, {
    eager: true, // User 엔티티를 조회할 때 연결된 AuthProvider 정보도 함께 로드 (선택적)
    cascade: true, // User 저장 시 연결된 AuthProvider도 함께 저장/업데이트
  })
  authProviders: AuthProvider[];

  patch(dto: Partial<Pick<typeof this, "displayName" | "avatarUrl">>) {
    Object.assign(this, dto);
    return this;
  }
}
