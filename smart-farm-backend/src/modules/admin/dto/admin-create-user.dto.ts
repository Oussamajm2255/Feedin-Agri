// src/modules/admin/dto/admin-create-user.dto.ts
import { IsEmail, IsString, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRole, UserStatus } from '../../../entities/user.entity';

export class AdminCreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsString()
  first_name: string;

  @IsString()
  last_name: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole = UserRole.FARMER;

  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus = UserStatus.ACTIVE;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  country?: string;
}

