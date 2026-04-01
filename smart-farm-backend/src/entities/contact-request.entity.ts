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
 * Status lifecycle for contact requests:
 * new → contacted → converted → archived
 */
export type ContactRequestStatus =
  | "new"
  | "contacted"
  | "converted"
  | "archived";

@Entity("contact_requests")
export class ContactRequest {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: "varchar", length: 100 })
  first_name: string;

  @Column({ type: "varchar", length: 100 })
  last_name: string;

  @Index("idx_contact_requests_email")
  @Column({ type: "varchar", length: 255 })
  email: string;

  @Column({ type: "varchar", length: 30, nullable: true })
  phone?: string;

  @Column({ type: "varchar", length: 100 })
  project_type: string;

  @Column({ type: "text" })
  message: string;

  @Index("idx_contact_requests_status")
  @Column({ type: "varchar", length: 20, default: "new" })
  status: ContactRequestStatus;

  @Index("idx_contact_requests_created")
  @CreateDateColumn({ type: "timestamp", precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: "timestamp", precision: 6 })
  updated_at: Date;
}
