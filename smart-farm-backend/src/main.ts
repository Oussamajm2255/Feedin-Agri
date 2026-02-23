// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
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

    // Add a small delay to allow database to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const app = await NestFactory.create(AppModule, {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // ✅ Trust Proxy (Essential for cross-domain cookies on Railway)
    (app.getHttpAdapter().getInstance() as any).set('trust proxy', 1);

    // ✅ CORS Configuration (MOVE TO TOP to handle preflight earlier)
    const corsOrigin = process.env.CORS_ORIGIN?.trim();
    const defaultOrigins = [
      'https://feedin-agri-production.up.railway.app',
      'https://feedingreen.up.railway.app',
      'https://feedingreen.com',
      'http://localhost:4200',
      'http://127.0.0.1:4200',
    ];

    app.enableCors({
      origin: (origin, callback) => {
        if (!origin || defaultOrigins.includes(origin) || (corsOrigin && corsOrigin.split(',').includes(origin))) {
          callback(null, true);
        } else if (origin.endsWith('.up.railway.app') || origin.endsWith('feedingreen.com')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'Accept', 'Origin', 'X-Requested-With'],
      exposedHeaders: ['Set-Cookie'],
      credentials: true,
      maxAge: 86400,
    });
    logger.log(`✅ CORS configured early | Origins: ${defaultOrigins.concat(corsOrigin || []).join(', ')}`);

    // ✅ Security headers
    app.use(helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }));
    app.use(cookieParser());

    // ✅ Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());

    // ✅ Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // ✅ Global prefix for all routes
    app.setGlobalPrefix('api/v1');



    const port = process.env.PORT || 3000;
    await app.listen(port);

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
