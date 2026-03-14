import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsEnum,
  MaxLength,
  IsUUID,
} from 'class-validator';

/**
 * Crop status enum - matches database values
 */
export enum CropStatusEnum {
  PLANTED = 'planted',
  GROWING = 'growing',
  HARVESTED = 'harvested',
  FAILED = 'failed',
}

/**
 * CreateCropDto
 * 
 * Business Rule: Every crop MUST belong to a farm.
 * The farm_id is required and validated.
 */
export class CreateCropDto {
  @IsNotEmpty({ message: 'Farm ID is required - every crop must belong to a farm' })
  @IsString({ message: 'Farm ID must be a string' })
  @MaxLength(36, { message: 'Farm ID must not exceed 36 characters' })
  farm_id: string;

  @IsNotEmpty({ message: 'Crop name is required' })
  @IsString({ message: 'Crop name must be a string' })
  @MaxLength(100, { message: 'Crop name must not exceed 100 characters' })
  name: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  description?: string;

  @IsOptional()
  @IsString({ message: 'Variety must be a string' })
  @MaxLength(100, { message: 'Variety must not exceed 100 characters' })
  variety?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Planting date must be a valid ISO date string' })
  planting_date?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Expected harvest date must be a valid ISO date string' })
  expected_harvest_date?: string;

  @IsOptional()
  @IsEnum(CropStatusEnum, {
    message: `Status must be one of: ${Object.values(CropStatusEnum).join(', ')}`,
  })
  status?: CropStatusEnum;

  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  notes?: string;
}

