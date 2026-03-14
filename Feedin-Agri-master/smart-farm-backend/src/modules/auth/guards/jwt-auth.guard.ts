import { Injectable, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();
    const hasCookie = !!request?.cookies?.['sf_auth'];
    const hasAuthHeader = !!request?.headers?.authorization;

    if (!hasCookie && !hasAuthHeader) {
      this.logger.debug(`[JWT Guard] No token found in request to ${request.method} ${request.url}`);
    }

    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      const request = context.switchToHttp().getRequest<Request>();
      this.logger.debug(
        `[JWT Guard] Authentication failed for ${request.method} ${request.url}: ${err?.message || info?.message || 'No user found'}`
      );
      throw err || new UnauthorizedException('Authentication required. Please log in.');
    }
    return user;
  }
}
