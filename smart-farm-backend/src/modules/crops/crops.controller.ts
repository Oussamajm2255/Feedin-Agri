import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CropsService } from './crops.service';
import { CreateCropDto } from './dto/create-crop.dto';
import { UpdateCropDto } from './dto/update-crop.dto';

/**
 * CropsController
 * 
 * Business Rules Implemented:
 * - All endpoints require authentication (JwtAuthGuard)
 * - User ID is extracted from JWT and passed to service
 * - Service handles access control based on user's farm access
 * - Grouping endpoints available for admin users
 */
@Controller('crops')
@UseGuards(JwtAuthGuard)
export class CropsController {
  constructor(private readonly cropsService: CropsService) {}

  // ============================================
  // BASIC CRUD ENDPOINTS
  // ============================================

  /**
   * Create a new crop
   * Requires farm_id in body - user must have access to that farm
   */
  @Post()
  async create(@Body() createCropDto: CreateCropDto, @Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.create(createCropDto, userId);
  }

  /**
   * Get all crops accessible by the current user
   * - Farmers: only crops from their farms
   * - Moderators: crops from farms they moderate
   * - Admins: all crops
   */
  @Get()
  async findAll(
    @Request() req: any,
    @Query('includeFarm') includeFarm?: string,
  ) {
    const userId = req.user.user_id || req.user.sub;
    const shouldIncludeFarm = includeFarm === 'true';
    return this.cropsService.findAll(userId, shouldIncludeFarm);
  }

  /**
   * Get crops by status (filtered by user access)
   */
  @Get('by-status/:status')
  async findByStatus(@Param('status') status: string, @Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropsByStatus(status, userId);
  }

  /**
   * Get crops by date range (filtered by user access)
   */
  @Get('by-date-range')
  async findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Request() req: any,
  ) {
    const userId = req.user.user_id || req.user.sub;
    const start = new Date(startDate);
    const end = new Date(endDate);
    return this.cropsService.getCropsByDateRange(start, end, userId);
  }

  /**
   * Get crops by farm (validates user has access to farm)
   */
  @Get('by-farm/:farmId')
  async findByFarm(@Param('farmId') farmId: string, @Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropsByFarm(farmId, userId);
  }

  // ============================================
  // GROUPING ENDPOINTS (For dropdown/filter UI)
  // ============================================

  /**
   * Get crops grouped by farm
   * Useful for admin dashboards and grouping views
   */
  @Get('grouped/by-farm')
  async getGroupedByFarm(@Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropsGroupedByFarm(userId);
  }

  /**
   * Get crops grouped by growth stage
   * Useful for monitoring crop lifecycle
   */
  @Get('grouped/by-growth-stage')
  async getGroupedByGrowthStage(@Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropsGroupedByGrowthStage(userId);
  }

  /**
   * Get crops grouped by planting date (month)
   * Useful for seasonal analysis
   */
  @Get('grouped/by-planting-date')
  async getGroupedByPlantingDate(@Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropsGroupedByPlantingDate(userId);
  }

  // ============================================
  // DASHBOARD ENDPOINT - OPTIMIZED SINGLE CALL
  // ============================================

  /**
   * Get comprehensive dashboard data for a crop
   * Includes farm sensors, KPIs, health status, statistics
   */
  @Get(':id/dashboard')
  async getDashboard(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropDashboard(id, userId);
  }

  // ============================================
  // SUSTAINABILITY METRICS ENDPOINT
  // ============================================

  /**
   * Get sustainability metrics for a crop
   * Based on farm sensor data and action logs
   */
  @Get(':id/sustainability')
  async getSustainability(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getSustainabilityMetrics(id, userId);
  }

  // ============================================
  // COMPARISON ENDPOINT
  // ============================================

  /**
   * Compare crop metrics with farm average, last season, or another crop
   */
  @Get(':id/comparison')
  async getComparison(
    @Param('id') id: string,
    @Query('mode') mode: 'farm_avg' | 'last_season' | 'other_crop' = 'farm_avg',
    @Query('compareCropId') compareCropId?: string,
    @Request() req?: any,
  ) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.getCropComparison(id, userId, mode, compareCropId);
  }

  // ============================================
  // SINGLE CROP ENDPOINTS
  // ============================================

  /**
   * Get a single crop by ID
   * User must have access to the crop's farm
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Query('includeFarm') includeFarm?: string,
    @Request() req?: any,
  ) {
    const userId = req.user.user_id || req.user.sub;
    const shouldIncludeFarm = includeFarm === 'true';
    return this.cropsService.findOne(id, userId, shouldIncludeFarm);
  }

  /**
   * Update a crop
   * User must have access to the crop's farm
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCropDto: UpdateCropDto,
    @Request() req: any,
  ) {
    const userId = req.user.user_id || req.user.sub;
    return this.cropsService.update(id, updateCropDto, userId);
  }

  /**
   * Delete a crop
   * User must have access to the crop's farm
   */
  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req: any) {
    const userId = req.user.user_id || req.user.sub;
    await this.cropsService.remove(id, userId);
    return { message: 'Crop deleted successfully' };
  }
}
