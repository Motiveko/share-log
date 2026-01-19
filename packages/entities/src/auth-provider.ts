import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  Unique,
} from "typeorm";
import { User } from "./user";

type ProviderType = "google" | "github" | "kakao";

// 여러 인증 제공자 정보를 담을 엔티티
@Entity("AuthProvider")
@Unique(["provider", "providerId"]) // 동일 제공자 내에서는 providerId가 유일해야 함
export class AuthProvider {
  @PrimaryGeneratedColumn("uuid") // 또는 그냥 정수 ID를 사용해도 무방
  id: string;

  @Column({ type: "varchar" })
  provider: ProviderType; // 'google', 'github', 'kakao'

  @Column()
  providerId: string;

  @Column({ type: "jsonb", nullable: true })
  profileData?: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // User 엔티티와의 관계 설정 (ManyToOne)
  @ManyToOne(() => User, (user) => user.authProviders, {
    // 사용자가 삭제될 때 연결된 AuthProvider 정보도 함께 삭제 (선택적)
    onDelete: "CASCADE",
  })
  user: User;

  @Column() // User ID를 외래키로 직접 관리할 수도 있음
  userId: number; // User 엔티티의 Primary Key 타입과 일치시켜야 함
}
