import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';
import { Farm } from '../modules/farms/farm.entity';
import { Zone } from './zone.entity';

/**
 * Crop Entity
 * 
 * Business Rules:
 * - Every crop MUST belong to a farm (farm_id is required)
 * - Crops have NO direct relationship with sensors
 * - Sensors belong to farms/fields, not to crops
 * - Farmers can only see crops from their farms (ownership or moderation)
 * - Admins can see all crops
 */
@Entity('crops')
export class Crop {
  @PrimaryColumn({ type: 'varchar', length: 36 })
  crop_id: string;

  // Required: Every crop must belong to a farm
  @Column({ type: 'varchar', length: 36 })
  farm_id: string;

  // Zone association — crops are planted per Zone
  @Index()
  @Column({ type: 'uuid', nullable: true })
  zone_id: string | null;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  variety: string;

  @Column({ type: 'date', nullable: true })
  planting_date: Date;

  @Column({ type: 'date', nullable: true })
  expected_harvest_date: Date;

  @Column({ type: 'varchar', length: 50, default: 'planted' })
  status: string; // 'planted', 'growing', 'harvested', 'failed'

  @Column({ type: 'text', nullable: true })
  notes: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relationship with Farm (required)
  @ManyToOne(() => Farm, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'farm_id' })
  farm: Farm;

  // Relationship with Zone
  @ManyToOne(() => Zone, (zone) => zone.crops, { nullable: true })
  @JoinColumn({ name: 'zone_id' })
  zone: Zone;
}
