import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index, BeforeInsert } from 'typeorm';
import { randomUUID } from 'crypto';

export type AdminNotificationSeverity = 'critical' | 'warning' | 'info' | 'success';
export type AdminNotificationDomain = 'system' | 'farms' | 'devices' | 'crops' | 'users' | 'automation';
export type AdminNotificationStatus = 'new' | 'acknowledged' | 'resolved';

@Entity('admin_notifications')
export class AdminNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = randomUUID();
    }
  }

  @Column({ type: 'varchar', length: 100 })
  type: string; // e.g., 'mqtt_disconnect', 'user_registered', 'sensor_offline_spike'

  @Index('idx_admin_notifications_severity')
  @Column({ type: 'varchar', length: 10 })
  severity: AdminNotificationSeverity;

  @Index('idx_admin_notifications_domain')
  @Column({ type: 'varchar', length: 20 })
  domain: AdminNotificationDomain;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  message?: string;

  @Column({ type: 'jsonb', nullable: true })
  context?: {
    farmId?: string;
    farmName?: string;
    zoneId?: string;
    zoneName?: string;
    deviceId?: string;
    deviceName?: string;
    cropId?: string;
    cropName?: string;
    userId?: string;
    userName?: string;
    sensorId?: string;
    actionId?: string;
    rawPayload?: any;
    relatedEvents?: Array<{ timestamp: string; description: string }>;
    suggestedActions?: string[];
    [key: string]: any;
  };

  @Index('idx_admin_notifications_status')
  @Column({ type: 'varchar', length: 20, default: 'new' })
  status: AdminNotificationStatus;

  @Column({ type: 'boolean', default: false })
  pinned_until_resolved: boolean;

  @Index('idx_admin_notifications_created')
  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @Column({ type: 'timestamp', precision: 6, nullable: true })
  acknowledged_at?: Date;

  @Column({ type: 'timestamp', precision: 6, nullable: true })
  resolved_at?: Date;

  @Column({ type: 'varchar', length: 36, nullable: true })
  acknowledged_by?: string; // Admin user ID who acknowledged

  @Column({ type: 'varchar', length: 36, nullable: true })
  resolved_by?: string; // Admin user ID who resolved
}
