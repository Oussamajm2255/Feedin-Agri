import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { FarmsService } from './farms.service';
import { Farm } from './farm.entity';
import { CreateFarmDto } from './dto/create-farm.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';

@Controller('farms')
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('includeDevices') includeDevices?: string, @Request() req?: any): Promise<Farm[]> {
    const shouldIncludeDevices = includeDevices === 'true';
    const user = req?.user;
    
    // Admin users can see all farms, regular users only see their own farms
    const ownerId = user?.role === UserRole.ADMIN ? undefined : user?.user_id;
    
    return this.farmsService.findAll(shouldIncludeDevices, ownerId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeDevices') includeDevices?: string,
    @Query('includeSensors') includeSensors?: string
  ): Promise<Farm> {
    const shouldIncludeDevices = includeDevices === 'true';
    const shouldIncludeSensors = includeSensors === 'true';
    return this.farmsService.findOne(id, shouldIncludeDevices, shouldIncludeSensors);
  }

  @Get(':id/devices')
  async getFarmDevices(@Param('id') id: string) {
    return this.farmsService.getFarmDevices(id);
  }

  @Get(':id/sensors')
  async getFarmSensors(@Param('id') id: string) {
    return this.farmsService.getFarmSensors(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() data: CreateFarmDto, @Request() req: any): Promise<Farm> {
    return this.farmsService.create(data, req.user.user_id);
  }
  @Post('request-access')
  @UseGuards(JwtAuthGuard)
  async requestAccess(@Request() req: any) {
    const user = req.user;
    return this.farmsService.requestAccess(user.user_id, user.email, `${user.first_name || ''} ${user.last_name || ''}`);
  }
}