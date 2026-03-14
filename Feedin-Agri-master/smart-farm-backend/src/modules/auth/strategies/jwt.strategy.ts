import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthService } from '../auth.service';
import { SafeUser } from '../../users/interfaces/user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly authService: AuthService,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const cookieToken = req?.cookies?.['sf_auth'] || null;
          const headerToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
          
          // Debug logging (only in development)
          if (process.env.NODE_ENV !== 'production') {
            const hasCookie = !!cookieToken;
            const hasHeader = !!headerToken;
            this.logger.debug(`[JWT Extraction] Cookie: ${hasCookie ? 'present' : 'missing'}, Header: ${hasHeader ? 'present' : 'missing'}`);
            if (!hasCookie && !hasHeader) {
              this.logger.debug(`[JWT Extraction] All cookies: ${JSON.stringify(req?.cookies || {})}`);
            }
          }
          
          return cookieToken || headerToken || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow('JWT_SECRET'),
    });
  }

  async validate(payload: any): Promise<SafeUser> {
    if (!payload || !payload.sub) {
      this.logger.warn('[JWT Validation] Invalid payload: missing sub field');
      throw new UnauthorizedException('Invalid token payload');
    }

    const userId = payload.sub;
    this.logger.debug(`[JWT Validation] Validating user with ID: ${userId}`);

    const user = await this.authService.validateUserById(userId);
    
    if (!user) {
      this.logger.warn(`[JWT Validation] User not found for ID: ${userId}`);
      throw new UnauthorizedException('User not found or token is invalid');
    }

    this.logger.debug(`[JWT Validation] User validated successfully: ${user.email}`);
    return user;
  }
}
