// src/modules/mqtt/mqtt-connection.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as mqtt from 'mqtt';

@Injectable()
export class MqttConnectionService implements OnModuleInit {
  private readonly logger = new Logger(MqttConnectionService.name);
  private client: mqtt.MqttClient;
  private connectionAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectInterval = 5000; // 5 seconds
  // After maxReconnectAttempts quick retries, keep retrying at this slower
  // pace instead of giving up, so sensors recover on their own once the
  // broker is back.
  private slowReconnectInterval = 60000;
  private slowRetryMode = false;
  private brokerUrl = '';
  private monitorTimer?: NodeJS.Timeout;
  // Topics are (re)subscribed on every connect, so subscriptions survive
  // reconnects and client re-creation.
  private readonly topics = new Set<string>([
    'smartfarm/devices/+/ack',
    'smartfarm/devices/+/status',
  ]);
  private isConnected = false;
  private wasConnectedBefore = false;
  private messageHandlers: Map<string, (topic: string, payload: Buffer) => void> = new Map();

  constructor(
    private configService: ConfigService,
    private eventEmitter: EventEmitter2,
  ) {}

  onModuleInit() {
    // Broker and credentials come only from the environment (no committed
    // defaults). Protocol (wss/mqtts/mqtt) is taken from the URL.
    this.brokerUrl = process.env.MQTT_BROKER || process.env.MQTT_BROKER_URL || '';
    if (!this.brokerUrl) {
      this.logger.warn('⚠️ MQTT_BROKER is not set — MQTT is disabled (no sensor data or device actions).');
      return;
    }

    this.logger.log(`🔄 Attempting to connect to MQTT broker: ${this.brokerUrl}`);
    this.logger.log(`👤 Username: ${process.env.MQTT_USERNAME || 'anonymous'}`);
    this.logger.log(`📋 Connection options: keepalive=60s, reconnectPeriod=${this.reconnectInterval}ms, then every ${this.slowReconnectInterval / 1000}s after ${this.maxReconnectAttempts} failed attempts`);

    this.createClient(this.reconnectInterval);
    this.startConnectionMonitoring();
  }

  private createClient(reconnectPeriod: number) {
    const connectOptions: mqtt.IClientOptions = {
      clientId: `mqttjs_${Math.random().toString(16).substr(2, 8)}`,
      username: process.env.MQTT_USERNAME || undefined,
      password: process.env.MQTT_PASSWORD || undefined,
      keepalive: 60,
      reconnectPeriod,
      connectTimeout: 30000, // 30 seconds - increased timeout
      clean: true,
      rejectUnauthorized: false, // For self-signed certificates
    };

    this.client = mqtt.connect(this.brokerUrl, connectOptions);
    this.setupEventHandlers();
  }

  /**
   * Replace the client with one that retries every slowReconnectInterval,
   * forever. mqtt.js fixes the retry interval for the whole outage, so the
   * only way to slow it down is a fresh client.
   */
  private enterSlowRetryMode() {
    this.slowRetryMode = true;
    const old = this.client;
    old.removeAllListeners();
    old.on('error', () => undefined); // late errors from the discarded client
    old.end(true);
    this.createClient(this.slowReconnectInterval);
  }

