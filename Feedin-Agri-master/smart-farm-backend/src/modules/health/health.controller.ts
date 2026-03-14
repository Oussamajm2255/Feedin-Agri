import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { HealthService } from './health.service';
import { CacheControlInterceptor } from '../../common/interceptors/cache-control.interceptor';

@Controller('health')
@UseInterceptors(new CacheControlInterceptor(60))
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getHealth() {
    try {
      // Simple health check; minimize info exposure in production
      const basic = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
      } as const;

      if (process.env.NODE_ENV === 'production') {
        return basic;
      }

      return {
        ...basic,
        environment: process.env.NODE_ENV || 'development',
        port: process.env.PORT || 3000,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  @Get('database')
  async getDatabaseHealth() {
    try {
      return await this.healthService.getDatabaseHealth();
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('mqtt')
  async getMqttHealth() {
    try {
      return await this.healthService.getMqttHealth();
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('sensors')
  async getSensorsHealth() {
    try {
      return await this.healthService.getSensorsHealth();
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('detailed')
  async getDetailedHealth() {
    try {
      return await this.healthService.getDetailedHealth();
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
