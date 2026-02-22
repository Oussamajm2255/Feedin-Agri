import { IsString, IsOptional, IsEnum, IsNumber, MaxLength, IsObject } from 'class-validator';

export class UpdateZoneDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsEnum(['indoor', 'outdoor', 'greenhouse', 'hydroponic'])
  type?: 'indoor' | 'outdoor' | 'greenhouse' | 'hydroponic';

  @IsOptional()
  @IsNumber()
  area_m2?: number;

  @IsOptional()
  @IsObject()
  coordinates?: Record<string, any>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsEnum(['active', 'inactive'])
  status?: 'active' | 'inactive';
}