  private setupEventHandlers() {
    // Connection successful
    this.client.on('connect', () => {
      const wasReconnection = this.wasConnectedBefore || this.slowRetryMode;
      this.connectionAttempts = 0;
      this.isConnected = true;
      this.wasConnectedBefore = true;
      // Back to quick retries for the next outage (read when it starts).
      this.slowRetryMode = false;
      this.client.options.reconnectPeriod = this.reconnectInterval;
      this.logger.log(`✅ Successfully connected to MQTT broker`);
      this.logger.log(`📡 Client ID: ${this.client.options.clientId || 'auto-generated'}`);
      this.logger.log(`🔗 Connection state: ${this.client.connected ? 'CONNECTED' : 'DISCONNECTED'}`);

      // Emit reconnection event for admin alerting (only on reconnection, not first connect)
      if (wasReconnection) {
        this.eventEmitter.emit('mqtt.reconnected', {
          broker: this.brokerUrl,
        });
      }

      // (Re)subscribe to every registered topic: device ack/status plus
      // whatever other services registered (e.g. smartfarm/sensors/+).
      for (const topic of this.topics) {
        this.client.subscribe(topic, (err) => {
          if (err) {
            this.logger.error(`❌ Failed to subscribe to ${topic}`, err);
          } else {
            this.logger.log(`📡 Successfully subscribed to ${topic}`);
          }
        });
      }
    });

    // Connection attempt failed
    this.client.on('error', (error) => {
      this.isConnected = false;
      this.logger.error(`❌ MQTT Connection error:`, error.message);
      
      // Check if error has a code property (for network errors, etc.)
      if ('code' in error && error.code) {
        this.logger.error(`📋 Error code: ${error.code}`);
      }
      
      // Check for common MQTT error types
      if (error.message) {
        if (error.message.includes('ECONNREFUSED')) {
          this.logger.error(`🚨 Connection refused - broker may be down or unreachable`);
        } else if (error.message.includes('ENOTFOUND')) {
          this.logger.error(`🚨 Host not found - check broker URL`);
        } else if (error.message.includes('ETIMEDOUT')) {
          this.logger.error(`🚨 Connection timeout - broker not responding`);
        } else if (error.message.includes('403') || error.message.includes('unauthorized')) {
          this.logger.error(`🚨 Authentication failed - check username/password`);
        } else if (error.message.includes('WebSocket')) {
          this.logger.error(`🚨 WebSocket connection failed - check protocol and path`);
        }
      }
    });

    // Connection closed
    this.client.on('close', () => {
      const wasConnected = this.isConnected;
      this.isConnected = false;
      this.logger.warn(`🔌 MQTT connection closed. Will attempt to reconnect...`);

      // Only emit disconnect if we were previously connected (not on initial failure)
      if (wasConnected) {
        this.eventEmitter.emit('mqtt.disconnected', {
          broker: this.brokerUrl,
          error: 'Connection closed unexpectedly',
        });
      }
    });

    // Reconnection attempt
    this.client.on('reconnect', () => {
      this.connectionAttempts++;

      if (this.slowRetryMode) {
        this.logger.log(`🔄 Reconnecting to MQTT broker (attempt ${this.connectionAttempts}, retrying every ${this.slowReconnectInterval / 1000}s)`);
        return;
      }

      this.logger.log(`🔄 Reconnecting to MQTT broker (attempt ${this.connectionAttempts}/${this.maxReconnectAttempts})`);

      // Quick retries exhausted: alert once, then keep retrying slowly
      // (never give up — the broker may come back hours later).
      if (this.connectionAttempts >= this.maxReconnectAttempts) {
        this.logger.error(`🚨 ${this.maxReconnectAttempts} reconnection attempts failed. Retrying every ${this.slowReconnectInterval / 1000}s until the broker is reachable.`);
        this.suggestTroubleshooting();

        // Emit critical disconnect — broker is unreachable
        this.eventEmitter.emit('mqtt.disconnected', {
          broker: this.brokerUrl,
          error: `${this.maxReconnectAttempts} reconnection attempts failed. Broker unreachable; retrying every ${this.slowReconnectInterval / 1000}s.`,
        });

        // Defer: mqtt.js calls connect() right after emitting 'reconnect'.
        setImmediate(() => this.enterSlowRetryMode());
      }
    });

    // Connection offline
    this.client.on('offline', () => {
      this.isConnected = false;
      this.logger.warn(`📴 MQTT client went offline`);
    });

    // Message received - delegate to registered handlers
    this.client.on('message', (topic: string, payload: Buffer) => {
      this.logger.log(`📩 Message received on ${topic}: ${payload.toString()}`);
      this.logger.debug(`🔗 Connection status during message: ${this.isConnected ? 'CONNECTED' : 'DISCONNECTED'}`);

      // Call all registered message handlers
      this.messageHandlers.forEach((handler, handlerId) => {
        try {
          handler(topic, payload);
        } catch (error) {
          this.logger.error(`❌ Error in message handler ${handlerId}:`, error);
        }
      });
    });
  }

