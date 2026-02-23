import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    // Ensure CORS headers are set even for errors
    this.setCorsHeaders(request, response);

    const exceptionResponse = exception.getResponse();
    const error = typeof exceptionResponse === 'string'
      ? { message: exceptionResponse }
      : exceptionResponse;

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: error,
    };

    this.logger.error(
      `${request.method} ${request.url}`,
      JSON.stringify(errorResponse),
    );

    response.status(status).json(errorResponse);
  }

  private setCorsHeaders(request: Request, response: Response) {
    const origin = request.headers.origin;
    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin, X-Requested-With');
      response.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Ensure CORS headers are set even for errors
    this.setCorsHeaders(request, response);

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? exception.getResponse()
      : 'Internal server error';

    // Enhanced logging for 401 errors to help debug authentication issues
    if (status === 401) {
      const hasCookie = !!request?.cookies?.['sf_auth'];
      const hasAuthHeader = !!request?.headers?.authorization;
      const cookieValue = request?.cookies?.['sf_auth'];

      this.logger.warn(
        `[401 Unauthorized] ${request.method} ${request.url}` +
        ` | Cookie: ${hasCookie ? 'present' : 'missing'}` +
        ` | Auth Header: ${hasAuthHeader ? 'present' : 'missing'}` +
        ` | Origin: ${request.headers.origin || 'none'}` +
        ` | All Cookies: ${JSON.stringify(Object.keys(request?.cookies || {}))}`
      );

      if (hasCookie && cookieValue) {
        // Try to decode JWT to see if it's valid (without verification)
        try {
          const jwtParts = cookieValue.split('.');
          if (jwtParts.length === 3) {
            const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
            this.logger.debug(`[401 Debug] JWT payload - sub: ${payload.sub}, exp: ${payload.exp ? new Date(payload.exp * 1000).toISOString() : 'none'}`);

            // Check if token is expired
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
              this.logger.warn(`[401 Debug] JWT token is EXPIRED. Exp: ${new Date(payload.exp * 1000).toISOString()}`);
            }
          }
        } catch (e) {
          this.logger.debug(`[401 Debug] Failed to decode JWT cookie: ${e.message}`);
        }
      }
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error: typeof message === 'string' ? { message } : message,
    };

    // Log full error details for debugging
    if (exception instanceof Error) {
      this.logger.error(
        `${request.method} ${request.url} - ${exception.message}`,
        exception.stack,
      );
      // Also log the error message in the response for development
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.error = {
          ...(typeof message === 'string' ? { message } : message),
          stack: exception.stack,
        };
      }
    } else {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception,
      );
    }

    response.status(status).json(errorResponse);
  }

  private setCorsHeaders(request: Request, response: Response) {
    const origin = request.headers.origin;
    if (origin) {
      response.setHeader('Access-Control-Allow-Origin', origin);
      response.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
      response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, Accept, Origin, X-Requested-With');
      response.setHeader('Access-Control-Allow-Credentials', 'true');
    }
  }
}
