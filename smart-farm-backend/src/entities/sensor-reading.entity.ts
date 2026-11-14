// src/entities/sensor-reading.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, PrimaryColumn, CreateDateColumn, Index } from 'typeorm';
import { Sensor } from './sensor.entity';

@Entity('sensor_readings')
export class SensorReading {
  // Note: Schema has composite PK (id, created_at) for partitioning
  // TypeORM will handle this, but we define id as primary for queries
  @PrimaryGeneratedColumn()
  id: number;

  // sensors.sensor_id is not unique (one physical sensor such as XY-MD02 has a
  // row per measured type), so Postgres cannot back this join with a foreign
  // key. Keep the relation for queries but don't emit the constraint, or
  // schema sync fails on an empty database.
  @ManyToOne(() => Sensor, (sensor) => sensor.readings, { createForeignKeyConstraints: false })
  @JoinColumn({ name: 'sensor_id', referencedColumnName: 'sensor_id' })
  sensor: Sensor;

  @Index('idx_sensor_readings_sensor_id')
  @Column({ type: 'varchar', length: 36 })
  sensor_id: string;

  @Column({ type: 'float', nullable: true })
  value1: number;

  @Column({ type: 'float', nullable: true })
  value2: number;

  @Index('idx_sensor_readings_created_at')
  @CreateDateColumn({ type: 'timestamp', precision: 6 })
  created_at: Date;
}