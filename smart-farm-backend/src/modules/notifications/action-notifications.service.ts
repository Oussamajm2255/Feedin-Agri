import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Device } from '../../entities/device.entity';
import { Farm } from '../farms/farm.entity';
import { NotificationsService } from './notifications.service';

@Injectable()
export class ActionNotificationsService {
  private readonly logger = new Logger(ActionNotificationsService.name);

  constructor(
    @InjectRepository(Device)
    private readonly deviceRepo: Repository<Device>,
    @InjectRepository(Farm)
    private readonly farmRepo: Repository<Farm>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Events carry the device id in different places: ActionDispatcher emits an
   * ActionResult ({ action, success, context: { deviceId } }) while the ack and
   * timeout paths put deviceId at the top level.
   */
  private deviceIdOf(data: any): string | undefined {
    return data?.deviceId || data?.device_id || data?.context?.deviceId || undefined;
  }

  /**
   * Resolve the farm owner for a device. Returns null when the device id is
   * missing: TypeORM treats `where: { device_id: undefined }` as "any device",
   * which used to send these notifications to the first device's owner.
   */
  private async ownerOf(deviceId: string | undefined): Promise<string | null> {
    if (!deviceId) return null;
    const device = await this.deviceRepo.findOne({
      where: { device_id: deviceId },
      relations: ['farm'],
    });
    return device?.farm?.owner_id ?? null;
  }

  // Timeouts are reported to the farmer by ActionEffectivenessMonitor
  // ("⏱️ Action Timeout — <device>"), which has the device name and guidance.
  // Creating a second "Action Timeout" here duplicated every timeout.

  @OnEvent('action.executed')
  async handleActionExecuted(data: any) {
    const deviceId = this.deviceIdOf(data);
    try {
      const ownerId = await this.ownerOf(deviceId);
      if (!ownerId) {
        this.logger.warn(`🔔 [ACTION-NOTIFICATIONS] No farm owner found for device: ${deviceId ?? '(none)'}`);
        return;
      }

      const succeeded = data?.success !== false;
      await this.notificationsService.create({
        user_id: ownerId,
        level: succeeded ? 'success' : 'critical',
        source: 'action',
        title: succeeded ? 'Action Executed' : 'Action Failed',
        message: succeeded
          ? `${data.action} sent to device ${deviceId}`
          : `${data.action} could not be sent to device ${deviceId}`,
        context: {
          action: data.action,
          deviceId,
          type: succeeded ? 'executed' : 'failed',
        },
      });
    } catch (error) {
      this.logger.error(`🔔 [ACTION-NOTIFICATIONS] Error creating executed notification:`, error);
    }
  }

  @OnEvent('action.failed')
  async handleActionFailed(data: any) {
    const deviceId = this.deviceIdOf(data);
    try {
      const ownerId = await this.ownerOf(deviceId);
      if (!ownerId) {
        this.logger.warn(`🔔 [ACTION-NOTIFICATIONS] No farm owner found for device: ${deviceId ?? '(none)'}`);
        return;
      }

      const command = data.actionCommand || data.action || 'Action';
      await this.notificationsService.create({
        user_id: ownerId,
        level: 'critical',
        source: 'action',
        title: 'Action Failed',
        message: `${command} failed on device ${deviceId}`,
        context: {
          actionId: data.actionId,
          actionCommand: command,
          deviceId,
          error: data.error,
          type: 'failed',
        },
      });
    } catch (error) {
      this.logger.error(`🔔 [ACTION-NOTIFICATIONS] Error creating failed notification:`, error);
    }
  }
}
