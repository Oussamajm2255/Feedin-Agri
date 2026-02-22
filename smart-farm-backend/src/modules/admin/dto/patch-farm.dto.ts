import { IsOptional, IsString, IsNumber, IsArray, Min, Max, MaxLength, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

class AlertsSummaryDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  critical?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  warning?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  info?: number;
}

export class PatchFarmDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  country?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigned_moderators?: string[];

  @IsOptional()
  @IsString()
  owner_id?: string;

  // Note: sensor_count, health_score, alerts_summary, last_activity are computed dynamically
  // and should NOT be included in PATCH requests
}

