import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere, In, Between, LessThanOrEqual, MoreThanOrEqual, ILike } from 'typeorm';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { AdminNotification, AdminNotificationSeverity, AdminNotificationDomain, AdminNotificationStatus } from '../../entities/admin-notification.entity';
import { CreateAdminNotificationDto, QueryAdminNotificationsDto, AdminNotificationCountsDto, AdminNotificationsListResponseDto } from './dto/admin-notification.dto';

@Injectable()
export class AdminNotificationsService {
  constructor(
    @InjectRepository(AdminNotification)
    private readonly repo: Repository<AdminNotification>,
    private readonly events: EventEmitter2,
  ) {}

  @OnEvent('user.registered')
  async handleUserRegisteredEvent(user: any) {
    if (user.status === 'pending') {
      await this.create({
        type: 'user_registration',
        severity: 'info',
        domain: 'users',
        title: 'New Account Approval Required',
        message: `A new user ${user.first_name} ${user.last_name} (${user.email}) has requested an account and is pending activation.`,
        context: {
          userId: user.user_id,
          userName: `${user.first_name} ${user.last_name}`,
          email: user.email,
          role: user.role,
          suggestedActions: [
            'Review user registration details',
            'Activate or reject the account'
          ]
        },
      });
    }
  }

  /**
   * Create a new admin notification
   */
  async create(dto: CreateAdminNotificationDto): Promise<AdminNotification> {
    console.log('🔔 [ADMIN-NOTIFICATIONS] Creating notification:', dto.type, dto.severity);

    // For critical notifications, auto-pin until resolved
    const pinned = dto.severity === 'critical' ? true : (dto.pinned_until_resolved ?? false);

    const notification = this.repo.create({
      ...dto,
      pinned_until_resolved: pinned,
      status: 'new',
    });

    const saved = await this.repo.save(notification);
    console.log('🔔 [ADMIN-NOTIFICATIONS] Notification created:', saved.id);

    // Emit event for WebSocket broadcast
    this.events.emit('admin.notification.created', saved);

    return saved;
  }

