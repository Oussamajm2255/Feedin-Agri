import { IsString, IsNotEmpty, IsOptional, IsUUID, IsObject } from 'class-validator';

export class CreateDigitalTwinDto {
  @IsString()
  @IsNotEmpty()
  farm_id: string;

  @IsUUID()
  @IsOptional()
  zone_id?: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  media_url?: string;

  @IsObject()
  @IsOptional()
  config?: Record<string, any>;
}
