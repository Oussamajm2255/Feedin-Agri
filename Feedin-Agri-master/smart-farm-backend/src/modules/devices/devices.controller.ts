import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserRole } from '../../entities/user.entity';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query('includeSensors') includeSensors?: string, @Request() req?: any) {
    const shouldIncludeSensors = includeSensors === 'true';
    // For admin users, don't filter by owner - show all devices
    // For regular users, filter by their owner_id
    const user = req?.user;
    const userRole = user?.role;
    const userId = user?.user_id;
    
    console.log('🔍 DevicesController.findAll - User info:', {
      user_id: userId,
      role: userRole,
      roleType: typeof userRole,
      roleValue: userRole,
      email: user?.email
    });
    
    // Check if user is admin or moderator
    // Handle both enum (UserRole.ADMIN) and string ('admin') values
    const roleString = typeof userRole === 'string' ? userRole.toLowerCase() : String(userRole).toLowerCase();
    const isAdmin = roleString === 'admin' || userRole === UserRole.ADMIN;
    const isModerator = roleString === 'moderator' || userRole === UserRole.MODERATOR;
    
    // For admin/moderator, don't filter by owner (show all devices)
    // For regular users, filter by their owner_id
    const ownerId = (isAdmin || isModerator) ? undefined : userId;
    
    console.log('🔍 DevicesController.findAll - Filter decision:', {
      roleString,
      isAdmin,
      isModerator,
      ownerId: ownerId || 'undefined (showing all devices)',
      willFilterByOwner: !!ownerId
    });
    
    const devices = await this.devicesService.findAll(shouldIncludeSensors, ownerId);
    console.log(`📤 DevicesController.findAll - Returning ${devices.length} devices`);
    
    // Log first device if available
    if (devices.length > 0) {
      console.log('📤 First device in response:', {
        device_id: devices[0].device_id,
        name: devices[0].name,
        farm_id: devices[0].farm_id
      });
    }
    
    return devices;
  }

  @Get('statistics')
  async getStatistics() {
    return this.devicesService.getDeviceStatistics();
  }

  @Get('by-status/:status')
  async findByStatus(@Param('status') status: string) {
    return this.devicesService.getDevicesByStatus(status);
  }

  // @Get('by-type/:type')
  // async findByType(@Param('type') type: string) {
  //   return this.devicesService.getDevicesByType(type);
  // }

  @Get('by-farm/:farmId')
  async findByFarm(@Param('farmId') farmId: string) {
    return this.devicesService.getDevicesByFarm(farmId);
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeSensors') includeSensors?: string
  ) {
    const shouldIncludeSensors = includeSensors === 'true';
    return this.devicesService.findOne(id, shouldIncludeSensors);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.devicesService.update(id, updateDeviceDto);
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string }
  ) {
    return this.devicesService.updateDeviceStatus(id, body.status);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.devicesService.remove(id);
    return { message: 'Device deleted successfully' };
  }
}
