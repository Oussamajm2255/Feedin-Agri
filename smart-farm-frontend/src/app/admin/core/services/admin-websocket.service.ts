import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/services/auth.service';

/**
 * AdminWebSocketService
 * Manages the WebSocket connection to the /admin-notifications namespace.
 * This is separate from the farmer NotificationService (which skips admin users).
 * 
 * Connects using HttpOnly cookie auth (withCredentials: true).
 * Provides real-time signals for notification counts, access requests, etc.
 */
@Injectable({ providedIn: 'root' })
export class AdminWebSocketService implements OnDestroy {
  private socket: Socket | null = null;
  private reconnectTimer: any = null;

  // Signals for reactive state
  public isConnected = signal<boolean>(false);
  public notificationCount = signal<number>(0);
  public pendingAccessCount = signal<number>(0);

  // Subjects for event streams
  public newNotification$ = new Subject<any>();
  public notificationUpdated$ = new Subject<any>();
  public bulkUpdated$ = new Subject<any>();
  public accessApproved$ = new Subject<any>();
  public accessRejected$ = new Subject<any>();
  public newAccessRequest$ = new Subject<any>();
  public countsUpdated$ = new Subject<any>();
  public systemStatus$ = new Subject<any>();

  private auth = inject(AuthService);

  /**
   * Connect to the admin WebSocket namespace
   * Should be called after admin login is confirmed
   */
  connect(): void {
    if (this.socket?.connected) {
      console.log('🔌 [ADMIN-WS] Already connected');
      return;
    }

    // Only connect if user is admin/moderator
    const user = this.auth.getCurrentUser();
    if (!user || !['admin', 'moderator'].includes(user.role)) {
      console.log('🚫 [ADMIN-WS] Not an admin/moderator, skipping connection');
      return;
    }

    const wsUrl = `${environment.wsUrl}/admin-notifications`;
    console.log('🔌 [ADMIN-WS] Connecting to:', wsUrl);

    this.socket = io(wsUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true, // Send cookies for HttpOnly auth
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 30000,
    });

    this.setupListeners();
  }

  /**
   * Set up all WebSocket event listeners
   */
  private setupListeners(): void {
    if (!this.socket) return;

    // Connection lifecycle
    this.socket.on('connect', () => {
      console.log('✅ [ADMIN-WS] Connected, socket ID:', this.socket?.id);
      this.isConnected.set(true);
      this.clearReconnectTimer();
    });

    this.socket.on('connected', (data: any) => {
      console.log('✅ [ADMIN-WS] Server confirmed connection:', data);
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('🔌 [ADMIN-WS] Disconnected:', reason);
      this.isConnected.set(false);
      // Auto-reconnect for unexpected disconnects
      if (reason === 'io server disconnect') {
        this.scheduleReconnect();
      }
    });

    this.socket.on('connect_error', (error: any) => {
      console.error('❌ [ADMIN-WS] Connection error:', error.message);
      this.isConnected.set(false);
    });

    // Notification events
    this.socket.on('notification:new', (notification: any) => {
      console.log('🔔 [ADMIN-WS] New notification:', notification.title || notification.id);
      this.newNotification$.next(notification);
      // Increment badge count
      this.notificationCount.update(c => c + 1);
    });

    this.socket.on('notification:updated', (notification: any) => {
      console.log('📝 [ADMIN-WS] Notification updated:', notification.id);
      this.notificationUpdated$.next(notification);
    });

    this.socket.on('notification:bulk-updated', (data: any) => {
      console.log('📦 [ADMIN-WS] Bulk update:', data.action, data.ids?.length, 'items');
      this.bulkUpdated$.next(data);
    });

    // Access request events
    this.socket.on('access:new-request', (data: any) => {
      console.log('🆕 [ADMIN-WS] New access request from:', data.email);
      this.newAccessRequest$.next(data);
      this.pendingAccessCount.update(c => c + 1);
    });

    this.socket.on('access:approved', (data: any) => {
      console.log('✅ [ADMIN-WS] Access approved for:', data.email);
      this.accessApproved$.next(data);
    });

    this.socket.on('access:rejected', (data: any) => {
      console.log('❌ [ADMIN-WS] Access rejected for:', data.email);
      this.accessRejected$.next(data);
    });

    this.socket.on('access:counts-updated', (data: any) => {
      console.log('📊 [ADMIN-WS] Counts updated:', data.action);
      this.countsUpdated$.next(data);
      // Adjust pending count based on action
      if (data.action === 'approved' || data.action === 'rejected') {
        this.pendingAccessCount.update(c => Math.max(0, c - 1));
      }
    });

    // System events
    this.socket.on('system:status', (status: any) => {
      console.log('📊 [ADMIN-WS] System status:', status);
      this.systemStatus$.next(status);
    });
  }

  /**
   * Schedule a reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimer();
    this.reconnectTimer = setTimeout(() => {
      console.log('🔄 [ADMIN-WS] Attempting reconnect...');
      this.connect();
    }, 5000);
  }

  /**
   * Clear any pending reconnect timer
   */
  private clearReconnectTimer(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Disconnect from the WebSocket
   * Should be called on logout
   */
  disconnect(): void {
    this.clearReconnectTimer();
    if (this.socket) {
      console.log('👋 [ADMIN-WS] Disconnecting...');
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected.set(false);
    this.notificationCount.set(0);
    this.pendingAccessCount.set(0);
  }

  /**
   * Set the current notification count (from HTTP API initial load)
   */
  setNotificationCount(count: number): void {
    this.notificationCount.set(count);
  }

  /**
   * Set the current pending access request count (from HTTP API initial load)
   */
  setPendingAccessCount(count: number): void {
    this.pendingAccessCount.set(count);
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.newNotification$.complete();
    this.notificationUpdated$.complete();
    this.bulkUpdated$.complete();
    this.accessApproved$.complete();
    this.accessRejected$.complete();
    this.newAccessRequest$.complete();
    this.countsUpdated$.complete();
    this.systemStatus$.complete();
  }
}
