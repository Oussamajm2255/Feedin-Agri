import { Injectable } from '@angular/core';

export type VideoQuality = 'low' | 'medium' | 'high' | 'none';

export interface VideoQualityConfig {
  quality: VideoQuality;
  format: 'webm' | 'mp4';
  src: string;
  poster: string;
  enabled: boolean;
}

/**
 * Video Quality Service
 * Detects network conditions and device capabilities to determine optimal video quality
 */
@Injectable({
  providedIn: 'root',
})
export class VideoQualityService {
  /**
   * Detect optimal video quality based on connection and device
   */
  detectOptimalQuality(): VideoQualityConfig {
    const connection = (navigator as any)?.connection;
    const saveData = connection?.saveData || false;
    const effectiveType = connection?.effectiveType || '4g';
    const deviceMemory = (navigator as any)?.deviceMemory || 4;

    // Decision tree for video quality
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
      return {
        quality: 'none',
        format: 'mp4',
        src: '',
        poster: 'assets/vids/login-poster.webp',
        enabled: false,
      };
    }

    if (effectiveType === '3g' || deviceMemory < 2) {
      return {
        quality: 'low',
        format: 'mp4',
        src: 'assets/vids/login-low.mp4',
        poster: 'assets/vids/login-poster.webp',
        enabled: true,
      };
    }

    if (effectiveType === '4g' && deviceMemory >= 4) {
      // Prefer WebM for better compression on capable devices
      return {
        quality: 'high',
        format: 'webm',
        src: 'assets/vids/login.webm',
        poster: 'assets/vids/login-poster.webp',
        enabled: true,
      };
    }

    // Default: medium quality MP4 for compatibility
    return {
      quality: 'medium',
      format: 'mp4',
      src: 'assets/vids/login-optimized.mp4',
      poster: 'assets/vids/login-poster.webp',
      enabled: true,
    };
  }

  /**
   * Check if video should be enabled for current conditions
   */
  shouldEnableVideo(): boolean {
    const config = this.detectOptimalQuality();
    return config.enabled;
  }

  /**
   * Get video sources with fallbacks
   */
  getVideoSources(): { src: string; type: string }[] {
    const quality = this.detectOptimalQuality();
    
    if (!quality.enabled) {
      return [];
    }

    const sources: { src: string; type: string }[] = [];

    // Primary source based on quality detection
    sources.push({
      src: quality.src,
      type: `video/${quality.format}`,
    });

    // Fallback: always include MP4 for compatibility
    if (quality.format === 'webm') {
      sources.push({
        src: 'assets/vids/login-optimized.mp4',
        type: 'video/mp4',
      });
    }

    return sources;
  }

  /**
   * Monitor connection changes and callback when quality should change
   */
  onConnectionChange(callback: (config: VideoQualityConfig) => void): () => void {
    const connection = (navigator as any)?.connection;
    
    if (!connection) {
      return () => {};
    }

    const handler = () => {
      callback(this.detectOptimalQuality());
    };

    connection.addEventListener('change', handler);

    return () => {
      connection.removeEventListener('change', handler);
    };
  }
}
