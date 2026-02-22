import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from '../../../core/models/user.model';
import { Farm, Device, AdminFarmDetails } from '../../../core/models/farm.model';
import { environment } from '../../../../environments/environment';

/**
 * Admin API Service
 * Centralized gateway for all admin-specific API endpoints
 * This service isolates admin logic from farmer dashboard logic
 */
@Injectable({
  providedIn: 'root'
})
export class AdminApiService {
  private readonly API_URL = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // ========================
  // ADMIN OVERVIEW
  // ========================

  /**
   * GET /admin/overview/summary
   * Get admin overview summary statistics
   */
  getOverviewSummary(): Observable<{
    totalFarms: number;
    totalDevices: number;
    onlineDevices: number;
    offlineDevices: number;
    maintenanceDevices: number;
    totalSensors: number;
    totalUsers: number;
    totalFarmers: number;
    totalAdmins: number;
    activeUsers: number;
    alertsToday: number;
    criticalAlertsUnread: number;
    actionsToday: number;
    autoActionsToday: number;
    manualActionsToday: number;
  }> {
    return this.http.get<{
      totalFarms: number;
      totalDevices: number;
      onlineDevices: number;
      offlineDevices: number;
      maintenanceDevices: number;
      totalSensors: number;
      totalUsers: number;
      totalFarmers: number;
      totalAdmins: number;
      activeUsers: number;
      alertsToday: number;
      criticalAlertsUnread: number;
      actionsToday: number;
      autoActionsToday: number;
      manualActionsToday: number;
    }>(`${this.API_URL}/admin/overview/summary`);
  }

  /**
   * GET /admin/overview/trends
   * Get admin overview trends data
   */
  getOverviewTrends(period: '7days' | '30days' | '90days' = '30days'): Observable<{
    deviceUsage: Array<{ date: string; value: number }>;
    userActivity: Array<{ date: string; value: number }>;
    actionVolume: Array<{ date: string; value: number }>;
    sensorReadings: Array<{ date: string; value: number }>;
    period: '7days' | '30days' | '90days';
  }> {
    const params = new HttpParams().set('period', period);
    return this.http.get<{
      deviceUsage: Array<{ date: string; value: number }>;
      userActivity: Array<{ date: string; value: number }>;
      actionVolume: Array<{ date: string; value: number }>;
      sensorReadings: Array<{ date: string; value: number }>;
      period: '7days' | '30days' | '90days';
    }>(`${this.API_URL}/admin/overview/trends`, { params });
  }

  // ========================
  // ADMIN USERS
  // ========================

