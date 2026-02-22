// src/modules/admin/admin.controller.ts
import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, UseGuards, ParseIntPipe, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminOverviewSummaryDto } from './dto/admin-overview-summary.dto';
import { AdminOverviewTrendsDto } from './dto/admin-overview-trends.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminUsersResponseDto } from './dto/admin-users-response.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /**
   * GET /admin/overview/summary
   * Get overview summary statistics for admin dashboard
   */
  @Get('overview/summary')
  async getOverviewSummary(): Promise<AdminOverviewSummaryDto> {
    return this.adminService.getOverviewSummary();
  }

  /**
   * GET /admin/overview/trends
   * Get overview trends data for charts
   * Query params: period (7days | 30days | 90days)
   */
  @Get('overview/trends')
  async getOverviewTrends(
    @Query('period') period?: '7days' | '30days' | '90days',
  ): Promise<AdminOverviewTrendsDto> {
    return this.adminService.getOverviewTrends(period || '30days');
  }

  /**
   * GET /admin/users
   * List all users with pagination, filtering, and search
   */
  @Get('users')
  async getUsers(@Query() query: AdminUsersQueryDto): Promise<AdminUsersResponseDto> {
    return this.adminService.getUsers(query);
  }

  /**
   * GET /admin/users/:id
   * Get single user by ID
   */
  @Get('users/:id')
  async getUser(@Param('id') userId: string) {
    return this.adminService.getUser(userId);
  }

  /**
   * POST /admin/users
   * Create a new user
   */
  @Post('users')
  async createUser(@Body() createUserDto: AdminCreateUserDto) {
    return this.adminService.createUser(createUserDto);
  }

  /**
   * PUT /admin/users/:id
   * Update user details/role
   */
  @Put('users/:id')
  async updateUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, updateUserDto);
  }

  /**
   * PATCH /admin/users/:id
   * Update user status (disable/activate) or specific fields
   */
  @Patch('users/:id')
  async patchUser(
    @Param('id') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.adminService.updateUser(userId, updateUserDto);
  }

  /**
   * POST /admin/users/:id/impersonate
   * Impersonate a user (admin can login as another user)
   */
  @Post('users/:id/impersonate')
  async impersonateUser(
    @Param('id') userId: string,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.adminService.impersonateUser(userId, req, res);
  }

  /**
   * DELETE /admin/users/:id
   * Delete user account
   */
  @Delete('users/:id')
  async deleteUser(@Param('id') userId: string) {
    return this.adminService.deleteUser(userId);
  }

  // ========================
  // SYSTEM HEALTH
  // ========================

  /**
   * GET /admin/system/health
   * Get overall system health status
   */
  @Get('system/health')
  async getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  /**
   * GET /admin/system/metrics
   * Get system performance metrics (CPU, memory, disk)
   */
  @Get('system/metrics')
  async getSystemMetrics() {
    return this.adminService.getSystemMetrics();
  }

  /**
   * GET /admin/system/uptime
   * Get system uptime statistics
   */
  @Get('system/uptime')
  async getSystemUptime() {
    return this.adminService.getSystemUptime();
  }

  // ========================
  // FARMERS
  // ========================

  /**
   * GET /admin/farmers
   * List all farmers with their farm assignments
   */
  @Get('farmers')
  async getFarmers(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getFarmers(pageNum, limitNum);
  }

  /**
   * GET /admin/farmers/:id/farms
   * Get farmer's assigned farms
   */
  @Get('farmers/:id/farms')
  async getFarmerFarms(@Param('id') farmerId: string) {
    return this.adminService.getFarmerFarms(farmerId);
  }

  /**
   * POST /admin/farmers/:id/assign-farm
   * Assign farm to farmer
   */
  @Post('farmers/:id/assign-farm')
  async assignFarmToFarmer(
    @Param('id') farmerId: string,
    @Body() body: { farm_id: string },
  ) {
    return this.adminService.assignFarmToFarmer(farmerId, body.farm_id);
  }

  // ========================
  // LOGS
  // ========================

  /**
   * GET /admin/logs
   * Get system logs with filtering
   */
  @Get('logs')
  async getSystemLogs(
    @Query('level') level?: string,
    @Query('module') module?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.adminService.getSystemLogs(level, module, limitNum, pageNum);
  }

  /**
   * GET /admin/audit-logs
   * Get audit trail logs
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('page') page?: string,
    @Query('userId') userId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    const pageNum = page ? parseInt(page, 10) : 1;
    return this.adminService.getAuditLogs(limitNum, pageNum, userId);
  }

  // ========================
  // ADMIN FARMS
  // ========================

  /**
   * GET /admin/farms
   * List all farms with details (admin view)
   */
  @Get('farms')
  async getAdminFarms(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getAdminFarms(pageNum, limitNum, search);
  }

  /**
   * POST /admin/farms
   * Create new farm
   */
  @Post('farms')
  async createAdminFarm(@Body() farmData: any) {
    return this.adminService.createAdminFarm(farmData);
  }

  /**
   * GET /admin/farms/:id
   * Get single farm with full details (admin)
   */
  @Get('farms/:id')
  async getAdminFarm(@Param('id') farmId: string) {
    return this.adminService.getAdminFarmDetails(farmId);
  }

  /**
   * PUT /admin/farms/:id
   * Update farm details
   */
  @Put('farms/:id')
  async updateAdminFarm(@Param('id') farmId: string, @Body() farmData: any) {
    return this.adminService.updateAdminFarm(farmId, farmData);
  }

  /**
   * PATCH /admin/farms/:id
   * Partial update of farm (for Farm Dialog)
   */
  @Patch('farms/:id')
  async patchAdminFarm(@Param('id') farmId: string, @Body() updates: any) {
    return this.adminService.patchAdminFarm(farmId, updates);
  }

  /**
   * GET /admin/farms/:id/activity
   * Get farm activity logs
   */
  @Get('farms/:id/activity')
  async getFarmActivity(
    @Param('id') farmId: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getFarmActivity(farmId, limitNum);
  }

  /**
   * DELETE /admin/farms/:id
   * Delete farm
   */
  @Delete('farms/:id')
  async deleteAdminFarm(@Param('id') farmId: string) {
    return this.adminService.deleteAdminFarm(farmId);
  }

  /**
   * GET /admin/sensors
   * Get sensors with admin filters
   */
  @Get('sensors')
  async getAdminSensors(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('farm_id') farm_id?: string,
    @Query('device_id') device_id?: string,
    @Query('type') type?: string,
    @Query('search') search?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return this.adminService.getAdminSensors({
      page: pageNum,
      limit: limitNum,
      farm_id,
      device_id,
      type,
      search,
    });
  }

  // ========================
  // ADMIN SETTINGS
  // ========================

  /**
   * GET /admin/settings
   * Get all system settings
   */
  @Get('settings')
  async getSettings() {
    return this.adminService.getSettings();
  }

  /**
   * PUT /admin/settings
   * Update system settings
   */
  @Put('settings')
  async updateSettings(@Body() settingsData: any) {
    return this.adminService.updateSettings(settingsData);
  }
}

