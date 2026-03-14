import { Controller, Post, Body, HttpCode, HttpStatus, Res, Get, UseGuards, Req, Query, UnauthorizedException } from '@nestjs/common';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginUserDto } from '../users/dto/login-user.dto';
import { Response, Request } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { randomBytes } from 'crypto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ short: { limit: 3, ttl: 10000 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginUserDto, @Res({ passthrough: true }) res: Response) {
    const user = await this.authService.validateUser(loginDto);
    const { accessToken, refreshToken, user: safeUser, refreshMaxAgeMs } = await this.authService.login(user);

    // Access token cookie — short-lived (15 minutes)
    res.cookie('sf_auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, 
      path: '/',
    });

    // Refresh token cookie — role-based lifespan (24h for admin, 7d for field workers)
    res.cookie('sf_refresh', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshMaxAgeMs,
      path: '/api/v1/auth/refresh',
    });

    return { user: safeUser };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const currentRefreshToken = req.cookies?.['sf_refresh'];
    if (!currentRefreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    const { accessToken, refreshToken: newRefreshToken, refreshMaxAgeMs } = await this.authService.refreshAccessToken(currentRefreshToken);

    // Set new short-lived access token
    res.cookie('sf_auth', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, 
      path: '/',
    });

    // Set new refreshed access token for rolling session
    res.cookie('sf_refresh', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: refreshMaxAgeMs,
      path: '/api/v1/auth/refresh',
    });

    return { ok: true };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('sf_auth', { path: '/' });
    res.clearCookie('sf_refresh', { path: '/api/v1/auth/refresh' });
    return { ok: true };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Req() req) {
    return req.user;
  }

  @SkipThrottle()
  @Get('csrf')
  @HttpCode(HttpStatus.OK)
  async csrf(@Res({ passthrough: true }) res: Response) {
    const token = randomBytes(32).toString('hex');
    res.cookie('sf_csrf', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 1000 * 60 * 60 * 24,
      path: '/',
    });
    return { csrfToken: token };
  }

  @SkipThrottle()
  @Get('check-email')
  @HttpCode(HttpStatus.OK)
  async checkEmail(@Query('email') email: string) {
    if (!email) {
      return { exists: false };
    }
    const exists = await this.authService.checkEmailExists(email);
    return { exists };
  }
}