  /**
   * GET /admin/users
   * Get admin users with pagination and filtering
   */
  getUsers(query?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    farm_id?: string;
  }): Observable<{
    items: Array<{
      user_id: string;
      email: string;
      first_name: string;
      last_name: string;
      phone: string | null;
      role: string;
      status: string;
      city: string | null;
      country: string | null;
      last_login: Date | null;
      created_at: Date;
      updated_at: Date;
      farm_count: number;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let params = new HttpParams();
    if (query) {
      if (query.page) params = params.set('page', query.page.toString());
      if (query.limit) params = params.set('limit', query.limit.toString());
      if (query.role) params = params.set('role', query.role);
      if (query.status) params = params.set('status', query.status);
      if (query.search) params = params.set('search', query.search);
      if (query.sortBy) params = params.set('sortBy', query.sortBy);
      if (query.sortOrder) params = params.set('sortOrder', query.sortOrder);
      if (query.farm_id) {
        params = params.set('farm_id', query.farm_id);
      }
    }
    return this.http.get<{
      items: Array<{
        user_id: string;
        email: string;
        first_name: string;
        last_name: string;
        phone: string | null;
        role: string;
        status: string;
        city: string | null;
        country: string | null;
        last_login: Date | null;
        created_at: Date;
        updated_at: Date;
        farm_count: number;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.API_URL}/admin/users`, { params });
  }

  /**
   * GET /admin/users/:id
   * Get single admin user
   */
  getUser(userId: string): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/admin/users/${userId}`);
  }

  /**
   * POST /admin/users
   * Create new admin user
   */
  createUser(userData: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role?: string;
    status?: string;
    city?: string;
    country?: string;
  }): Observable<User> {
    return this.http.post<User>(`${this.API_URL}/admin/users`, userData);
  }

  /**
   * PUT /admin/users/:id
   * Full update of admin user
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.put<User>(`${this.API_URL}/admin/users/${userId}`, userData);
  }

  /**
   * PATCH /admin/users/:id
   * Partial update of admin user (e.g., disable/activate)
   */
  patchUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.API_URL}/admin/users/${userId}`, userData);
  }

  /**
   * POST /admin/users/:id/impersonate
   * Impersonate a user
   */
  impersonateUser(userId: string): Observable<{
    user: User;
    impersonated: boolean;
    originalAdmin: {
      user_id: string;
      email: string;
      role: string;
    };
  }> {
    return this.http.post<{
      user: User;
      impersonated: boolean;
      originalAdmin: {
        user_id: string;
        email: string;
        role: string;
      };
    }>(`${this.API_URL}/admin/users/${userId}/impersonate`, {});
  }

  /**
   * DELETE /admin/users/:id
   * Delete admin user
   */
  deleteUser(userId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/admin/users/${userId}`);
  }

  // ========================
  // ADMIN DEVICES
  // ========================

  /**
   * GET /admin/devices (or /devices with admin context)
   * Get all devices with admin filters
   */
  getDevices(filters?: {
    page?: number;
    limit?: number;
    farm_id?: string;
    status?: string;
    device_type?: string;
    search?: string;
  }): Observable<{
    devices: Device[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    // Using existing /devices endpoint - can be updated to /admin/devices when backend adds it
    return this.http.get<Device[]>(`${this.API_URL}/devices`, { params }).pipe(
      // Transform to paginated response format
      map((devices: Device[]) => {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedDevices = devices.slice(start, end);
        return {
          devices: paginatedDevices,
          total: devices.length,
          page,
          limit,
          totalPages: Math.ceil(devices.length / limit),
        };
      })
    );
  }

  /**
   * GET /admin/devices/:id
   * Get single device with sensors
   */
  getDevice(id: string): Observable<Device> {
    const params = new HttpParams().set('includeSensors', 'true');
    return this.http.get<Device>(`${this.API_URL}/devices/${id}`, { params });
  }

  /**
   * POST /admin/devices
   * Create new device
   */
  createDevice(deviceData: Partial<Device>): Observable<Device> {
    return this.http.post<Device>(`${this.API_URL}/devices`, deviceData);
  }

  /**
   * PATCH /admin/devices/:id
   * Update device
   */
  updateDevice(id: string, deviceData: Partial<Device>): Observable<Device> {
    return this.http.patch<Device>(`${this.API_URL}/devices/${id}`, deviceData);
  }

  /**
   * DELETE /admin/devices/:id
   * Delete device
   */
  deleteDevice(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/devices/${id}`);
  }

  /**
   * GET /admin/devices/statistics
   * Get device statistics
   */
  getDeviceStats(): Observable<{
    total: number;
    online: number;
    offline: number;
    maintenance: number;
    byType: {
      sensor?: number;
      actuator?: number;
      gateway?: number;
    };
  }> {
    return this.http.get<any>(`${this.API_URL}/devices/statistics`).pipe(
      map((stats: any) => ({
        total: stats.total || 0,
        online: stats.online || 0,
        offline: stats.offline || 0,
        maintenance: stats.maintenance || 0,
        byType: stats.byType || {},
      }))
    );
  }

  // ========================
  // ADMIN SYSTEM HEALTH
  // ========================

  /**
   * GET /admin/system/health
   * Get overall system health status
   */
  getSystemHealth(): Observable<{
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    services: {
      api: { status: string; responseTime: number };
      database: { status: string; connections: number };
      mqtt: { status: string; connectedDevices: number };
    };
    timestamp: Date;
  }> {
    return this.http.get<{
      status: 'healthy' | 'degraded' | 'critical';
      uptime: number;
      services: {
        api: { status: string; responseTime: number };
        database: { status: string; connections: number };
        mqtt: { status: string; connectedDevices: number };
      };
      timestamp: Date;
    }>(`${this.API_URL}/admin/system/health`);
  }

  /**
   * GET /admin/system/metrics
   * Get system performance metrics (CPU, memory, disk)
   */
  getSystemMetrics(): Observable<{
    cpu: { usage: number; cores: number };
    memory: { total: number; used: number; free: number; rss: number; external: number };
    disk: { total: number; used: number; free: number };
    uptime: number;
    timestamp: Date;
  }> {
    return this.http.get<{
      cpu: { usage: number; cores: number };
      memory: { total: number; used: number; free: number; rss: number; external: number };
      disk: { total: number; used: number; free: number };
      uptime: number;
      timestamp: Date;
    }>(`${this.API_URL}/admin/system/metrics`);
  }

  /**
   * GET /admin/system/uptime
   * Get system uptime statistics
   */
  getSystemUptime(): Observable<{
    uptime: number;
    uptimeFormatted: string;
    startTime: Date;
    devices: {
      total: number;
      online: number;
      offline: number;
      uptimePercentage: number;
    };
    timestamp: Date;
  }> {
    return this.http.get<{
      uptime: number;
      uptimeFormatted: string;
      startTime: Date;
      devices: {
        total: number;
        online: number;
        offline: number;
        uptimePercentage: number;
      };
      timestamp: Date;
    }>(`${this.API_URL}/admin/system/uptime`);
  }

  // ========================
  // ADMIN FARMERS
  // ========================

  /**
   * GET /admin/farmers
   * List all farmers with their farm assignments
   */
  getFarmers(page?: number, limit?: number): Observable<{
    items: Array<{
      user_id: string;
      email: string;
      first_name: string;
      last_name: string;
      assigned_farms: Array<{
        farm_id: string;
        farm_name: string;
        area_hectares: number;
        device_count: number;
      }>;
      total_devices: number;
      last_active: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let params = new HttpParams();
    if (page) params = params.set('page', page.toString());
    if (limit) params = params.set('limit', limit.toString());
    return this.http.get<{
      items: Array<{
        user_id: string;
        email: string;
        first_name: string;
        last_name: string;
        assigned_farms: Array<{
          farm_id: string;
          farm_name: string;
          area_hectares: number;
          device_count: number;
        }>;
        total_devices: number;
        last_active: Date;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.API_URL}/admin/farmers`, { params });
  }

  /**
   * GET /admin/farmers/:id/farms
   * Get farmer's assigned farms
   */
  getFarmerFarms(farmerId: string): Observable<Array<{
    farm_id: string;
    farm_name: string;
    area_hectares: number;
    device_count: number;
    location: string;
    latitude: number;
    longitude: number;
    created_at: Date;
  }>> {
    return this.http.get<Array<{
      farm_id: string;
      farm_name: string;
      area_hectares: number;
      device_count: number;
      location: string;
      latitude: number;
      longitude: number;
      created_at: Date;
    }>>(`${this.API_URL}/admin/farmers/${farmerId}/farms`);
  }

  /**
   * POST /admin/farmers/:id/assign-farm
   * Assign farm to farmer
   */
  assignFarmToFarmer(farmerId: string, farmId: string): Observable<{
    message: string;
    farm: {
      farm_id: string;
      farm_name: string;
      owner_id: string;
    };
  }> {
    return this.http.post<{
      message: string;
      farm: {
        farm_id: string;
        farm_name: string;
        owner_id: string;
      };
    }>(`${this.API_URL}/admin/farmers/${farmerId}/assign-farm`, { farm_id: farmId });
  }

  // ========================
  // ADMIN LOGS
  // ========================

  /**
   * GET /admin/logs
   * Get system logs with filtering
   */
  getSystemLogs(filters?: {
    level?: string;
    module?: string;
    limit?: number;
    page?: number;
  }): Observable<{
    logs: Array<{
      id: string;
      timestamp: Date;
      level: 'info' | 'warn' | 'error' | 'debug';
      module: string;
      message: string;
      metadata?: any;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.level) params = params.set('level', filters.level);
      if (filters.module) params = params.set('module', filters.module);
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
    }
    return this.http.get<{
      logs: Array<{
        id: string;
        timestamp: Date;
        level: 'info' | 'warn' | 'error' | 'debug';
        module: string;
        message: string;
        metadata?: any;
      }>;
      total: number;
      page: number;
      limit: number;
    }>(`${this.API_URL}/admin/logs`, { params });
  }

  /**
   * GET /admin/audit-logs
   * Get audit trail logs
   */
  getAuditLogs(filters?: {
    limit?: number;
    page?: number;
    userId?: string;
  }): Observable<{
    logs: Array<{
      id: string;
      timestamp: Date;
      action: string;
      trigger_source: string;
      device_id: string;
      sensor_id: string | null;
      status: string;
      metadata?: any;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.userId) params = params.set('userId', filters.userId);
    }
    return this.http.get<{
      logs: Array<{
        id: string;
        timestamp: Date;
        action: string;
        trigger_source: string;
        device_id: string;
        sensor_id: string | null;
        status: string;
        metadata?: any;
      }>;
      total: number;
      page: number;
      limit: number;
    }>(`${this.API_URL}/admin/audit-logs`, { params });
  }

  // ========================
  // ADMIN FARMS
  // ========================

  /**
   * GET /admin/farms
   * List all farms with details (admin view)
   */
  getFarms(filters?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Observable<{
    items: Array<{
      farm_id: string;
      farm_name: string;
      owner_id: string;
      owner_name: string;
      location: { lat: number; lng: number };
      area_hectares: number;
      device_count: number;
      status: 'active' | 'inactive';
      created_at: Date;
    }>;
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let params = new HttpParams();
    if (filters) {
      if (filters.page) params = params.set('page', filters.page.toString());
      if (filters.limit) params = params.set('limit', filters.limit.toString());
      if (filters.search) params = params.set('search', filters.search);
    }
    return this.http.get<{
      items: Array<{
        farm_id: string;
        farm_name: string;
        owner_id: string;
        owner_name: string;
        location: { lat: number; lng: number };
        area_hectares: number;
        device_count: number;
        status: 'active' | 'inactive';
        created_at: Date;
      }>;
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`${this.API_URL}/admin/farms`, { params });
  }

  /**
   * POST /admin/farms
   * Create new farm
   */
  createFarm(farmData: {
    name: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    owner_id: string;
    city?: string;
    region?: string;
    country?: string;
    area_hectares?: number;
    description?: string;
    status?: 'active' | 'inactive';
  }): Observable<Farm> {
    return this.http.post<Farm>(`${this.API_URL}/admin/farms`, farmData);
  }

  /**
   * PUT /admin/farms/:id
   * Update farm details
   */
  updateFarm(farmId: string, farmData: Partial<Farm>): Observable<Farm> {
    return this.http.put<Farm>(`${this.API_URL}/admin/farms/${farmId}`, farmData);
  }

  /**
   * DELETE /admin/farms/:id
   * Delete farm
   */
  deleteFarm(farmId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.API_URL}/admin/farms/${farmId}`);
  }

  /**
   * GET /admin/farms/:id
   * Get single farm with full details
   */
  getFarm(farmId: string): Observable<AdminFarmDetails> {
    return this.http.get<AdminFarmDetails>(`${this.API_URL}/admin/farms/${farmId}`);
  }

  /**
   * PATCH /admin/farms/:id
   * Partial update of farm (diff-based)
   */
  patchFarm(farmId: string, changes: Partial<AdminFarmDetails>): Observable<AdminFarmDetails> {
    return this.http.patch<AdminFarmDetails>(`${this.API_URL}/admin/farms/${farmId}`, changes);
  }

  /**
   * PATCH /admin/farms/:id/moderators
   * Update farm moderators
   */
  updateFarmModerators(farmId: string, moderatorIds: string[]): Observable<{ message: string }> {
    return this.http.patch<{ message: string }>(`${this.API_URL}/admin/farms/${farmId}/moderators`, {
      moderator_ids: moderatorIds
    });
  }

  /**
   * GET /admin/farms/:id/activity
   * Get farm activity log
   */
  getFarmActivity(farmId: string, limit: number = 50): Observable<Array<{
    id: string;
    timestamp: Date | string;
    action: string;
    trigger_source: string;
    device_id?: string;
    sensor_id?: string;
    status: string;
    metadata?: any;
  }>> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<Array<{
      id: string;
      timestamp: Date | string;
      action: string;
      trigger_source: string;
      device_id?: string;
      sensor_id?: string;
      status: string;
      metadata?: any;
    }>>(`${this.API_URL}/admin/farms/${farmId}/activity`, { params });
  }

  // ========================
  // ADMIN SENSORS
  // ========================

  /**
   * GET /admin/sensors
   * Get all sensors with admin filters
   */
  getSensors(filters?: {
    page?: number;
    limit?: number;
    farm_id?: string;
    device_id?: string;
    type?: string;
    search?: string;
  }): Observable<{
    sensors: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<any[]>(`${this.API_URL}/sensors`, { params }).pipe(
      map((sensors: any[]) => {
        const page = filters?.page || 1;
        const limit = filters?.limit || 50;
        const start = (page - 1) * limit;
        const end = start + limit;
        const paginatedSensors = sensors.slice(start, end);
        return {
          sensors: paginatedSensors,
          total: sensors.length,
          page,
          limit,
          totalPages: Math.ceil(sensors.length / limit),
        };
      })
    );
  }

  // ========================
  // ADMIN SETTINGS
  // ========================

  /**
   * GET /admin/settings
   * Get all system settings
   */
  getSettings(): Observable<{
    general: {
      site_name: string;
      contact_email: string;
      maintenance_mode: boolean;
    };
    notifications: {
      email_enabled: boolean;
      sms_enabled: boolean;
    };
    security: {
      session_timeout: number;
      max_login_attempts: number;
    };
  }> {
    return this.http.get<{
      general: {
        site_name: string;
        contact_email: string;
        maintenance_mode: boolean;
      };
      notifications: {
        email_enabled: boolean;
        sms_enabled: boolean;
      };
      security: {
        session_timeout: number;
        max_login_attempts: number;
      };
    }>(`${this.API_URL}/admin/settings`);
  }

  /**
   * PUT /admin/settings
   * Update system settings
   */
  updateSettings(settings: {
    general?: {
      site_name?: string;
      contact_email?: string;
      maintenance_mode?: boolean;
    };
    notifications?: {
      email_enabled?: boolean;
      sms_enabled?: boolean;
    };
    security?: {
      session_timeout?: number;
      max_login_attempts?: number;
    };
  }): Observable<{
    general: {
      site_name: string;
      contact_email: string;
      maintenance_mode: boolean;
    };
    notifications: {
      email_enabled: boolean;
      sms_enabled: boolean;
    };
    security: {
      session_timeout: number;
      max_login_attempts: number;
    };
  }> {
    return this.http.put<{
      general: {
        site_name: string;
        contact_email: string;
        maintenance_mode: boolean;
      };
      notifications: {
        email_enabled: boolean;
        sms_enabled: boolean;
      };
      security: {
        session_timeout: number;
        max_login_attempts: number;
      };
    }>(`${this.API_URL}/admin/settings`, settings);
  }

  // ========================
  // GENERIC HTTP METHODS
  // ========================

  /**
   * Generic GET request for flexible API calls
   */
  get<T>(endpoint: string, options?: { params?: Record<string, any> }): Observable<T> {
    let params = new HttpParams();
    if (options?.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params = params.set(key, String(value));
        }
      });
    }
    return this.http.get<T>(`${this.API_URL}/${endpoint}`, { params });
  }

  /**
   * Generic POST request for flexible API calls
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.API_URL}/${endpoint}`, body);
  }

  /**
   * Generic PATCH request for flexible API calls
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.API_URL}/${endpoint}`, body);
  }

  /**
   * Generic PUT request for flexible API calls
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.API_URL}/${endpoint}`, body);
  }

  /**
   * Generic DELETE request for flexible API calls
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.API_URL}/${endpoint}`);
  }
}

