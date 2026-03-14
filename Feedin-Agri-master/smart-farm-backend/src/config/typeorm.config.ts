import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

/** Maximum DB connections per pool — tune by environment */
const getPoolSize = (): number => {
  const env = process.env.NODE_ENV;
  if (env === 'production') return 25;
  if (env === 'test') return 3;
  return 10; // development
};

/**
 * Shared TypeORM extra connection pool options.
 * Sets PostgreSQL-specific tunables for reliability and performance.
 */
const buildPoolConfig = () => ({
  max: getPoolSize(),
  idleTimeoutMillis: 20_000,         // Release idle connections after 20s
  connectionTimeoutMillis: 15_000,   // Fail fast if no connection available in 15s
  statement_timeout: 30_000,         // Kill SQL that runs > 30s to protect the pool
  application_name: 'smart-farm-api', // Visible in pg_stat_activity for monitoring
});

export const typeOrmConfig = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  const isProduction = configService.get('NODE_ENV') === 'production';
  const isDebug = configService.get('LOG_LEVEL', 'error') === 'debug';

  // ── Shared runtime options ─────────────────────────────────────────────
  const sharedOptions: Partial<TypeOrmModuleOptions> = {
    type: 'postgres',
    autoLoadEntities: true,
    synchronize: configService.get('DB_SYNCHRONIZE', 'false') === 'true',
    cache: {
      duration: 30_000, // 30-second query-result cache (TypeORM built-in)
    },
    migrationsRun: configService.get('DB_MIGRATIONS_RUN', 'false') === 'true',
    dropSchema: false,
    /**
     * Logging strategy:
     *  - production → log only slow queries (> 5s) + errors
     *  - development → log everything when LOG_LEVEL=debug
     */
    logging: isProduction
      ? ['error']
      : isDebug
        ? ['query', 'error', 'warn']
        : ['error', 'warn'],
    maxQueryExecutionTime: isProduction ? 5_000 : 1_000, // ms before slow-query log
    retryAttempts: 5,
    retryDelay: 5_000,
    migrations: ['dist/migrations/*.js'],
    migrationsTableName: 'migrations',
    extra: buildPoolConfig(),
  } as Partial<TypeOrmModuleOptions>;

  // Check if DATABASE_URL is provided (Railway deployment)
  const databaseUrl = configService.get('DATABASE_URL');

  if (databaseUrl) {
    return {
      ...sharedOptions,
      type: 'postgres',
      url: databaseUrl,
      ssl: { rejectUnauthorized: false },
    } as TypeOrmModuleOptions;
  }

  // Fallback — individual PostgreSQL host/port/credentials (Neon or local)
  const dbHost = configService.get('DB_HOST');
  const dbUser = configService.get('DB_USER');
  const dbPass = configService.get('DB_PASS');
  const dbName = configService.get('DB_NAME');
  const dbPort = +configService.get<number>('DB_PORT', 5432);

  if (dbHost && dbUser && dbPass && dbName) {
    return {
      ...sharedOptions,
      type: 'postgres',
      host: dbHost,
      port: dbPort,
      username: dbUser,
      password: dbPass,
      database: dbName,
      ssl: { rejectUnauthorized: false },
    } as TypeOrmModuleOptions;
  }

  // Neither DATABASE_URL nor individual vars are set — fail with a clear message
  throw new Error(
    'Database configuration missing! ' +
    'Set either DATABASE_URL or DB_HOST, DB_USER, DB_PASS, DB_NAME environment variables.',
  );
};

