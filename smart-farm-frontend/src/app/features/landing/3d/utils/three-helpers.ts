/**
 * Three.js Helper Utilities
 * Provides reusable functions for 3D scene management
 */

import * as THREE from 'three';

// ============================================
// CONSTANTS
// ============================================

export const CAMERA_DEFAULTS = {
  fov: 60,
  near: 0.1,
  far: 1000,
  position: { x: 0, y: 5, z: 15 }
} as const;

export const QUALITY_LEVELS = {
  low: { pixelRatio: 0.75, shadowMapSize: 512, antialias: false },
  medium: { pixelRatio: 1, shadowMapSize: 1024, antialias: true },
  high: { pixelRatio: Math.min(window.devicePixelRatio, 2), shadowMapSize: 2048, antialias: true }
} as const;

export type QualityLevel = keyof typeof QUALITY_LEVELS;

// ============================================
// DEVICE DETECTION
// ============================================

/**
 * Detects optimal quality level based on device capabilities
 * Uses GPU memory and core count as heuristics
 */
export function detectQualityLevel(): QualityLevel {
  // Check for reduced motion preference
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return 'low';
  }

  // Check for mobile/low-power devices
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const hasLowCores = navigator.hardwareConcurrency ? navigator.hardwareConcurrency <= 4 : false;
  
  if (isMobile || hasLowCores) {
    return 'low';
  }

  // Check WebGL capabilities
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return 'low';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (debugInfo) {
      const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      // Low-end integrated GPUs
      if (/Intel|Mali|Adreno 3|Adreno 4/i.test(renderer)) {
        return 'medium';
      }
    }
  } catch {
    return 'medium';
  }

  return 'high';
}

// ============================================
// GEOMETRY HELPERS
// ============================================

/**
 * Creates an optimized grid of points for the agricultural field visualization
 */
export function createFieldGrid(
  width: number,
  depth: number,
  resolution: number
): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const sizes: number[] = [];

  const halfWidth = width / 2;
  const halfDepth = depth / 2;
  const stepX = width / resolution;
  const stepZ = depth / resolution;

  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = -halfWidth + i * stepX;
      const z = -halfDepth + j * stepZ;
      // Slight height variation for organic feel
      const y = Math.sin(i * 0.3) * Math.cos(j * 0.3) * 0.3;

      positions.push(x, y, z);
      
      // Gradient colors: green (agriculture) → blue (technology)
      const t = i / resolution;
      colors.push(
        0.06 + t * 0.17,  // R: 0.06 → 0.23
        0.73 - t * 0.23,  // G: 0.73 → 0.50
        0.38 + t * 0.58   // B: 0.38 → 0.96
      );
      
      sizes.push(0.1 + Math.random() * 0.05);
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));

  return geometry;
}

/**
 * Creates a data flow particle system for the "technology" layer
 */
export function createDataParticles(count: number): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const i3 = i * 3;
    
    // Random positions in a cylindrical volume
    const radius = Math.random() * 8;
    const theta = Math.random() * Math.PI * 2;
    
    positions[i3] = Math.cos(theta) * radius;
    positions[i3 + 1] = Math.random() * 10 - 5;
    positions[i3 + 2] = Math.sin(theta) * radius;
    
    // Upward velocity bias
    velocities[i3] = (Math.random() - 0.5) * 0.02;
    velocities[i3 + 1] = Math.random() * 0.05 + 0.01;
    velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;
    
    // Cyan/green technology colors
    colors[i3] = 0.1 + Math.random() * 0.2;
    colors[i3 + 1] = 0.8 + Math.random() * 0.2;
    colors[i3 + 2] = 0.7 + Math.random() * 0.3;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  return geometry;
}

// ============================================
// MATERIAL HELPERS
// ============================================

/**
 * Creates a shader material for animated points with glow effect
 */
export function createGlowPointsMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      time: { value: 0 },
      opacity: { value: 1 }
    },
    vertexShader: `
      attribute float size;
      attribute vec3 color;
      varying vec3 vColor;
      uniform float time;
      
      void main() {
        vColor = color;
        vec3 pos = position;
        pos.y += sin(time + position.x * 0.5) * 0.1;
        
        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        gl_PointSize = size * (300.0 / -mvPosition.z);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      uniform float opacity;
      
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5));
        if (dist > 0.5) discard;
        
        float glow = 1.0 - smoothstep(0.0, 0.5, dist);
        gl_FragColor = vec4(vColor, glow * opacity);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
}

// ============================================
// ANIMATION HELPERS
// ============================================

/**
 * Easing function for smooth camera movements
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

/**
 * Lerp function for smooth interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Clamps value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
