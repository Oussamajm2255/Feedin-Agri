// src/modules/farms/farm.entity.ts
import { Entity, PrimaryColumn, Column, OneToMany, ManyToOne, ManyToMany, JoinColumn, JoinTable, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Sensor } from '../../entities/sensor.entity';
import { Device } from '../../entities/device.entity';
import { User } from '../../entities/user.entity';
import { Zone } from '../../entities/zone.entity';

@Entity('farms')
export class Farm {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  farm_id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  location: string;

  @Column({ type: 'decimal', precision: 10, scale: 8, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 36, nullable: true })
  owner_id: string;

  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;

  @UpdateDateColumn({ type: 'timestamp', precision: 6 })
  updated_at: Date;

  // Admin metadata fields (stored in DB)
  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  city: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  region: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  @Index()
  country: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  area_hectares: number;

  @Column({ type: 'varchar', length: 20, nullable: true, default: 'active' })
  @Index()
  status: 'active' | 'inactive';

  // Relationship with User (owner)
  @ManyToOne(() => User, (user) => user.farms)
  @JoinColumn({ name: 'owner_id' })
  owner: Promise<User>;

  // Relationship with Moderators (many-to-many via junction table)
  @ManyToMany(() => User, (user) => user.moderatedFarms)
  @JoinTable({
    name: 'farm_moderators',
    joinColumn: { name: 'farm_id', referencedColumnName: 'farm_id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'user_id' },
  })
  assigned_moderators: User[];

  // Relationship with Sensors
  @OneToMany(() => Sensor, (sensor) => sensor.farm)
  sensors: Sensor[];

  // Relationship with Devices
  @OneToMany(() => Device, (device) => device.farm)
  devices: Device[];

  // Relationship with Zones
  @OneToMany(() => Zone, (zone) => zone.farm)
  zones: Zone[];
}