  /**
   * Register a message handler
   */
  public registerMessageHandler(handlerId: string, handler: (topic: string, payload: Buffer) => void) {
    this.messageHandlers.set(handlerId, handler);
    this.logger.log(`📝 Registered message handler: ${handlerId}`);
  }

  /**
   * Unregister a message handler
   */
  public unregisterMessageHandler(handlerId: string) {
    this.messageHandlers.delete(handlerId);
    this.logger.log(`🗑️ Unregistered message handler: ${handlerId}`);
  }

  /**
   * Subscribe to MQTT topic
   */
  /**
   * Subscribe to a topic. The topic is remembered and re-subscribed on every
   * (re)connect; if the client is offline now, it resolves immediately and
   * the subscription happens on the next connect.
   */
  public subscribe(topic: string): Promise<void> {
    this.topics.add(topic);
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        this.logger.log(`📝 ${topic} registered; will subscribe when MQTT connects`);
        resolve();
        return;
      }

      this.client.subscribe(topic, (err) => {
        if (err) {
          this.logger.error(`❌ Failed to subscribe to ${topic}`, err);
          reject(err);
        } else {
          this.logger.log(`📡 Successfully subscribed to ${topic}`);
          resolve();
        }
      });
    });
  }

  /**
   * Publish message to MQTT topic with QoS and Retain options
   */
  public publish(topic: string, message: string, options?: {
    qos?: 0 | 1 | 2;
    retain?: boolean;
    timeout?: number;
  }): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.client || !this.client.connected) {
        reject(new Error('MQTT client not connected'));
        return;
      }

      const publishOptions = {
        qos: options?.qos ?? 1, // Default to QoS 1 for reliability
        retain: options?.retain ?? false, // Default to not retain
        ...options
      };

      const timeout = options?.timeout ?? 10000; // 10 second timeout
      let timeoutId: NodeJS.Timeout;

      // Set up timeout
      timeoutId = setTimeout(() => {
        reject(new Error(`Publish timeout after ${timeout}ms`));
      }, timeout);

      this.client.publish(topic, message, publishOptions, (err) => {
        clearTimeout(timeoutId);
        
        if (err) {
          this.logger.error(`❌ Failed to publish to ${topic}`, err);
          reject(err);
        } else {
          this.logger.log(`📤 Published to ${topic} (QoS: ${publishOptions.qos}, Retain: ${publishOptions.retain}): ${message}`);
          resolve();
        }
      });
    });
  }

  /**
   * Publish action command with production-ready settings
   */
  public publishAction(topic: string, message: string, actionType: 'critical' | 'important' | 'normal' = 'normal'): Promise<void> {
    const options = this.getActionPublishOptions(actionType);
    return this.publish(topic, message, options);
  }

  /**
   * Get publish options based on action criticality
   */
  private getActionPublishOptions(actionType: 'critical' | 'important' | 'normal'): {
    qos: 0 | 1 | 2;
    retain: boolean;
    timeout: number;
  } {
    switch (actionType) {
      case 'critical':
        return {
          qos: 2, // Exactly once delivery
          // Never retain commands: the broker would replay the last one (e.g.
          // humidifier_on from hours ago) every time the device reconnects.
          retain: false,
          timeout: 15000 // 15 second timeout
        };
      case 'important':
        return {
          qos: 1, // At least once delivery
          retain: false, // Don't retain
          timeout: 10000 // 10 second timeout
        };
      case 'normal':
      default:
        return {
          qos: 1, // At least once delivery
          retain: false, // Don't retain
          timeout: 8000 // 8 second timeout
        };
    }
  }

  /**
   * Start periodic connection monitoring
   */
  private startConnectionMonitoring() {
    this.monitorTimer = setInterval(() => {
      const status = this.getConnectionStatus();
      this.logger.debug(`🔍 Connection health check: ${JSON.stringify(status)}`);
      
      // Alert if disconnected for too long
      if (!this.isConnected) {
        this.logger.warn(`⚠️ MQTT broker disconnected. Attempts: ${this.connectionAttempts}`);
      }
    }, 30000); // Check every 30 seconds
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus() {
    return {
      connected: this.client?.connected || false,
      isConnected: this.isConnected,
      connectionAttempts: this.connectionAttempts,
      reconnecting: this.client?.reconnecting || false,
      retryMode: this.slowRetryMode ? 'slow' : 'fast',
      clientId: this.client?.options?.clientId || null,
      brokerUrl: this.brokerUrl || null,
    };
  }

  /**
   * Manual connection test method with detailed diagnostics
   */
  public async testConnection(): Promise<boolean> {
    const brokerUrl = this.brokerUrl;
    const username = this.configService.get('MQTT_USERNAME');
    
    this.logger.log(`🧪 Testing MQTT connection to: ${brokerUrl}`);
    this.logger.log(`👤 Username: ${username || 'anonymous'}`);
    
    const status = this.getConnectionStatus();
    this.logger.log(`📊 Current status:`, status);
    
    // WebSocket connection test info
    this.logger.log(`🔍 Testing WebSocket connection over TLS`);
    this.logger.log(`💡 Protocol: WSS (WebSocket Secure)`);
    this.logger.log(`💡 Port: 8084 (WebSocket over TLS/SSL)`);
    
    if (this.client?.connected) {
      this.logger.log(`✅ Connection test PASSED - broker is reachable`);
      return true;
    } else {
      this.logger.error(`❌ Connection test FAILED - broker unreachable`);
      this.suggestTroubleshooting();
      return false;
    }
  }

  /**
   * Provide troubleshooting suggestions
   */
  private suggestTroubleshooting() {
    const brokerUrl = this.brokerUrl;
    let brokerHost = brokerUrl;
    let brokerPort = '';
    try {
      const parsed = new URL(brokerUrl);
      brokerHost = parsed.hostname;
      brokerPort = parsed.port;
    } catch {
      // keep raw value
    }
    const username = this.configService.get('MQTT_USERNAME');
    
    this.logger.error(`\n🔧 TROUBLESHOOTING MQTT CONNECTION:`);
    this.logger.error(`📍 Broker URL: ${brokerUrl}`);
    this.logger.error(`👤 Username: ${username || 'anonymous'}`);
    this.logger.error(`🔌 Protocol: WebSocket over TLS (WSS)`);
    this.logger.error(`\n🔍 Check these items:`);
    this.logger.error(`   1. ✅ URL format: wss://hostname:8084/mqtt (FIXED)`);
    this.logger.error(`   2. 🔑 Are your EMQX Cloud credentials correct?`);
    this.logger.error(`   3. 🌐 Is your EMQX Cloud instance running?`);
    this.logger.error(`   4. 🔒 Check EMQX Cloud Authentication & ACL settings`);
    this.logger.error(`   5. 🚧 Check firewall/network connectivity`);
    this.logger.error(`   6. 📱 Try connecting with MQTT Explorer using WebSocket`);
    this.logger.error(`\n🧪 Test with MQTT Explorer:`);
    this.logger.error(`   - Protocol: ws://wss://`);
    this.logger.error(`   - Host: ${brokerHost}`);
    this.logger.error(`   - Port: ${brokerPort || '(default)'}`);
    this.logger.error(`   - Path: /mqtt`);
    
    if (username) {
      this.logger.error(`   - Username: ${username}`);
      this.logger.error(`   - Password: [your_password]`);
    }
    
    this.logger.error(`\n💡 You can test connection manually by calling mqttConnectionService.testConnection()`);
  }

  onModuleDestroy() {
    this.logger.log(`🔌 Disconnecting from MQTT broker...`);
    if (this.monitorTimer) {
      clearInterval(this.monitorTimer);
    }
    if (this.client) {
      this.client.end(true);
      this.logger.log(`✅ MQTT client disconnected`);
    }
  }
}