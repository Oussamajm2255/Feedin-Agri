import { Controller, Get, Post, Patch, Query, Param, Body, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { AdminNotificationsService } from './admin-notifications.service';
import { CreateAdminNotificationDto, QueryAdminNotificationsDto, BulkActionDto } from './dto/admin-notification.dto';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminNotificationsController {
  constructor(private readonly adminNotificationsService: AdminNotificationsService) {}

  /**
   * Get admin notification counts for header badges
   */
  @Get('counts')
  async getCounts() {
    return this.adminNotificationsService.getCounts();
  }

  /**
   * Get unresolved critical notifications (pinned at top)
   */
  @Get('critical')
  async getCritical() {
    return this.adminNotificationsService.getUnresolvedCritical();
  }

  /**
   * List admin notifications with filters
   */
  @Get()
  async list(@Query() query: QueryAdminNotificationsDto) {
    return this.adminNotificationsService.list(query);
  }

  /**
   * Get a single notification by ID
   */
  @Get(':id')
  async getById(@Param('id') id: string) {
    return this.adminNotificationsService.getById(id);
  }

  /**
   * Create a new admin notification (for testing/manual creation)
   */
  @Post()
  async create(@Body() dto: CreateAdminNotificationDto) {
    return this.adminNotificationsService.create(dto);
  }

  /**
   * Acknowledge a notification
   */
  @Patch(':id/acknowledge')
  async acknowledge(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.adminNotificationsService.acknowledge(id, user?.user_id || user?.id);
  }

  /**
   * Resolve a notification
   */
  @Patch(':id/resolve')
  async resolve(@Param('id') id: string, @Req() req: Request) {
    const user = req.user as any;
    return this.adminNotificationsService.resolve(id, user?.user_id || user?.id);
  }

  /**
   * Bulk acknowledge notifications
   */
  @Post('bulk-acknowledge')
  async bulkAcknowledge(@Body() dto: BulkActionDto, @Req() req: Request) {
    const user = req.user as any;
    return this.adminNotificationsService.bulkAcknowledge(dto.ids, user?.user_id || user?.id);
  }

  /**
   * Bulk resolve notifications
   */
  @Post('bulk-resolve')
  async bulkResolve(@Body() dto: BulkActionDto, @Req() req: Request) {
    const user = req.user as any;
    return this.adminNotificationsService.bulkResolve(dto.ids, user?.user_id || user?.id);
  }

  /**
   * Export notifications for audit
   */
  @Get('export/audit')
  async exportAudit(@Query() query: QueryAdminNotificationsDto) {
    const notifications = await this.adminNotificationsService.exportForAudit(query);
    return {
      exportedAt: new Date().toISOString(),
      count: notifications.length,
      data: notifications,
    };
  }
}
