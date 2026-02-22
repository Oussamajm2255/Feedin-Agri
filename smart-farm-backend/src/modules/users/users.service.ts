// src/modules/users/users.service.ts
import { Injectable, NotFoundException, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserStatus } from '../../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { SafeUser } from './interfaces/user.interface';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<SafeUser> {
    try {
      // Check if email already exists
      const existingUser = await this.usersRepository.findOne({
        where: { email: createUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }

      // Ensure status defaults to ACTIVE if not provided
      const userStatus = createUserDto.status || UserStatus.ACTIVE;

      const user = this.usersRepository.create({
        ...createUserDto,
        user_id: createUserDto.user_id || uuidv4(),
        status: userStatus,
      });

      const savedUser = await this.usersRepository.save(user);
      
      // Remove password from response and return as SafeUser
      const { password, hashPassword, validatePassword, ...userWithoutSensitiveData } = savedUser;
      return userWithoutSensitiveData as SafeUser;
    } catch (error) {
      // Log the full error for debugging
      console.error('Error creating user:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        errno: (error as any).errno,
        stack: error.stack
      });
      
      // Re-throw NestJS exceptions as-is
      if (error.status && error.status >= 400 && error.status < 500) {
        throw error;
      }
      
      // Re-throw with more context if it's a database constraint error
      if (error.code === '23505' || error.sqlState === '23000' || error.code === 'ER_DUP_ENTRY') {
        // Unique constraint violation
        throw new ConflictException('Email already exists');
      } else if (error.code === '23502') {
        // PostgreSQL Not null constraint violation
        throw new ConflictException('Required fields are missing');
      } else if (
        (error.message && error.message.includes('enum')) ||
        (error.message && error.message.includes("Data truncated for column 'role'")) ||
        (error.message && error.message.includes("Data truncated for column 'status'")) ||
        error.code === 'ER_TRUNCATED_WRONG_VALUE_FOR_FIELD' ||
        error.code === 'WARN_DATA_TRUNCATED'
      ) {
        // Enum value error - MySQL or PostgreSQL
        throw new ConflictException(`Invalid role or status value. Allowed role values: admin, farmer, moderator. Received role: ${createUserDto.role}, status: ${createUserDto.status}`);
      }
      
      // DEBUG: Throw explicit InternalServerError with the real message so we can see it on frontend
      throw new ConflictException(`Database Error: ${error.message || 'Unknown error'}`);
    }
  }

  async findAll(includeFarms = false): Promise<SafeUser[]> {
    const relations = includeFarms ? ['farms'] : [];
    
    const users = await this.usersRepository.find({
      relations,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        city: true,
        country: true,
        date_of_birth: true,
        gender: true,
        profile_picture: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      },
      order: { created_at: 'DESC' }
    });

    return users;
  }

  async findOne(id: string, includeFarms = false): Promise<SafeUser> {
    const relations = includeFarms ? ['farms'] : [];
    
    const user = await this.usersRepository.findOne({
      where: { user_id: id },
      relations,
      select: {
        user_id: true,
        email: true,
        first_name: true,
        last_name: true,
        phone: true,
        role: true,
        status: true,
        address: true,
        city: true,
        country: true,
        date_of_birth: true,
        gender: true,
        profile_picture: true,
        last_login: true,
        created_at: true,
        updated_at: true,
      }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email }
    });
  }

  async validateUser(loginDto: LoginUserDto): Promise<SafeUser | null> {
    const user = await this.findByEmail(loginDto.email);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);
    
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    await this.usersRepository.update(user.user_id, {
      last_login: new Date()
    });

    const { password, hashPassword, validatePassword, ...userWithoutSensitiveData } = user;
    return userWithoutSensitiveData as SafeUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({
      where: { user_id: id }
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check if email is being updated and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email }
      });

      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    await this.usersRepository.update(id, updateUserDto);
    
    return this.findOne(id);
  }

  async updatePassword(id: string, newPassword: string): Promise<void> {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    const result = await this.usersRepository.update(id, {
      password: hashedPassword
    });

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  async getUserFarms(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { user_id: userId },
      relations: ['farms', 'farms.devices', 'farms.sensors']
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return user.farms;
  }
}