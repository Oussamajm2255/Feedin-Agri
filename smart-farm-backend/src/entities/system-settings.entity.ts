import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('system_settings')
export class SystemSettings {
  @PrimaryColumn({ type: 'varchar', length: 50, default: 'main' })
  id: string;

  @Column({ type: 'jsonb' })
  settings: {
    general: {
      site_name: string;
      contact_email: string;
      maintenance_mode: boolean;
    };
    notifications: {
      email_enabled: boolean;
      sms_enabled: boolean;
    };
    security: {
      session_timeout: number;
      max_login_attempts: number;
    };
  };

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updated_at: Date;
}





