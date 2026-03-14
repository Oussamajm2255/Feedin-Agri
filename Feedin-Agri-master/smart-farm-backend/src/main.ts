// src/main.ts
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  try {
    logger.log('🚀 Starting Smart Farm Backend...');
    logger.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.log(`🗄️ Database URL: ${process.env.DATABASE_URL ? 'Set' : 'Not set'}`);
    logger.log(`🔌 MQTT Broker: ${process.env.MQTT_BROKER || 'Not set'}`);
    
  const isProduction = process.env.NODE_ENV === 'production';

    const app = await NestFactory.create(AppModule, {
      // ✅ Only show errors/warnings in production to reduce noise
      logger: isProduction
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    
    // ✅ Gzip/Brotli compression — reduces transfer sizes by ~60-80%
    app.use(compression());

    // ✅ Security headers
    app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://unpkg.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://unpkg.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'", "https://*.railway.app", "wss://*.railway.app", "https://api.openweathermap.org"],
          workerSrc: ["'self'", "blob:"],
        },
      },
      strictTransportSecurity: {
        maxAge: 31536000,
        includeSubDomains: true,
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(cookieParser());

    // ✅ Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // ✅ Global serializer — ensures @Exclude() on entities strips sensitive fields
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

    // ✅ Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: process.env.NODE_ENV === 'production',
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // ✅ Global prefix for all routes
    app.setGlobalPrefix('api/v1');

    // ✅ CORS Configuration
    // Note: When credentials: true, we cannot use '*' - must specify exact origins
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    let allowedOrigins: string[] | ((origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => void);
    
    // Default origins that should always be included
    const defaultOrigins = [
      'http://127.0.0.1:4200',
      'http://localhost:4200',
      'https://feedin.up.railway.app',
    ];
    
    if (corsOrigin) {
      if (corsOrigin === '*') {
        if (process.env.NODE_ENV === 'production') {
          // 🔒 SECURITY: Never allow wildcard CORS in production with credentials
          logger.warn('⚠️ CORS_ORIGIN=* is NOT allowed in production. Falling back to default origins.');
          allowedOrigins = defaultOrigins;
        } else {
          // Allow all origins only in development
          allowedOrigins = (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
            callback(null, true);
          };
          logger.warn('⚠️ CORS: Allowing all origins — DEVELOPMENT ONLY');
        }
      } else {
        // Split by comma and trim each origin, merge with defaults
        const envOrigins = corsOrigin.split(',').map(origin => origin.trim()).filter(Boolean);
        allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])]; // Remove duplicates
        logger.log(`🌐 CORS: Allowing origins: ${allowedOrigins.join(', ')}`);
      }
    } else {
      // Default fallback origins - include the frontend domain
      allowedOrigins = defaultOrigins;
      logger.log(`🌐 CORS: Using default origins: ${allowedOrigins.join(', ')}`);
    }

    app.enableCors({
      origin: allowedOrigins,
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
      credentials: true,
      preflightContinue: false,
      optionsSuccessStatus: 204,
      maxAge: 86400, // 24 hours
    });
    
    logger.log(`✅ CORS configured successfully`);
    logger.log(`📋 CORS_ORIGIN env: ${corsOrigin || 'not set'}`);

    // ✅ Trust Railway's reverse proxy for correct IP/HTTPS detection
    const httpAdapter = app.getHttpAdapter();
    if (httpAdapter) {
      const expressApp = httpAdapter.getInstance();
      if (typeof expressApp?.set === 'function') {
        expressApp.set('trust proxy', 1);
      }
    }

    const port = process.env.PORT || 3000;
    const server = await app.listen(port);

    // ✅ Keep-alive timeout > Railway's 30s idle timeout to prevent ECONNRESET
    server.keepAliveTimeout = 65_000;
    server.headersTimeout = 66_000;

    
    logger.log(`🚀 Smart Farm Backend is running on: http://localhost:${port}/api/v1`);
    logger.log(`📊 Health check: http://localhost:${port}/api/v1/health`);
    logger.log(`🔧 API Documentation: http://localhost:${port}/api/v1`);
    logger.log(`✅ Backend started successfully!`);
    
  } catch (error) {
    logger.error('❌ Failed to start Smart Farm Backend:', error);
    logger.error('Error details:', error.message);
    logger.error('Stack trace:', error.stack);
    
    // Try to provide more specific error information
    if (error.message?.includes('database')) {
      logger.error('💡 Database connection issue detected. Check DATABASE_URL environment variable.');
    }
    if (error.message?.includes('port')) {
      logger.error('💡 Port binding issue detected. Check PORT environment variable.');
    }
    
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

bootstrap().catch((error) => {
  console.error('❌ Bootstrap failed:', error);
  process.exit(1);
});
