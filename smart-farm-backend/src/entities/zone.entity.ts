import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
} from 'typeorm';
import { Farm } from '../modules/farms/farm.entity';
import { Sensor } from './sensor.entity';
import { Crop } from './crop.entity';
import { Device } from './device.entity';

export type ZoneType = 'indoor' | 'outdoor' | 'greenhouse' | 'hydroponic';

/**
 * Zone Entity — The primary context boundary of the system.
 *
 * Business Rules:
 * - Every Zone belongs to exactly one Farm.
 * - Zone name must be unique within a Farm.
 * - Sensors, Crops, and (optionally) Devices are attached to Zones.
 * - Alerts and Recommendations are Zone-contextual.
 * - Zones are never hard-deleted; use soft-delete via deleted_at.
 */
@Entity('zones')
@Unique('UQ_zone_name_farm', ['farm_id', 'name'])
export class Zone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 36 })
  farm_id: string;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ type: 'varchar', length: 30, default: 'outdoor' })
  type: ZoneType;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_m2: number | null;

  @Column({ type: 'jsonb', nullable: true })
  coordinates: Record<string, any> | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: 'active' })
  @Index()
  status: 'active' | 'inactive';

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  @Column({ type: 'timestamp', precision: 6, nullable: true })
  deleted_at: Date | null;

  // ── Relations ──────────────────────────────────────────────

  @ManyToOne(() => Farm, (farm) => farm.zones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  @OneToMany(() => Sensor, (sensor) => sensor.zone)
  sensors: Sensor[];

  @OneToMany(() => Crop, (crop) => crop.zone)
  crops: Crop[];

  @OneToMany(() => Device, (device) => device.zone)
  devices: Device[];
}
