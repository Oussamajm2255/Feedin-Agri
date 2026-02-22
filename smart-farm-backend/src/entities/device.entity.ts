import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, OneToMany, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Farm } from '../modules/farms/farm.entity';
import { Zone } from './zone.entity';

@Entity('devices')
export class Device {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  device_id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 255, default: 'offline' })
  status: string; // 'online', 'offline', 'maintenance'

  @Column({ type: 'varchar', length: 36 })
  farm_id: string;

  // Optional Zone association
  @Index()
  @Column({ type: 'uuid', nullable: true })
  zone_id: string | null;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  // @Column({ type: 'varchar', length: 50, nullable: true })
  // device_type: string; // 'sensor_hub', 'gateway', 'controller'

  // @Column({ type: 'text', nullable: true })
  // description: string;

  // @Column({ type: 'varchar', length: 45, nullable: true })
  // ip_address: string;

  // @Column({ type: 'varchar', length: 17, nullable: true })
  // mac_address: string;

  // @Column({ type: 'varchar', length: 20, nullable: true })
  // firmware_version: string;

  // @Column({ type: 'datetime', nullable: true })
  // last_seen: Date;

  // Relationship with Farm
  @ManyToOne(() => Farm, (farm) => farm.devices)
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  // Relationship with Zone (optional)
  @ManyToOne(() => Zone, (zone) => zone.devices, { nullable: true })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;

  // Relationship with Sensors (one device can have many sensors)
  @OneToMany('Sensor', (sensor: any) => sensor.device, { lazy: true })
  sensors: Promise<any[]>;
}