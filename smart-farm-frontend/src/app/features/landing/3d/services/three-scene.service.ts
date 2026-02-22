/**
 * ThreeSceneService
 * 
 * Central service for managing Three.js renderer lifecycle.
 * Handles WebGL context, adaptive quality, and offscreen pausing.
 * 
 * WHY this architecture:
 * - Singleton service ensures only one WebGL context
 * - Intersection observer pauses rendering when not visible (performance)
 * - Adaptive quality degrades gracefully on low-end devices
 */

import { Injectable, signal, computed, OnDestroy, NgZone } from '@angular/core';
import * as THREE from 'three';
import { 
  detectQualityLevel, 
  QUALITY_LEVELS, 
  CAMERA_DEFAULTS,
  type QualityLevel 
} from '../utils/three-helpers';

export interface SceneConfig {
  container: HTMLElement;
  onAnimate?: (delta: number, elapsed: number) => void;
}

@Injectable()
export class ThreeSceneService implements OnDestroy {
  // Reactive state via signals
  private _isRendering = signal(false);
  private _qualityLevel = signal<QualityLevel>('medium');
  private _fps = signal(0);
  
  public isRendering = this._isRendering.asReadonly();
  public qualityLevel = this._qualityLevel.asReadonly();
  public fps = this._fps.asReadonly();

  // Three.js core objects
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private clock: THREE.Clock | null = null;
  
  // Animation state
  private animationId: number | null = null;
  private onAnimateCallback: ((delta: number, elapsed: number) => void) | null = null;
  
  // Visibility tracking
  private intersectionObserver: IntersectionObserver | null = null;
  private isVisible = true;
  private reducedMotion = false;
  
  // Performance tracking
  private frameCount = 0;
  private lastFpsUpdate = 0;

  constructor(private ngZone: NgZone) {
    // Detect quality on init
    this._qualityLevel.set(detectQualityLevel());
    
    // Respect reduced motion preference
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    // Listen for preference changes
    window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
      this.reducedMotion = e.matches;
      if (e.matches) {
        this.pause();
      }
    });
  }

  /**
   * Initializes the Three.js scene with the given container
   */
  init(config: SceneConfig): { scene: THREE.Scene; camera: THREE.PerspectiveCamera } {
    const { container, onAnimate } = config;
    const quality = QUALITY_LEVELS[this._qualityLevel()];

    // Create renderer with quality settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: quality.antialias,
      alpha: true,
      powerPreference: 'high-performance'
    });
    
    this.renderer.setPixelRatio(quality.pixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    container.appendChild(this.renderer.domElement);

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    const aspect = container.clientWidth / container.clientHeight;
    this.camera = new THREE.PerspectiveCamera(
      CAMERA_DEFAULTS.fov,
      aspect,
      CAMERA_DEFAULTS.near,
      CAMERA_DEFAULTS.far
    );
    this.camera.position.set(
      CAMERA_DEFAULTS.position.x,
      CAMERA_DEFAULTS.position.y,
      CAMERA_DEFAULTS.position.z
    );

    // Store callback
    this.onAnimateCallback = onAnimate || null;
    
    // Initialize clock
    this.clock = new THREE.Clock();

    // Setup visibility observer - pause when offscreen
    this.setupVisibilityObserver(container);

    // Setup resize handler
    this.setupResizeHandler(container);

    return { scene: this.scene, camera: this.camera };
  }

  /**
   * Starts the render loop
   */
  start(): void {
    if (this.reducedMotion) {
      // Render single frame for reduced motion users
      this.renderSingleFrame();
      return;
    }
    
    this._isRendering.set(true);
    
    // Run outside Angular zone for performance
    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  /**
   * Pauses the render loop
   */
  pause(): void {
    this._isRendering.set(false);
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resumes rendering if visible
   */
  resume(): void {
    if (this.isVisible && !this.reducedMotion) {
      this.start();
    }
  }

  /**
   * Gets the Three.js scene
   */
  getScene(): THREE.Scene | null {
    return this.scene;
  }

  /**
   * Gets the camera
   */
  getCamera(): THREE.PerspectiveCamera | null {
    return this.camera;
  }

  /**
   * Updates camera position based on scroll progress
   * Creates a cinematic pull-back effect as user scrolls
   */
  updateCameraForScroll(progress: number): void {
    if (!this.camera) return;
    
    // Cinematic camera movement: pull back and pan up as user scrolls
    // Creates depth and reveals more of the particle field
    const eased = this.easeOutCubic(progress);
    
    // Camera pulls back and rises slightly
    this.camera.position.y = CAMERA_DEFAULTS.position.y + eased * 4;
    this.camera.position.z = CAMERA_DEFAULTS.position.z + eased * 8;
    
    // Slight downward tilt to keep focus on particles
    const lookAtY = -eased * 2;
    this.camera.lookAt(0, lookAtY, 0);
  }
  
  /**
   * Easing function for smooth camera movements
   */
  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Updates camera for cursor position (subtle parallax)
   * Creates an immersive responsive feel
   */
  updateCameraForCursor(normalizedX: number, normalizedY: number): void {
    if (!this.camera) return;
    
    // Smooth, responsive cursor parallax
    const influence = 0.8;
    const rotationInfluence = 0.015;
    
    // Position offset based on cursor
    this.camera.position.x = normalizedX * influence;
    
    // Subtle rotation for depth
    this.camera.rotation.y = normalizedX * rotationInfluence;
    this.camera.rotation.x = -normalizedY * rotationInfluence * 0.3;
  }

  /**
   * Cleanup resources
   */
  ngOnDestroy(): void {
    this.dispose();
  }

  dispose(): void {
    this.pause();
    
    if (this.intersectionObserver) {
      this.intersectionObserver.disconnect();
    }
    
    if (this.renderer) {
      this.renderer.dispose();
      this.renderer.domElement.remove();
    }
    
    if (this.scene) {
      this.scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }
    
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private animate = (): void => {
    if (!this._isRendering() || !this.isVisible) return;

    this.animationId = requestAnimationFrame(this.animate);

    const delta = this.clock?.getDelta() || 0;
    const elapsed = this.clock?.getElapsedTime() || 0;

    // Call user animation callback
    if (this.onAnimateCallback) {
      this.onAnimateCallback(delta, elapsed);
    }

    // Render
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }

    // Track FPS
    this.trackFps();
  };

  private renderSingleFrame(): void {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  private setupVisibilityObserver(container: HTMLElement): void {
    this.intersectionObserver = new IntersectionObserver(
      (entries) => {
        const isVisible = entries[0]?.isIntersecting ?? false;
        this.isVisible = isVisible;
        
        if (isVisible) {
          this.resume();
        } else {
          this.pause();
        }
      },
      { threshold: 0.1 }
    );
    
    this.intersectionObserver.observe(container);
  }

  private setupResizeHandler(container: HTMLElement): void {
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      
      if (width === 0 || height === 0) return;

      if (this.camera) {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
      }
      
      if (this.renderer) {
        this.renderer.setSize(width, height, false);
      }
    });
    
    resizeObserver.observe(container);
  }

  private trackFps(): void {
    this.frameCount++;
    const now = performance.now();
    
    if (now - this.lastFpsUpdate >= 1000) {
      this._fps.set(this.frameCount);
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }
}
