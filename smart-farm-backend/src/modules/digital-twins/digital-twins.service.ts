import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DigitalTwin } from '../../entities/digital-twin.entity';
import { CreateDigitalTwinDto } from './dto/create-digital-twin.dto';
import { UpdateDigitalTwinDto } from './dto/update-digital-twin.dto';

@Injectable()
export class DigitalTwinsService {
  constructor(
    @InjectRepository(DigitalTwin)
    private readonly digitalTwinRepository: Repository<DigitalTwin>,
  ) {}

  async create(createDto: CreateDigitalTwinDto): Promise<DigitalTwin> {
    const twin = this.digitalTwinRepository.create(createDto);
    return this.digitalTwinRepository.save(twin);
  }

  async findAllByFarm(farmId: string): Promise<DigitalTwin[]> {
    return this.digitalTwinRepository.find({
      where: { farm_id: farmId },
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<DigitalTwin> {
    const twin = await this.digitalTwinRepository.findOne({ where: { id } });
    if (!twin) {
      throw new NotFoundException(`Digital Twin with ID ${id} not found`);
    }
    return twin;
  }

  async update(id: string, updateDto: UpdateDigitalTwinDto): Promise<DigitalTwin> {
    const twin = await this.findOne(id);
    const updated = this.digitalTwinRepository.merge(twin, updateDto);
    return this.digitalTwinRepository.save(updated);
  }

  async updateMediaUrl(id: string, mediaUrl: string): Promise<DigitalTwin> {
    const twin = await this.findOne(id);
    twin.media_url = mediaUrl;
    return this.digitalTwinRepository.save(twin);
  }

  async remove(id: string): Promise<void> {
    const twin = await this.findOne(id);
    await this.digitalTwinRepository.remove(twin);
  }
}
