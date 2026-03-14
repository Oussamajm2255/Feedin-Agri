import { Controller, Get, Param, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardAggregatorService } from './dashboard-aggregator.service';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly aggregator: DashboardAggregatorService,
  ) {}

  /**
   * GET /dashboard/overview
   * Legacy overview endpoint (backward compat).
   */
  @Get('overview')
  getOverview() {
    return this.dashboardService.getOverview();
  }

  /**
   * GET /dashboard/farm/:farmId
   * Zone-centric aggregation for a farm.
   */
  @Get('farm/:farmId')
  getFarmDashboard(@Param('farmId') farmId: string) {
    return this.aggregator.aggregateByFarm(farmId);
  }

  /**
   * GET /dashboard/zone/:zoneId
   * Detailed dashboard for a single zone.
   */
  @Get('zone/:zoneId')
  getZoneDashboard(@Param('zoneId') zoneId: string) {
    return this.aggregator.aggregateByZone(zoneId);
  }
}