  /**
   * List admin notifications with filtering and pagination
   */
  async list(query: QueryAdminNotificationsDto): Promise<AdminNotificationsListResponseDto> {
    const { severity, domain, status, from, to, farmId, userId, deviceId, search, page = 1, limit = 50 } = query;

    const qb = this.repo.createQueryBuilder('n');

    // Apply filters
    if (severity) {
      qb.andWhere('n.severity = :severity', { severity });
    }
    if (domain) {
      qb.andWhere('n.domain = :domain', { domain });
    }
    if (status) {
      qb.andWhere('n.status = :status', { status });
    }
    if (from) {
      qb.andWhere('n.created_at >= :from', { from });
    }
    if (to) {
      qb.andWhere('n.created_at <= :to', { to });
    }
    if (farmId) {
      qb.andWhere("n.context->>'farmId' = :farmId", { farmId });
    }
    if (userId) {
      qb.andWhere("n.context->>'userId' = :userId", { userId });
    }
    if (deviceId) {
      qb.andWhere("n.context->>'deviceId' = :deviceId", { deviceId });
    }
    if (search) {
      qb.andWhere('(n.title ILIKE :search OR n.message ILIKE :search)', { search: `%${search}%` });
    }

    // Order: pinned critical first, then by created_at desc
    qb.orderBy('n.pinned_until_resolved', 'DESC')
      .addOrderBy("CASE WHEN n.status = 'new' THEN 0 ELSE 1 END", 'ASC')
      .addOrderBy('n.created_at', 'DESC');

    // Pagination
    const offset = (page - 1) * limit;
    qb.skip(offset).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      hasMore: offset + items.length < total,
    };
  }

  /**
   * Get notification counts by severity for the header badges
   */
  async getCounts(): Promise<AdminNotificationCountsDto> {
    const counts = await this.repo
      .createQueryBuilder('n')
      .select('n.severity', 'severity')
      .addSelect('COUNT(*)', 'count')
      .groupBy('n.severity')
      .getRawMany();

    const unresolvedCount = await this.repo.count({
      where: { status: In(['new', 'acknowledged']) },
    });

    const newCount = await this.repo.count({
      where: { status: 'new' },
    });

    const result: AdminNotificationCountsDto = {
      critical: 0,
      warning: 0,
      info: 0,
      success: 0,
      total: 0,
      unresolved: unresolvedCount,
      newCount,
    };

    for (const row of counts) {
      const sev = row.severity as AdminNotificationSeverity;
      const cnt = parseInt(row.count, 10);
      result[sev] = cnt;
      result.total += cnt;
    }

    return result;
  }

  /**
   * Get a single notification by ID
   */
  async getById(id: string): Promise<AdminNotification> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) {
      throw new NotFoundException(`Admin notification ${id} not found`);
    }
    return notification;
  }

  /**
   * Acknowledge a notification
   */
  async acknowledge(id: string, adminUserId: string): Promise<AdminNotification> {
    const notification = await this.getById(id);

    if (notification.status === 'resolved') {
      return notification; // Already resolved, no action needed
    }

    notification.status = 'acknowledged';
    notification.acknowledged_at = new Date();
    notification.acknowledged_by = adminUserId;

    const saved = await this.repo.save(notification);
    this.events.emit('admin.notification.updated', saved);

    console.log('✅ [ADMIN-NOTIFICATIONS] Notification acknowledged:', id);
    return saved;
  }

  /**
   * Resolve a notification
   */
  async resolve(id: string, adminUserId: string): Promise<AdminNotification> {
    const notification = await this.getById(id);

    notification.status = 'resolved';
    notification.resolved_at = new Date();
    notification.resolved_by = adminUserId;
    notification.pinned_until_resolved = false;

    const saved = await this.repo.save(notification);
    this.events.emit('admin.notification.updated', saved);

    console.log('✅ [ADMIN-NOTIFICATIONS] Notification resolved:', id);
    return saved;
  }

  /**
   * Bulk acknowledge notifications
   */
  async bulkAcknowledge(ids: string[], adminUserId: string): Promise<{ updated: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(AdminNotification)
      .set({
        status: 'acknowledged',
        acknowledged_at: new Date(),
        acknowledged_by: adminUserId,
      })
      .where('id IN (:...ids)', { ids })
      .andWhere('status = :status', { status: 'new' })
      .execute();

    this.events.emit('admin.notification.bulk-updated', { ids, action: 'acknowledged' });
    return { updated: result.affected ?? 0 };
  }

  /**
   * Bulk resolve notifications
   */
  async bulkResolve(ids: string[], adminUserId: string): Promise<{ updated: number }> {
    const result = await this.repo
      .createQueryBuilder()
      .update(AdminNotification)
      .set({
        status: 'resolved',
        resolved_at: new Date(),
        resolved_by: adminUserId,
        pinned_until_resolved: false,
      })
      .where('id IN (:...ids)', { ids })
      .andWhere('status != :status', { status: 'resolved' })
      .execute();

    this.events.emit('admin.notification.bulk-updated', { ids, action: 'resolved' });
    return { updated: result.affected ?? 0 };
  }

  /**
   * Get unresolved critical notifications (pinned)
   */
  async getUnresolvedCritical(): Promise<AdminNotification[]> {
    return this.repo.find({
      where: {
        severity: 'critical',
        status: In(['new', 'acknowledged']),
        pinned_until_resolved: true,
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * Export notifications for audit
   */
  async exportForAudit(query: QueryAdminNotificationsDto): Promise<AdminNotification[]> {
    const result = await this.list({ ...query, limit: 1000, page: 1 });
    return result.items as AdminNotification[];
  }

  /**
   * Delete old resolved notifications (cleanup job)
   */
  async cleanupOldResolved(olderThanDays: number = 90): Promise<{ deleted: number }> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .from(AdminNotification)
      .where('status = :status', { status: 'resolved' })
      .andWhere('resolved_at < :cutoff', { cutoff: cutoffDate })
      .execute();

    console.log(`🧹 [ADMIN-NOTIFICATIONS] Cleaned up ${result.affected} old notifications`);
    return { deleted: result.affected ?? 0 };
  }
}
