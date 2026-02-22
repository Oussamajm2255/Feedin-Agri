import { IsString, IsOptional, IsEnum, IsBoolean, IsObject, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { AdminNotificationSeverity, AdminNotificationDomain, AdminNotificationStatus } from '../../../entities/admin-notification.entity';

export class CreateAdminNotificationDto {
  @IsString()
  type: string;

  @IsEnum(['critical', 'warning', 'info', 'success'])
  severity: AdminNotificationSeverity;

  @IsEnum(['system', 'farms', 'devices', 'crops', 'users', 'automation'])
  domain: AdminNotificationDomain;

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsObject()
  context?: Record<string, any>;

  @IsOptional()
  @IsBoolean()
  pinned_until_resolved?: boolean;
}

export class QueryAdminNotificationsDto {
  @IsOptional()
  @IsEnum(['critical', 'warning', 'info', 'success'])
  severity?: AdminNotificationSeverity;

  @IsOptional()
  @IsEnum(['system', 'farms', 'devices', 'crops', 'users', 'automation'])
  domain?: AdminNotificationDomain;

  @IsOptional()
  @IsEnum(['new', 'acknowledged', 'resolved'])
  status?: AdminNotificationStatus;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;

  @IsOptional()
  @IsString()
  farmId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  deviceId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 50;
}

export class AdminNotificationCountsDto {
  critical: number;
  warning: number;
  info: number;
  success: number;
  total: number;
  unresolved: number;
  newCount: number;
}

export class AdminNotificationResponseDto {
  id: string;
  type: string;
  severity: AdminNotificationSeverity;
  domain: AdminNotificationDomain;
  title: string;
  message?: string;
  context?: Record<string, any>;
  status: AdminNotificationStatus;
  pinned_until_resolved: boolean;
  created_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  acknowledged_by?: string;
  resolved_by?: string;
}

export class AdminNotificationsListResponseDto {
  items: AdminNotificationResponseDto[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export class BulkActionDto {
  @IsString({ each: true })
  ids: string[];
}
