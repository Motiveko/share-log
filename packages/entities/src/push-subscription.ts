import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

@Entity({ name: "PushSubscription" })
export class PushSubscription {
  @PrimaryGeneratedColumn()
  id: number;

  @Index()
  @Column({ type: "text" })
  endpoint: string;

  @Column({ type: "text" })
  p256dh: string;

  @Column({ type: "text" })
  auth: string;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt: Date;

  /**
   * User 엔티티와의 관계를 FK 컬럼으로 대체
   * 기존 ManyToOne 관계는 자동으로 "userId" 컬럼을 생성하므로 동일한 컬럼명 사용
   *
   * 주의: 이 방식은 TypeORM의 자동 CASCADE를 사용할 수 없음
   * DB 레벨에서 FK constraint와 CASCADE를 직접 설정해야 함
   */
  @Index()
  @Column({ type: "int", nullable: false })
  userId: number;
}
