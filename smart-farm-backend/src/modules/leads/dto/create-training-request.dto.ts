import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
} from "class-validator";

/**
 * DTO for creating a training request from the Formation page drawer.
 * This endpoint is public (no JWT required).
 */
export class CreateTrainingRequestDto {
  @IsString()
  @MaxLength(200)
  full_name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsEnum(["level_1", "level_2", "level_3"])
  training_type: "level_1" | "level_2" | "level_3";

  @IsOptional()
  @IsString()
  @MaxLength(50)
  farm_size?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  region?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
}
