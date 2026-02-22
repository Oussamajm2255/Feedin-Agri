// src/modules/admin/dto/admin-users-response.dto.ts
import { UserRole, UserStatus } from '../../../entities/user.entity';

export interface AdminUserListItemDto {
  user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  city: string | null;
  country: string | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
  farm_count: number;
}

export interface AdminUsersResponseDto {
  items: AdminUserListItemDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

