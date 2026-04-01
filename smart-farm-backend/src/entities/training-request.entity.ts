import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
} from "typeorm";
import { randomUUID } from "crypto";

/**
 * Status lifecycle for training requests:
 * new → contacted → scheduled → completed → archived
 */
export type TrainingRequestStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "completed"
  | "archived";

/**
 * Training levels matching the Formation page offerings:
 * - level_1: Agriculture Connectée — Niveau 1 (Fondamentaux)
 * - level_2: Gestion de Serre Intelligente — Niveau 2 (Avancé)
 * - level_3: Administration & Techniques Avancées — Niveau 3 (Expert)
 */
export type TrainingType = "level_1" | "level_2" | "level_3";

@Entity("training_requests")
export class TrainingRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: "varchar", length: 200 })
  full_name: string;

  @Index("idx_training_requests_email")
  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 20 })
  training_type: TrainingType;

  @Column({ type: "varchar", length: 50, nullable: true })
  farm_size?: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  region?: string;

  @Column({ type: "text", nullable: true })
  message?: string;

  @Index("idx_training_requests_status")
  @Column({ type: "varchar", length: 20, default: "new" })
  status: TrainingRequestStatus;

  @Index("idx_training_requests_created")
  @CreateDateColumn({ type: "timestamp", precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 6 })
  updated_at: Date;
}
