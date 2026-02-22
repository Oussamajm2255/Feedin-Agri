// src/modules/admin/dto/admin-overview-summary.dto.ts
export class AdminOverviewSummaryDto {
  totalFarms: number;
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  maintenanceDevices: number;
  totalSensors: number;
  totalUsers: number;
  totalFarmers: number;
  totalAdmins: number;
  activeUsers: number;
  alertsToday: number;
  criticalAlertsUnread: number;
  actionsToday: number;
  autoActionsToday: number;
  manualActionsToday: number;
}

