import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';
import { JwtService } from '@nestjs/jwt';
import { AdminNotification } from '../../entities/admin-notification.entity';

@WebSocketGateway({
  namespace: '/admin-notifications',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class AdminNotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedAdmins: Map<string, Socket> = new Map();

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      // Validate JWT token from handshake
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.replace('Bearer ', '');
      
      if (!token) {
        console.log('❌ [ADMIN-WS] Connection rejected - no token');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      
      // Only allow admin/moderator roles
      if (!payload.role || !['admin', 'moderator'].includes(payload.role)) {
        console.log('❌ [ADMIN-WS] Connection rejected - not admin/moderator');
        client.disconnect();
        return;
      }

      const userId = payload.user_id || payload.sub;
      this.connectedAdmins.set(client.id, client);
      (client as any).userId = userId;
      (client as any).role = payload.role;

      console.log(`✅ [ADMIN-WS] Admin connected: ${userId} (${payload.role})`);
      
      // Send connection confirmation
      client.emit('connected', { 
        message: 'Connected to admin notifications',
        userId,
        role: payload.role,
      });
    } catch (error) {
      console.log('❌ [ADMIN-WS] Connection rejected - invalid token:', error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as any).userId;
    this.connectedAdmins.delete(client.id);
    console.log(`👋 [ADMIN-WS] Admin disconnected: ${userId || client.id}`);
  }

  /**
   * Broadcast new notification to all connected admins
   */
  @OnEvent('admin.notification.created')
  handleNotificationCreated(notification: AdminNotification) {
    console.log(`📢 [ADMIN-WS] Broadcasting new notification: ${notification.id}`);
    this.server.emit('notification:new', notification);
  }

  /**
   * Broadcast notification update to all connected admins
   */
  @OnEvent('admin.notification.updated')
  handleNotificationUpdated(notification: AdminNotification) {
    console.log(`📢 [ADMIN-WS] Broadcasting updated notification: ${notification.id}`);
    this.server.emit('notification:updated', notification);
  }

  /**
   * Broadcast bulk update to all connected admins
   */
  @OnEvent('admin.notification.bulk-updated')
  handleBulkUpdate(data: { ids: string[]; action: string }) {
    console.log(`📢 [ADMIN-WS] Broadcasting bulk update: ${data.action} for ${data.ids.length} notifications`);
    this.server.emit('notification:bulk-updated', data);
  }

  /**
   * Handle subscribe to specific notification types
   */
  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, data: { severities?: string[]; domains?: string[] }) {
    // Store subscription preferences on the client
    (client as any).subscriptions = data;
    console.log(`📝 [ADMIN-WS] Client ${client.id} subscribed to:`, data);
    return { success: true, subscriptions: data };
  }

  /**
   * Get number of connected admins
   */
  getConnectedAdminsCount(): number {
    return this.connectedAdmins.size;
  }

  /**
   * Emit a system status update
   */
  emitSystemStatus(status: { healthy: boolean; services: Record<string, boolean> }) {
    this.server.emit('system:status', status);
  }
}
