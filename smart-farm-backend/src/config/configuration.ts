export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  // No fallback: a missing JWT_SECRET must stop startup (modules call
  // configService.getOrThrow('JWT_SECRET')) rather than sign tokens with a
  // publicly known default.
  JWT_SECRET: process.env.JWT_SECRET,
  REFRESH_JWT_SECRET: process.env.REFRESH_JWT_SECRET || process.env.JWT_SECRET,
  DATABASE_URL: process.env.DATABASE_URL,
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:4200',
  MQTT_BROKER: process.env.MQTT_BROKER || process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883',
});
