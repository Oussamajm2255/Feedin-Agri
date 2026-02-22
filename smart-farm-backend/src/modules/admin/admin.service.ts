// src/modules/admin/admin.service.ts
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, In } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import * as os from 'os';
import { User, UserRole, UserStatus } from '../../entities/user.entity';
import { Farm } from '../farms/farm.entity';
import { Device } from '../../entities/device.entity';
import { Sensor } from '../../entities/sensor.entity';
import { ActionLog } from '../../entities/action-log.entity';
import { Notification } from '../../entities/notification.entity';
import { SensorReading } from '../../entities/sensor-reading.entity';
import { AdminOverviewSummaryDto } from './dto/admin-overview-summary.dto';
import { AdminOverviewTrendsDto, TrendDataPoint } from './dto/admin-overview-trends.dto';
import { AdminUsersQueryDto } from './dto/admin-users-query.dto';
import { AdminUsersResponseDto, AdminUserListItemDto } from './dto/admin-users-response.dto';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { HealthService } from '../health/health.service';
import { FarmsService } from '../farms/farms.service';
import { SystemSettings } from '../../entities/system-settings.entity';

@Injectable()
export class AdminService {
  // In-memory cache for summary endpoint (30 seconds TTL)
  private summaryCache: { data: AdminOverviewSummaryDto; timestamp: number } | null = null;
  private readonly CACHE_TTL = 30000; // 30 seconds

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Farm)
    private readonly farmRepository: Repository<Farm>,
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
    @InjectRepository(Sensor)
    private readonly sensorRepository: Repository<Sensor>,
    @InjectRepository(ActionLog)
    private readonly actionLogRepository: Repository<ActionLog>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    @InjectRepository(SensorReading)
    private readonly sensorReadingRepository: Repository<SensorReading>,
    @InjectRepository(SystemSettings)
    private readonly systemSettingsRepository: Repository<SystemSettings>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly healthService: HealthService,
    private readonly farmsService: FarmsService,
  ) {}

  /**
   * Get overview summary statistics
   * Cached for 30 seconds to reduce database load
   */
  async getOverviewSummary(): Promise<AdminOverviewSummaryDto> {
    // Check cache
    const now = Date.now();
    if (this.summaryCache && (now - this.summaryCache.timestamp) < this.CACHE_TTL) {
      return this.summaryCache.data;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Execute all queries in parallel for better performance
    const [
      totalFarms,
      totalDevices,
      onlineDevices,
      offlineDevices,
      maintenanceDevices,
      totalSensors,
      totalUsers,
      totalFarmers,
      totalAdmins,
      activeUsers,
      alertsToday,
      criticalAlertsUnread,
      actionsToday,
      autoActionsToday,
      manualActionsToday,
    ] = await Promise.all([
      this.farmRepository.count(),
      this.deviceRepository.count(),
      this.deviceRepository.count({ where: { status: 'online' } }),
      this.deviceRepository.count({ where: { status: 'offline' } }),
      this.deviceRepository.count({ where: { status: 'maintenance' } }),
      this.sensorRepository.count(),
      this.userRepository.count(),
      this.userRepository.count({ where: { role: UserRole.FARMER } }),
      this.userRepository.count({ where: { role: UserRole.ADMIN } }),
      this.userRepository.count({ where: { status: UserStatus.ACTIVE } }),
      this.notificationRepository.count({
        where: {
          is_read: false,
          created_at: MoreThanOrEqual(today),
        },
      }),
      this.notificationRepository.count({
        where: {
          level: 'critical',
          is_read: false,
        },
      }),
      this.actionLogRepository.count({
        where: {
          created_at: MoreThanOrEqual(today),
        },
      }),
      this.actionLogRepository.count({
        where: {
          trigger_source: 'auto',
          created_at: MoreThanOrEqual(today),
        },
      }),
      this.actionLogRepository.count({
        where: {
          trigger_source: 'manual',
          created_at: MoreThanOrEqual(today),
        },
      }),
    ]);

    const summary: AdminOverviewSummaryDto = {
      totalFarms,
      totalDevices,
      onlineDevices,
      offlineDevices,
      maintenanceDevices,
      totalSensors,
      totalUsers,
      totalFarmers,
      totalAdmins,
      activeUsers,
      alertsToday,
      criticalAlertsUnread,
      actionsToday,
      autoActionsToday,
      manualActionsToday,
    };

    // Update cache
    this.summaryCache = {
      data: summary,
      timestamp: now,
    };

    return summary;
  }

  /**
   * Get overview trends data
   */
  async getOverviewTrends(period: '7days' | '30days' | '90days' = '30days'): Promise<AdminOverviewTrendsDto> {
    const days = period === '7days' ? 7 : period === '30days' ? 30 : 90;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    // Get device usage trends (devices created per day)
    const deviceUsage = await this.getDailyTrend(
      this.deviceRepository,
      'created_at',
      startDate,
      days,
    );

    // Get user activity trends (users with last_login per day)
    const userActivity = await this.getDailyTrend(
      this.userRepository,
      'last_login',
      startDate,
      days,
    );

    // Get action volume trends (actions per day)
    const actionVolume = await this.getDailyTrend(
      this.actionLogRepository,
      'created_at',
      startDate,
      days,
    );

    // Get sensor readings trends (readings per day)
    // Note: This requires sensor_readings table which might be partitioned
    // For now, we'll use a simplified approach
    const sensorReadings = await this.getSensorReadingsTrend(startDate, days);

    return {
      deviceUsage,
      userActivity,
      actionVolume,
      sensorReadings,
      period,
    };
  }

  /**
   * Helper method to get daily trends from any repository
   */
  private async getDailyTrend(
    repository: Repository<any>,
    dateColumn: string,
    startDate: Date,
    days: number,
  ): Promise<TrendDataPoint[]> {
    // Generate date range
    const dates: Date[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push(date);
    }

    // Query for each day using raw SQL for better performance
    const trends: TrendDataPoint[] = await Promise.all(
      dates.map(async (date) => {
        const nextDate = new Date(date);
        nextDate.setDate(nextDate.getDate() + 1);

        // Use query builder for date range counting
        const result = await repository
          .createQueryBuilder('entity')
          .select('COUNT(*)', 'count')
          .where(`entity.${dateColumn} >= :startDate`, { startDate: date })
          .andWhere(`entity.${dateColumn} < :endDate`, { endDate: nextDate })
          .getRawOne();

        return {
          date: date.toISOString().split('T')[0],
          value: parseInt(result?.count || '0', 10),
        };
      }),
    );

    return trends;
  }

  /**
   * Get sensor readings trend
   * Counts sensor readings per day for the given date range
   */
  private async getSensorReadingsTrend(startDate: Date, days: number): Promise<TrendDataPoint[]> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    // Single efficient query to get daily counts
    const result = await this.sensorReadingRepository
      .createQueryBuilder('reading')
      .select('DATE(reading.created_at)', 'date')
      .addSelect('COUNT(*)', 'count')
      .where('reading.created_at >= :startDate', { startDate })
      .andWhere('reading.created_at < :endDate', { endDate })
      .groupBy('DATE(reading.created_at)')
      .orderBy('DATE(reading.created_at)', 'ASC')
      .getRawMany();

    // Create a map of date -> count for quick lookup
    const countMap = new Map<string, number>();
    result.forEach((row) => {
      // Handle both Date objects and string dates from PostgreSQL
      const dateStr = row.date instanceof Date 
        ? row.date.toISOString().split('T')[0]
        : String(row.date).split('T')[0];
      countMap.set(dateStr, parseInt(row.count, 10));
    });

    // Fill in all days (including days with 0 readings)
    const trends: TrendDataPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];

      trends.push({
        date: dateStr,
        value: countMap.get(dateStr) || 0,
      });
    }

    return trends;
  }

  /**
   * Get users list with pagination, filtering, and search
   */
  async getUsers(query: AdminUsersQueryDto): Promise<AdminUsersResponseDto> {
    const {
      page = 1,
      limit = 20,
      role,
      status,
      search,
      sortBy = 'created_at',
      sortOrder = 'DESC',
      farm_id,
    } = query;

    const skip = (page - 1) * limit;

    // Build query builder with left join for farm count
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .leftJoin('farms', 'farm', 'farm.owner_id = user.user_id')
      .select([
        'user.user_id',
        'user.email',
        'user.first_name',
        'user.last_name',
        'user.phone',
        'user.role',
        'user.status',
        'user.city',
        'user.country',
        'user.last_login',
        'user.created_at',
        'user.updated_at',
      ])
      .addSelect('COUNT(DISTINCT farm.farm_id)', 'farm_count')
      .groupBy('user.user_id');

    // Apply filters
    if (role) {
      queryBuilder.andWhere('user.role = :role', { role });
    }

    if (status) {
      queryBuilder.andWhere('user.status = :status', { status });
    }

    if (search) {
      queryBuilder.andWhere(
        '(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply farm_id filter - filter users who own the specified farm
    if (farm_id) {
      queryBuilder.andWhere('farm.farm_id = :farm_id', { farm_id });
    }

    // Apply sorting
    if (sortBy === 'last_login') {
      queryBuilder.orderBy('user.last_login', sortOrder);
      queryBuilder.addOrderBy('user.created_at', 'DESC'); // Secondary sort
    } else if (sortBy === 'email') {
      queryBuilder.orderBy('user.email', sortOrder);
    } else if (sortBy === 'first_name') {
      queryBuilder.orderBy('user.first_name', sortOrder);
    } else if (sortBy === 'last_name') {
      queryBuilder.orderBy('user.last_name', sortOrder);
    } else {
      queryBuilder.orderBy('user.created_at', sortOrder);
    }

    // Get total count (without grouping)
    const countQueryBuilder = this.userRepository.createQueryBuilder('user');
    
    // Apply farm_id filter to count query as well
    if (farm_id) {
      countQueryBuilder.leftJoin('farms', 'farm', 'farm.owner_id = user.user_id');
      countQueryBuilder.andWhere('farm.farm_id = :farm_id', { farm_id });
    }
    
    if (role) {
      countQueryBuilder.andWhere('user.role = :role', { role });
    }
    if (status) {
      countQueryBuilder.andWhere('user.status = :status', { status });
    }
    if (search) {
      countQueryBuilder.andWhere(
        '(user.email ILIKE :search OR user.first_name ILIKE :search OR user.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const total = await countQueryBuilder.getCount();

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    // Execute query
    const rawResults = await queryBuilder.getRawMany();

    // Transform results
    const items: AdminUserListItemDto[] = rawResults.map((row) => ({
      user_id: row.user_user_id,
      email: row.user_email,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      phone: row.user_phone,
      role: row.user_role,
      status: row.user_status,
      city: row.user_city,
      country: row.user_country,
      last_login: row.user_last_login,
      created_at: row.user_created_at,
      updated_at: row.user_updated_at,
      farm_count: parseInt(row.farm_count || '0', 10),
    }));

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get single user by ID (admin endpoint)
   */
  async getUser(userId: string) {
    return this.usersService.findOne(userId, true); // Include farms
  }

  /**
   * Create a new user (admin endpoint)
   */
  async createUser(createUserDto: AdminCreateUserDto) {
    const createDto: CreateUserDto = {
      email: createUserDto.email,
      password: createUserDto.password,
      first_name: createUserDto.first_name,
      last_name: createUserDto.last_name,
      phone: createUserDto.phone,
      role: createUserDto.role || UserRole.FARMER,
      status: createUserDto.status || UserStatus.ACTIVE,
      city: createUserDto.city,
      country: createUserDto.country,
    };

    return this.usersService.create(createDto);
  }

  /**
   * Update user (admin endpoint)
   */
  async updateUser(userId: string, updateUserDto: Partial<UpdateUserDto>) {
    return this.usersService.update(userId, updateUserDto);
  }

  /**
   * Impersonate user (admin can login as another user)
   */
  async impersonateUser(userId: string, req: Request, res: Response) {
    // Get the target user
    const targetUser = await this.usersService.findOne(userId);
    
    if (!targetUser) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if target user is active
    if (targetUser.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException(`Cannot impersonate ${targetUser.status} user`);
    }

    // Get the admin user from request (set by JwtAuthGuard)
    const adminUser = req.user as any;
    
    if (!adminUser || !adminUser.user_id) {
      throw new ForbiddenException('Admin authentication required');
    }
    
    // Store original admin info in cookie for later restoration
    const adminInfo = {
      user_id: adminUser.user_id,
      email: adminUser.email,
      role: adminUser.role,
    };

    // Create impersonation token with target user info + admin info in metadata
    const payload = {
      email: targetUser.email,
      sub: targetUser.user_id,
      role: targetUser.role,
      impersonated_by: adminInfo.user_id,
      is_impersonation: true,
    };

    const token = this.jwtService.sign(payload);

    // Set cookie with impersonated user token
    res.cookie('sf_auth', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2, // 2 hours for impersonation (shorter than normal)
      path: '/',
    });

    // Store admin info in separate cookie for restoration
    res.cookie('sf_admin', JSON.stringify(adminInfo), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 2, // 2 hours
      path: '/',
    });

    // Return target user info (already safe from findOne)
    return {
      user: targetUser,
      impersonated: true,
      originalAdmin: adminInfo,
    };
  }

  /**
   * Delete user (admin endpoint)
   */
  async deleteUser(userId: string) {
    await this.usersService.remove(userId);
    return { message: 'User deleted successfully' };
  }

  // ========================
  // SYSTEM HEALTH
  // ========================

  /**
   * Get overall system health status
   */
  async getSystemHealth() {
    const detailedHealth = await this.healthService.getDetailedHealth();
    const databaseHealth = await this.healthService.getDatabaseHealth();
    const mqttHealth = await this.healthService.getMqttHealth();

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'critical' = 'healthy';
    if (databaseHealth.status === 'unhealthy' || mqttHealth.status === 'unhealthy') {
      status = 'critical';
    } else if (detailedHealth.status === 'unhealthy') {
      status = 'degraded';
    }

    return {
      status,
      uptime: process.uptime(),
      services: {
        api: {
          status: 'healthy',
          responseTime: 0, // Could be measured if needed
        },
        database: {
          status: databaseHealth.status,
          connections: (databaseHealth as any).connections || 0,
        },
        mqtt: {
          status: mqttHealth.status,
          connectedDevices: (mqttHealth as any).connectedDevices || 0,
        },
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get system performance metrics
   */
  async getSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();

    // Get online device count
    const onlineDevices = await this.deviceRepository.count({
      where: { status: 'online' },
    });

    return {
      cpu: {
        usage: 0, // CPU usage calculation requires more complex logic
        cores: os.cpus().length,
      },
      memory: {
        total: memUsage.heapTotal,
        used: memUsage.heapUsed,
        free: memUsage.heapTotal - memUsage.heapUsed,
        rss: memUsage.rss,
        external: memUsage.external,
      },
      disk: {
        total: 0, // Disk info requires additional library
        used: 0,
        free: 0,
      },
      uptime,
      timestamp: new Date(),
    };
  }

  /**
   * Get system uptime statistics
   */
  async getSystemUptime() {
    const uptime = process.uptime();
    const startTime = new Date(Date.now() - uptime * 1000);

    // Get device statistics
    const [totalDevices, onlineDevices, offlineDevices] = await Promise.all([
      this.deviceRepository.count(),
      this.deviceRepository.count({ where: { status: 'online' } }),
      this.deviceRepository.count({ where: { status: 'offline' } }),
    ]);

    return {
      uptime,
      uptimeFormatted: this.formatUptime(uptime),
      startTime,
      devices: {
        total: totalDevices,
        online: onlineDevices,
        offline: offlineDevices,
        uptimePercentage: totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0,
      },
      timestamp: new Date(),
    };
  }

  private formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  }

  // ========================
  // FARMERS
  // ========================

  /**
   * Get all farmers with their farm assignments
   */
  async getFarmers(page: number = 1, limit: number = 50) {
    const skip = (page - 1) * limit;

    const [farmers, total] = await this.userRepository.findAndCount({
      where: { role: UserRole.FARMER },
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    // Get farms for each farmer
    const farmersWithFarms = await Promise.all(
      farmers.map(async (farmer) => {
        const farms = await this.farmRepository.find({
          where: { owner_id: farmer.user_id },
        });

        // Get device count for each farm
        const farmsWithDeviceCount = await Promise.all(
          farms.map(async (farm) => {
            const deviceCount = await this.deviceRepository.count({
              where: { farm_id: farm.farm_id },
            });
            return {
              farm_id: farm.farm_id,
              farm_name: farm.name,
              area_hectares: 0, // Not in current schema, could be added
              device_count: deviceCount,
            };
          }),
        );

        return {
          user_id: farmer.user_id,
          email: farmer.email,
          first_name: farmer.first_name,
          last_name: farmer.last_name,
          assigned_farms: farmsWithDeviceCount,
          total_devices: farmsWithDeviceCount.reduce((sum, farm) => sum + farm.device_count, 0),
          last_active: farmer.last_login || farmer.created_at,
        };
      }),
    );

    return {
      items: farmersWithFarms,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get farmer's assigned farms
   */
  async getFarmerFarms(farmerId: string) {
    const farmer = await this.userRepository.findOne({
      where: { user_id: farmerId, role: UserRole.FARMER },
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${farmerId} not found`);
    }

    const farms = await this.farmRepository.find({
      where: { owner_id: farmerId },
    });

    const farmsWithDetails = await Promise.all(
      farms.map(async (farm) => {
        const deviceCount = await this.deviceRepository.count({
          where: { farm_id: farm.farm_id },
        });
        return {
          farm_id: farm.farm_id,
          farm_name: farm.name,
          area_hectares: 0, // Not in current schema
          device_count: deviceCount,
          location: farm.location,
          latitude: farm.latitude,
          longitude: farm.longitude,
          created_at: farm.created_at,
        };
      }),
    );

    return farmsWithDetails;
  }

  /**
   * Assign farm to farmer
   */
  async assignFarmToFarmer(farmerId: string, farmId: string) {
    const farmer = await this.userRepository.findOne({
      where: { user_id: farmerId, role: UserRole.FARMER },
    });

    if (!farmer) {
      throw new NotFoundException(`Farmer with ID ${farmerId} not found`);
    }

    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    // Update farm owner
    farm.owner_id = farmerId;
    await this.farmRepository.save(farm);

    return {
      message: 'Farm assigned successfully',
      farm: {
        farm_id: farm.farm_id,
        farm_name: farm.name,
        owner_id: farm.owner_id,
      },
    };
  }

  // ========================
  // LOGS
  // ========================

  /**
   * Get system logs (using action logs as system logs)
   */
  async getSystemLogs(level?: string, module?: string, limit: number = 50, page: number = 1) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.actionLogRepository
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    // Map status to log level
    if (level) {
      if (level === 'error') {
        queryBuilder.andWhere("log.status IN ('error', 'failed', 'timeout')");
      } else if (level === 'warn') {
        queryBuilder.andWhere("log.status = 'queued'");
      } else if (level === 'info') {
        queryBuilder.andWhere("log.status IN ('sent', 'ack')");
      }
    }

    // Module filter could be based on device_id or sensor_type
    if (module) {
      queryBuilder.andWhere('log.device_id = :module OR log.sensor_type = :module', { module });
    }

    const [logs, total] = await queryBuilder.getManyAndCount();

    const formattedLogs = logs.map((log) => ({
      id: log.id.toString(),
      timestamp: log.created_at,
      level: this.mapStatusToLevel(log.status),
      module: log.device_id || log.sensor_type || 'system',
      message: `${log.trigger_source} action: ${log.action_uri} - ${log.status}`,
      metadata: {
        device_id: log.device_id,
        sensor_id: log.sensor_id,
        status: log.status,
        error_message: log.error_message,
      },
    }));

    return {
      logs: formattedLogs,
      total,
      page,
      limit,
    };
  }

  private mapStatusToLevel(status: string): 'info' | 'warn' | 'error' | 'debug' {
    if (['error', 'failed', 'timeout'].includes(status)) return 'error';
    if (status === 'queued') return 'warn';
    if (status === 'ack') return 'info';
    return 'debug';
  }

  /**
   * Get audit logs (user actions)
   */
  async getAuditLogs(limit: number = 50, page: number = 1, userId?: string) {
    const skip = (page - 1) * limit;

    // For now, use action logs as audit logs
    // In a production system, you'd have a separate audit_logs table
    const queryBuilder = this.actionLogRepository
      .createQueryBuilder('log')
      .orderBy('log.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    // Note: action_logs doesn't have user_id, so we'll return all logs
    // In production, you'd join with a proper audit_logs table

    const [logs, total] = await queryBuilder.getManyAndCount();

    const auditLogs = logs.map((log) => ({
      id: log.id.toString(),
      timestamp: log.created_at,
      action: log.action_uri,
      trigger_source: log.trigger_source,
      device_id: log.device_id,
      sensor_id: log.sensor_id,
      status: log.status,
      metadata: log.payload,
    }));

    return {
      logs: auditLogs,
      total,
      page,
      limit,
    };
  }

  // ========================
  // ADMIN FARMS
  // ========================

  /**
   * Get all farms with details (admin view)
   */
  async getAdminFarms(page: number = 1, limit: number = 50, search?: string) {
    const skip = (page - 1) * limit;

    const queryBuilder = this.farmRepository
      .createQueryBuilder('farm')
      .leftJoin('users', 'owner', 'owner.user_id = farm.owner_id')
      .select([
        'farm.farm_id',
        'farm.name',
        'farm.owner_id',
        'farm.location',
        'farm.latitude',
        'farm.longitude',
        'farm.created_at',
        'owner.first_name',
        'owner.last_name',
        'owner.email',
      ])
      .orderBy('farm.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(farm.name ILIKE :search OR farm.farm_id ILIKE :search OR farm.city ILIKE :search OR farm.region ILIKE :search OR farm.location ILIKE :search OR owner.email ILIKE :search OR owner.first_name ILIKE :search OR owner.last_name ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const [farms, total] = await queryBuilder.getManyAndCount();

    // Get device count for each farm
    const farmsWithDetails = await Promise.all(
      farms.map(async (farm: any) => {
        const deviceCount = await this.deviceRepository.count({
          where: { farm_id: farm.farm_id },
        });

        return {
          farm_id: farm.farm_id,
          farm_name: farm.name,
          owner_id: farm.owner_id,
          owner_name: farm.owner?.first_name && farm.owner?.last_name
            ? `${farm.owner.first_name} ${farm.owner.last_name}`
            : farm.owner?.email || 'Unknown',
          location: {
            lat: parseFloat(farm.latitude) || 0,
            lng: parseFloat(farm.longitude) || 0,
          },
          area_hectares: 0, // Not in current schema
          device_count: deviceCount,
          status: deviceCount > 0 ? 'active' : 'inactive',
          created_at: farm.created_at,
        };
      }),
    );

    return {
      items: farmsWithDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Create new farm (admin)
   */
  async createAdminFarm(farmData: any) {
    const farm = await this.farmsService.create(farmData, farmData.owner_id || '');
    return farm;
  }

  /**
   * Update farm (admin)
   */
  async updateAdminFarm(farmId: string, farmData: any) {
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    Object.assign(farm, farmData);
    await this.farmRepository.save(farm);

    return farm;
  }

  /**
   * Delete farm (admin)
   */
  async deleteAdminFarm(farmId: string) {
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    // Check if farm has devices
    const deviceCount = await this.deviceRepository.count({
      where: { farm_id: farmId },
    });

    if (deviceCount > 0) {
      throw new ForbiddenException(
        `Cannot delete farm with ${deviceCount} device(s). Please remove devices first.`,
      );
    }

    await this.farmRepository.remove(farm);
    return { message: 'Farm deleted successfully' };
  }

  /**
   * Get single farm with full details (admin)
   * Computes all derived values dynamically (NOT from DB)
   */
  async getAdminFarmDetails(farmId: string) {
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
      relations: ['owner', 'assigned_moderators'],
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    // Get owner details
    const owner = farm.owner ? await farm.owner : null;
    const ownerName = owner
      ? `${owner.first_name} ${owner.last_name}`
      : 'Unknown';

    // Get assigned moderators (from junction table relationship)
    // Filter to ensure only users with moderator role are included
    const moderators = (farm.assigned_moderators || []).filter(
      (m) => m.role === UserRole.MODERATOR,
    );
    const moderatorIds = moderators.map((m) => m.user_id);

    // Get devices
    const devices = await this.deviceRepository.find({
      where: { farm_id: farmId },
      relations: ['sensors'],
    });

    // Get sensors
    const sensors = await this.sensorRepository.find({
      where: { farm_id: farmId },
      relations: ['device'],
    });

    // ============================================
    // COMPUTE DERIVED VALUES (NOT FROM DB)
    // ============================================

    // 1. Compute device_count
    const deviceCount = devices.length;

    // 2. Compute sensor_count
    const sensorCount = sensors.length;

    // 3. Compute alerts_summary from notifications
    const userIds = [farm.owner_id, ...moderatorIds].filter(Boolean);
    const deviceIds = devices.map((d) => d.device_id);
    const sensorIds = sensors.map((s) => s.sensor_id);

    const allNotifications = userIds.length > 0
      ? await this.notificationRepository.find({
          where: {
            user_id: In(userIds),
          },
          order: { created_at: 'DESC' },
        })
      : [];

    // Filter notifications related to this farm
    const farmNotifications = allNotifications.filter((n) => {
      const context = n.context || {};
      return (
        context.farm_id === farmId ||
        (context.device_id && deviceIds.includes(context.device_id)) ||
        (context.sensor_id && sensorIds.includes(context.sensor_id)) ||
        (n.source === 'device' && deviceIds.some(id => context.device_id === id)) ||
        (n.source === 'sensor' && sensorIds.some(id => context.sensor_id === id))
      );
    });

    const alertsSummary = {
      critical: farmNotifications.filter((n) => n.level === 'critical' && !n.is_read).length,
      warning: farmNotifications.filter((n) => n.level === 'warning' && !n.is_read).length,
      info: farmNotifications.filter((n) => n.level === 'info' && !n.is_read).length,
    };

    // 4. Compute last_activity from multiple sources
    const deviceLastSeen = devices.length > 0
      ? await this.deviceRepository
          .createQueryBuilder('device')
          .select('MAX(device.updated_at)', 'max_updated')
          .where('device.farm_id = :farmId', { farmId })
          .getRawOne()
      : null;

    const sensorReadingLast = sensors.length > 0
      ? await this.sensorReadingRepository
          .createQueryBuilder('reading')
          .select('MAX(reading.created_at)', 'max_created')
          .where('reading.sensor_id IN (:...sensorIds)', { sensorIds })
          .getRawOne()
      : null;

    const actionLogLast = deviceIds.length > 0
      ? await this.actionLogRepository
          .createQueryBuilder('log')
          .select('MAX(log.created_at)', 'max_created')
          .where('log.device_id IN (:...deviceIds)', { deviceIds })
          .getRawOne()
      : null;

    // Get the most recent timestamp from all sources
    const timestamps = [
      deviceLastSeen?.max_updated,
      sensorReadingLast?.max_created,
      actionLogLast?.max_created,
    ].filter(Boolean).map((ts) => new Date(ts));

    const lastActivity = timestamps.length > 0
      ? new Date(Math.max(...timestamps.map((ts) => ts.getTime())))
      : null;

    // 5. Compute health_score based on device/sensor statuses and alerts
    let healthScore = 100; // Start at 100

    // Deduct points for offline devices
    const offlineDevices = devices.filter((d) => d.status === 'offline').length;
    healthScore -= offlineDevices * 10; // -10 per offline device

    // Deduct points for critical alerts
    healthScore -= alertsSummary.critical * 5; // -5 per critical alert

    // Deduct points for warning alerts
    healthScore -= alertsSummary.warning * 2; // -2 per warning alert

    // Deduct points if no recent activity (stale farm)
    if (lastActivity) {
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceActivity > 7) {
        healthScore -= 20; // -20 if no activity in 7+ days
      } else if (daysSinceActivity > 3) {
        healthScore -= 10; // -10 if no activity in 3+ days
      }
    } else if (devices.length > 0) {
      healthScore -= 30; // -30 if devices exist but no activity recorded
    }

    // Ensure health_score is between 0 and 100
    healthScore = Math.max(0, Math.min(100, healthScore));

    // 6. Get activity logs
    const activity = deviceIds.length > 0
      ? await this.actionLogRepository.find({
          where: {
            device_id: In(deviceIds),
          },
          order: { created_at: 'DESC' },
          take: 50,
        })
      : [];

    // Determine status
    const status = deviceCount > 0 ? 'active' : 'inactive';

    return {
      farm_id: farm.farm_id,
      farm_name: farm.name,
      name: farm.name,
      owner_id: farm.owner_id,
      owner_name: ownerName,
      location: farm.location,
      latitude: farm.latitude ? parseFloat(farm.latitude.toString()) : undefined,
      longitude: farm.longitude ? parseFloat(farm.longitude.toString()) : undefined,
      city: farm.city,
      region: farm.region,
      country: farm.country,
      description: farm.description,
      status,
      // Derived values (computed, NOT from DB)
      device_count: deviceCount,
      sensor_count: sensorCount,
      health_score: healthScore,
      alerts_summary: alertsSummary,
      last_activity: lastActivity ? lastActivity.toISOString() : null,
      // Stored values
      assigned_moderators: moderators.map((m) => ({
        user_id: m.user_id,
        email: m.email,
        first_name: m.first_name,
        last_name: m.last_name,
      })),
      moderator_ids: moderatorIds.length > 0 ? moderatorIds : [],
      created_at: farm.created_at,
      updated_at: farm.updated_at,
      // Relations
      devices: devices.map((d) => ({
        device_id: d.device_id,
        name: d.name,
        location: d.location,
        status: d.status,
        farm_id: d.farm_id,
        created_at: d.created_at,
        updated_at: d.updated_at,
        sensors: (d.sensors as any) || [],
      })),
      sensors: sensors.map((s) => ({
        id: s.id,
        sensor_id: s.sensor_id,
        farm_id: s.farm_id,
        type: s.type,
        unit: s.unit,
        device_id: s.device_id,
        location: s.location,
        min_critical: s.min_critical,
        min_warning: s.min_warning,
        max_warning: s.max_warning,
        max_critical: s.max_critical,
        action_low: s.action_low,
        action_high: s.action_high,
        created_at: s.created_at,
        updated_at: s.updated_at,
      })),
      activity: activity.map((a) => ({
        id: a.id.toString(),
        timestamp: a.created_at,
        action: a.action_uri,
        trigger_source: a.trigger_source,
        device_id: a.device_id,
        sensor_id: a.sensor_id,
        status: a.status,
        metadata: {
          value: a.value,
          unit: a.unit,
          violation_type: a.violation_type,
          error_message: a.error_message,
          payload: a.payload,
        },
      })),
    };
  }

  /**
   * Patch farm (partial update) - admin
   * Only allows updating stored metadata fields (NOT derived values)
   */
  async patchAdminFarm(farmId: string, updates: any) {
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    // Validate and update assigned_moderators if provided
    if (updates.assigned_moderators !== undefined) {
      const moderatorIds = Array.isArray(updates.assigned_moderators)
        ? updates.assigned_moderators
        : [];

      // Validate that all IDs are valid moderators
      if (moderatorIds.length > 0) {
        const validModerators = await this.userRepository.find({
          where: {
            user_id: In(moderatorIds),
            role: UserRole.MODERATOR,
          },
        });

        if (validModerators.length !== moderatorIds.length) {
          const invalidIds = moderatorIds.filter(
            (id) => !validModerators.some((m) => m.user_id === id),
          );
          throw new NotFoundException(
            `Invalid moderator IDs: ${invalidIds.join(', ')}`,
          );
        }

        // Assign moderators using TypeORM relationship
        farm.assigned_moderators = validModerators;
      } else {
        // Clear all moderators
        farm.assigned_moderators = [];
      }
    }

    // Update stored metadata fields only (NOT derived values)
    if (updates.name !== undefined) farm.name = updates.name;
    if (updates.location !== undefined) farm.location = updates.location;
    if (updates.latitude !== undefined) farm.latitude = updates.latitude;
    if (updates.longitude !== undefined) farm.longitude = updates.longitude;
    if (updates.city !== undefined) farm.city = updates.city;
    if (updates.region !== undefined) farm.region = updates.region;
    if (updates.country !== undefined) farm.country = updates.country;
    if (updates.description !== undefined) farm.description = updates.description;
    if (updates.area_hectares !== undefined) farm.area_hectares = updates.area_hectares;
    if (updates.status !== undefined) {
      // Validate status value
      if (updates.status !== 'active' && updates.status !== 'inactive') {
        throw new BadRequestException(`Invalid status: ${updates.status}. Must be 'active' or 'inactive'`);
      }
      farm.status = updates.status;
    }
    
    if (updates.owner_id !== undefined) {
      // Validate owner exists
      const owner = await this.userRepository.findOne({
        where: { user_id: updates.owner_id },
      });
      if (!owner) {
        throw new NotFoundException(`Owner with ID ${updates.owner_id} not found`);
      }
      farm.owner_id = updates.owner_id;
    }

    // Ignore derived fields if provided (they are computed dynamically)
    // sensor_count, health_score, alerts_summary, last_activity are NOT stored

    await this.farmRepository.save(farm);

    // Return updated farm details (with computed derived values)
    return this.getAdminFarmDetails(farmId);
  }

  /**
   * Get farm activity logs
   */
  async getFarmActivity(farmId: string, limit: number = 50) {
    const farm = await this.farmRepository.findOne({
      where: { farm_id: farmId },
    });

    if (!farm) {
      throw new NotFoundException(`Farm with ID ${farmId} not found`);
    }

    // Get all devices for this farm
    const devices = await this.deviceRepository.find({
      where: { farm_id: farmId },
      select: ['device_id'],
    });

    const deviceIds = devices.map((d) => d.device_id);

    if (deviceIds.length === 0) {
      return [];
    }

    // Get action logs for these devices
    const logs = await this.actionLogRepository.find({
      where: {
        device_id: In(deviceIds),
      },
      order: { created_at: 'DESC' },
      take: limit,
    });

    return logs.map((log) => ({
      id: log.id.toString(),
      timestamp: log.created_at,
      action: log.action_uri,
      trigger_source: log.trigger_source,
      device_id: log.device_id,
      sensor_id: log.sensor_id,
      status: log.status,
      metadata: {
        value: log.value,
        unit: log.unit,
        violation_type: log.violation_type,
        error_message: log.error_message,
        payload: log.payload,
      },
    }));
  }

  /**
   * Get admin sensors with filters
   */
  async getAdminSensors(filters: {
    page?: number;
    limit?: number;
    farm_id?: string;
    device_id?: string;
    type?: string;
    search?: string;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const queryBuilder = this.sensorRepository
      .createQueryBuilder('sensor')
      .leftJoin('sensor.device', 'device')
      .leftJoin('sensor.farm', 'farm')
      .select([
        'sensor.id',
        'sensor.sensor_id',
        'sensor.farm_id',
        'sensor.type',
        'sensor.unit',
        'sensor.device_id',
        'sensor.location',
        'sensor.min_critical',
        'sensor.min_warning',
        'sensor.max_warning',
        'sensor.max_critical',
        'sensor.action_low',
        'sensor.action_high',
        'sensor.created_at',
        'sensor.updated_at',
        'device.name',
        'device.status',
        'farm.name',
      ])
      .orderBy('sensor.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (filters.farm_id) {
      queryBuilder.andWhere('sensor.farm_id = :farm_id', { farm_id: filters.farm_id });
    }

    if (filters.device_id) {
      queryBuilder.andWhere('sensor.device_id = :device_id', { device_id: filters.device_id });
    }

    if (filters.type) {
      queryBuilder.andWhere('sensor.type = :type', { type: filters.type });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(sensor.type ILIKE :search OR sensor.sensor_id ILIKE :search OR device.name ILIKE :search OR farm.name ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    const [sensors, total] = await queryBuilder.getManyAndCount();

    // Get latest reading for each sensor
    const sensorsWithReadings = await Promise.all(
      sensors.map(async (sensor) => {
        const latestReading = await this.sensorReadingRepository.findOne({
          where: { sensor_id: sensor.sensor_id },
          order: { created_at: 'DESC' },
        });

        return {
          id: sensor.id,
          sensor_id: sensor.sensor_id,
          farm_id: sensor.farm_id,
          type: sensor.type,
          unit: sensor.unit,
          device_id: sensor.device_id,
          location: sensor.location,
          min_critical: sensor.min_critical,
          min_warning: sensor.min_warning,
          max_warning: sensor.max_warning,
          max_critical: sensor.max_critical,
          action_low: sensor.action_low,
          action_high: sensor.action_high,
          created_at: sensor.created_at,
          updated_at: sensor.updated_at,
          last_reading: latestReading
            ? {
                value1: latestReading.value1,
                value2: latestReading.value2,
                createdAt: latestReading.created_at,
              }
            : null,
          thresholds: {
            min_critical: sensor.min_critical,
            min_warning: sensor.min_warning,
            max_warning: sensor.max_warning,
            max_critical: sensor.max_critical,
          },
          status: latestReading ? 'active' : 'inactive',
        };
      }),
    );

    return {
      sensors: sensorsWithReadings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ========================
  // ADMIN SETTINGS
  // ========================

  /**
   * Get system settings
   */
  async getSettings() {
    let settings = await this.systemSettingsRepository.findOne({
      where: { id: 'main' },
    });

    // If no settings exist, return defaults
    if (!settings) {
      return {
        general: {
          site_name: 'Smart Farm Management System',
          contact_email: 'admin@smartfarm.com',
          maintenance_mode: false,
        },
        notifications: {
          email_enabled: true,
          sms_enabled: false,
        },
        security: {
          session_timeout: 86400, // 24 hours in seconds (for agriculture use case)
          max_login_attempts: 5,
        },
      };
    }

    return settings.settings;
  }

  /**
   * Update system settings
   */
  async updateSettings(settingsData: any) {
    let settings = await this.systemSettingsRepository.findOne({
      where: { id: 'main' },
    });

    if (!settings) {
      // Create new settings record
      settings = this.systemSettingsRepository.create({
        id: 'main',
        settings: settingsData,
      });
    } else {
      // Merge with existing settings (partial update)
      settings.settings = {
        ...settings.settings,
        ...settingsData,
        general: {
          ...settings.settings.general,
          ...settingsData.general,
        },
        notifications: {
          ...settings.settings.notifications,
          ...settingsData.notifications,
        },
        security: {
          ...settings.settings.security,
          ...settingsData.security,
        },
      };
    }

    await this.systemSettingsRepository.save(settings);
    return settings.settings;
  }
}

