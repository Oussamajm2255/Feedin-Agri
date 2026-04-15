/**
 * Login Component Configuration
 * Centralized constants and configuration for production optimization
 */

export const LOGIN_CONFIG = {
  // Keyboard Detection
  keyboard: {
    /** Height difference threshold in pixels to detect keyboard open */
    heightThreshold: 150,
    /** Delay before checking viewport after focus change (ms) */
    checkDelay: 100,
  },

  // Autofill Detection
  autofill: {
    /** Interval between autofill checks (ms) - reduced from 100ms to 300ms */
    checkInterval: 300,
    /** Maximum number of checks before stopping */
    maxChecks: 15,
    /** Initial check delays (ms) */
    initialChecks: [100, 500],
  },

  // Rate Limiting
  rateLimit: {
    /** Storage key for attempts */
    storageKey: 'loginAttempts',
    /** Max attempts before rate limiting */
    maxAttempts: 5,
    /** Window size in ms (default 15 minutes) */
    windowMs: 15 * 60 * 1000,
    /** Countdown display format */
    countdownEnabled: true,
  },

  // Video Loading
  video: {
    /** Path prefix for video assets */
    assetPath: '/assets/vids',
    /** Poster image name */
    posterName: 'login-poster.webp',
    /** Formats in priority order */
    formats: [
      { type: 'webm', src: 'login.webm' },
      { type: 'mp4', src: 'login-optimized.mp4' },
    ],
    /** Timeout for video load before fallback (ms) */
    loadTimeout: 5000,
    /** Retry attempts for video loading */
    retryAttempts: 2,
    /** Delay between retries (ms) */
    retryDelay: 1000,
    /** Intersection Observer threshold for lazy loading */
    intersectionThreshold: 0.1,
  },

  // Animations
  animations: {
    /** Error shake animation duration (ms) */
    shakeDuration: 500,
    /** Success navigation delay (ms) */
    navigationDelay: 1500,
    /** Form surface entrance delay (ms) */
    entranceDelay: 150,
  },

  // Touch Targets (accessibility)
  touchTargets: {
    /** Minimum touch target size (px) - WCAG 2.1 recommendation */
    minSize: 44,
    /** Preferred touch target size (px) - Apple HIG */
    preferredSize: 48,
  },

  // Safe Areas (iOS)
  safeAreas: {
    /** Bottom safe area for Home Indicator */
    bottom: 'env(safe-area-inset-bottom, 0px)',
    /** Top safe area for notch */
    top: 'env(safe-area-inset-top, 0px)',
    /** Left safe area */
    left: 'env(safe-area-inset-left, 0px)',
    /** Right safe area */
    right: 'env(safe-area-inset-right, 0px)',
  },

  // Error Tracking
  errorTracking: {
    /** Enable Sentry/error reporting integration */
    enabled: true,
    /** Sanitize sensitive fields */
    sanitizeFields: ['password', 'email', 'token'],
    /** Log level for production */
    logLevel: 'error' as const, // 'debug' | 'info' | 'warn' | 'error'
  },
} as const;

/** Type helper for config access */
export type LoginConfig = typeof LOGIN_CONFIG;
