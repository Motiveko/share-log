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
import { Workspace } from "./workspace";

@Entity("LogCategory")
@Unique(["workspaceId", "name"])
export class LogCategory {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Workspace, { onDelete: "CASCADE" })
  @JoinColumn({ name: "workspaceId" })
  workspace: Workspace;

  @Column()
  workspaceId: number;

  @Column()
  name: string;

  // 정렬 순서
  @Column({ default: 0 })
  sortOrder: number;

  @Column({ type: "varchar", length: 7, nullable: true })
  color?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
