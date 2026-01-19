import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./user";

@Entity("Workspace")
export class Workspace {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 썸네일 이미지 URL
  @Column({ nullable: true })
  thumbnailUrl?: string;

  // 배너 이미지 URL
  @Column({ nullable: true })
  bannerUrl?: string;

  // 워크스페이스 생성자 (Master)
  @ManyToOne(() => User)
  @JoinColumn({ name: "creatorId" })
  creator: User;

  @Column()
  creatorId: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
