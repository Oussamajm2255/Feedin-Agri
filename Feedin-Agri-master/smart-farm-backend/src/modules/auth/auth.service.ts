import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { SafeUser } from '../users/interfaces/user.interface';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateUser(loginDto: LoginUserDto): Promise<SafeUser | null> {
    try {
      return await this.usersService.validateUser(loginDto);
    } catch (error) {
      throw error;
    }
  }

  async login(user: SafeUser) {
    const payload = { 
      email: user.email, 
      sub: user.user_id,
      role: user.role 
    };
    
    const accessToken = this.jwtService.sign(payload);

    const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET')
      || this.configService.getOrThrow<string>('JWT_SECRET');
    
    // Role-based expiration: Admin = 24h, Field Worker = 7d
    const isAdmin = user.role === 'admin';
    const refreshExpiresInStr = isAdmin ? '24h' : '7d';
    const refreshMaxAgeMs = isAdmin 
      ? 24 * 60 * 60 * 1000 
      : 7 * 24 * 60 * 60 * 1000;

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresInStr,
    });

    return {
      user,
      accessToken,
      refreshToken,
      refreshMaxAgeMs,
    };
  }

  async refreshAccessToken(currentRefreshToken: string): Promise<{ accessToken: string; refreshToken: string; refreshMaxAgeMs: number }> {
    try {
      const refreshSecret = this.configService.get<string>('REFRESH_JWT_SECRET')
        || this.configService.getOrThrow<string>('JWT_SECRET');
      
      const payload = this.jwtService.verify(currentRefreshToken, {
        secret: refreshSecret,
      });
      
      const user = await this.validateUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { email: user.email, sub: user.user_id, role: user.role };
      const accessToken = this.jwtService.sign(newPayload);

      // Issue a new refresh token to create a "rolling session"
      const isAdmin = user.role === 'admin';
      const refreshExpiresInStr = isAdmin ? '24h' : '7d';
      const refreshMaxAgeMs = isAdmin 
        ? 24 * 60 * 60 * 1000 
        : 7 * 24 * 60 * 60 * 1000;

      const refreshToken = this.jwtService.sign(newPayload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresInStr,
      });

      return { accessToken, refreshToken, refreshMaxAgeMs };
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async validateUserById(userId: string): Promise<SafeUser | null> {
    try {
      return await this.usersService.findOne(userId);
    } catch (error) {
      return null;
    }
  }

  async checkEmailExists(email: string): Promise<boolean> {
    try {
      const user = await this.usersService.findByEmail(email);
      return !!user;
    } catch (error) {
      return false;
    }
  }
}

