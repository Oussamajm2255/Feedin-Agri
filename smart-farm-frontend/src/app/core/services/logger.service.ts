import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Log levels for controlling output verbosity
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4
}

/**
 * LoggerService - Production-safe logging with environment-aware levels
 * 
 * Features:
 * - Automatically disables debug/info logs in production
 * - Structured logging with categories
 * - Performance tracking
 * - Error context preservation
 */
@Injectable({ providedIn: 'root' })
export class LoggerService {
  private level: LogLevel;
  private context: string;

  constructor() {
    this.level = environment.production 
      ? LogLevel.WARN  // Only warn and error in production
      : LogLevel.DEBUG; // All logs in development
    this.context = 'App';
  }

  /**
   * Create a scoped logger instance
   */
  createScoped(context: string): LoggerService {
    const scopedLogger = new LoggerService();
    scopedLogger.context = context;
    return scopedLogger;
  }

  /**
   * Debug level logging (development only)
   */
  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`[DEBUG][${this.context}] ${message}`, ...args);
    }
  }

  /**
   * Info level logging
   */
  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`[INFO][${this.context}] ${message}`, ...args);
    }
  }

  /**
   * Warning level logging
   */
  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`[WARN][${this.context}] ${message}`, ...args);
    }
  }

  /**
   * Error level logging (always enabled)
   */
  error(message: string, error?: any, ...args: any[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`[ERROR][${this.context}] ${message}`, error, ...args);
    }
  }

  /**
   * Track performance metrics
   */
  time(label: string): void {
    if (this.level <= LogLevel.DEBUG && typeof performance !== 'undefined') {
      performance.mark(`${label}-start`);
    }
  }

  /**
   * End performance tracking and log duration
   */
  timeEnd(label: string): void {
    if (this.level <= LogLevel.DEBUG && typeof performance !== 'undefined') {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      
      const measure = performance.getEntriesByName(label)[0];
      if (measure) {
        console.info(`[PERF][${this.context}] ${label}: ${measure.duration.toFixed(2)}ms`);
      }
    }
  }

  /**
   * Log group for structured output
   */
  group(label: string): void {
    if (this.level <= LogLevel.DEBUG && console.group) {
      console.group(`[${this.context}] ${label}`);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (console.groupEnd) {
      console.groupEnd();
    }
  }

  /**
   * Log with prefix (used by notification service)
   */
  logWithPrefix(prefix: string, message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`[${this.context}] ${prefix}`, message, ...args);
    } else if (this.level <= LogLevel.INFO) {
      console.log(`[${this.context}] ${prefix}`, message, ...args);
    } else if (this.level <= LogLevel.WARN) {
      console.warn(`[${this.context}] ${prefix}`, message, ...args);
    } else {
      console.error(`[${this.context}] ${prefix}`, message, ...args);
    }
  }
}
