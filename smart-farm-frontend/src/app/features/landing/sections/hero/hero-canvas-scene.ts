/**
 * ImmersiveHeroScene
 * 
 * 🌾 MAGICAL PARTICLE EXPERIENCE
 * Creates floating golden particles, organic spores, and light rays
 * that respond to scroll and cursor movement
 * 
 * Visual Elements:
 * - Golden floating particles (pollen/seeds)
 * - Organic motion with wind simulation
 * - Light rays piercing through
 * - Scroll-driven intensity changes
 */

import * as THREE from 'three';

// Easing functions
function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export class ImmersiveHeroScene {
  private scene: THREE.Scene;
  
  // Particle systems
  private goldenParticles: THREE.Points | null = null;
  private floatingSpores: THREE.Points | null = null;
  private lightRays: THREE.Group | null = null;
  
  // Materials for cleanup
  private goldenMaterial: THREE.ShaderMaterial | null = null;
  private sporeMaterial: THREE.PointsMaterial | null = null;
  
  // Animation state
  private time = 0;
  private scrollProgress = 0;
  private cursorX = 0;
  private cursorY = 0;
  private windDirection = { x: 0.3, y: 0.1, z: 0.2 };
  
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Initialize all visual elements
   */
  init(): void {
    this.createGoldenParticles();
    this.createFloatingSpores();
    this.createLightRays();
    this.addAmbientLighting();
  }

  /**
   * Update animation each frame
   */
  update(delta: number, elapsed: number): void {
    this.time = elapsed;
    
    // Animate wind direction slowly
    this.windDirection.x = Math.sin(elapsed * 0.1) * 0.3;
    this.windDirection.z = Math.cos(elapsed * 0.15) * 0.2;
    
    this.animateGoldenParticles(delta);
    this.animateFloatingSpores(delta);
    this.animateLightRays(elapsed);
  }

  /**
   * Set scroll progress for intensity changes
   */
  setScrollProgress(progress: number): void {
    this.scrollProgress = progress;
    
    // Increase particle visibility as user scrolls
    const goldenOpacity = lerp(0.7, 1.0, easeOutCubic(progress));
    const sporeOpacity = lerp(0.5, 0.9, easeOutCubic(progress));
    
    if (this.goldenMaterial) {
      this.goldenMaterial.uniforms['opacity'].value = goldenOpacity;
    }
    
    if (this.sporeMaterial) {
      this.sporeMaterial.opacity = sporeOpacity;
    }
    
    // Make light rays more prominent on scroll
    if (this.lightRays) {
      this.lightRays.children.forEach((ray, i) => {
        const mesh = ray as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
        if (mesh.material) {
          mesh.material.opacity = lerp(0.03, 0.08, progress) * (0.5 + Math.sin(i) * 0.5);
        }
      });
    }
  }

  /**
   * Set cursor position for particle interaction
   */
  setCursorPosition(x: number, y: number): void {
    // Smooth interpolation
    this.cursorX = lerp(this.cursorX, x, 0.1);
    this.cursorY = lerp(this.cursorY, y, 0.1);
  }

  /**
   * Cleanup all resources
   */
  dispose(): void {
    if (this.goldenParticles) {
      this.goldenParticles.geometry.dispose();
      this.scene.remove(this.goldenParticles);
    }
    
    if (this.floatingSpores) {
      this.floatingSpores.geometry.dispose();
      this.scene.remove(this.floatingSpores);
    }
    
    if (this.lightRays) {
      this.lightRays.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          if (child.material instanceof THREE.Material) {
            child.material.dispose();
          }
        }
      });
      this.scene.remove(this.lightRays);
    }
    
    if (this.goldenMaterial) {
      this.goldenMaterial.dispose();
    }
    
    if (this.sporeMaterial) {
      this.sporeMaterial.dispose();
    }
  }

  // ============================================
  // PRIVATE METHODS - PARTICLE CREATION
  // ============================================

  /**
   * Golden floating particles - like pollen or seeds in wind
   */
  private createGoldenParticles(): void {
    const count = 800;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const phases = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spread across the view
      positions[i3] = (Math.random() - 0.5) * 40;
      positions[i3 + 1] = (Math.random() - 0.5) * 30;
      positions[i3 + 2] = (Math.random() - 0.5) * 30;
      
      // Random velocities for organic movement
      velocities[i3] = (Math.random() - 0.5) * 0.015;
      velocities[i3 + 1] = Math.random() * 0.008 + 0.003;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.01;
      
      // Varied sizes for depth
      sizes[i] = Math.random() * 0.8 + 0.2;
      
      // Random phase for animation offset
      phases[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));
    
    // Beautiful shader for golden glow
    this.goldenMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        opacity: { value: 0.7 },
        cursorX: { value: 0 },
        cursorY: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        attribute float phase;
        uniform float time;
        uniform float cursorX;
        uniform float cursorY;
        varying float vAlpha;
        varying vec2 vUv;
        
        void main() {
          vec3 pos = position;
          
          // Organic floating motion
          pos.x += sin(time * 0.5 + phase) * 0.3;
          pos.y += sin(time * 0.8 + phase * 1.3) * 0.2;
          pos.z += cos(time * 0.6 + phase * 0.8) * 0.15;
          
          // Cursor influence - particles gently avoid cursor
          float distX = pos.x / 20.0 - cursorX;
          float distY = pos.y / 15.0 + cursorY;
          float cursorDist = length(vec2(distX, distY));
          if (cursorDist < 0.5) {
            float push = (0.5 - cursorDist) * 2.0;
            pos.x += distX * push * 0.5;
            pos.y += distY * push * 0.5;
          }
          
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          
          // Distance-based size
          float sizeScale = size * (350.0 / -mvPosition.z);
          gl_PointSize = max(1.0, min(sizeScale, 12.0));
          
          // Fade based on z-depth for atmospheric perspective
          vAlpha = smoothstep(-20.0, 5.0, pos.z) * smoothstep(20.0, -5.0, pos.z);
          vAlpha *= smoothstep(-15.0, 0.0, pos.y) * smoothstep(15.0, 5.0, pos.y);
          
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform float opacity;
        varying float vAlpha;
        
        void main() {
          // Soft circular particle
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft glow falloff
          float glow = 1.0 - smoothstep(0.0, 0.5, dist);
          glow = pow(glow, 1.5);
          
          // Golden color palette - warm harvest tones
          vec3 gold = vec3(0.95, 0.85, 0.55);
          vec3 amber = vec3(0.92, 0.75, 0.45);
          vec3 color = mix(amber, gold, glow);
          
          gl_FragColor = vec4(color, glow * vAlpha * opacity);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    
    this.goldenParticles = new THREE.Points(geometry, this.goldenMaterial);
    this.scene.add(this.goldenParticles);
  }

  /**
   * Floating spores - smaller, more numerous, organic motion
   */
  private createFloatingSpores(): void {
    const count = 1200;
    const geometry = new THREE.BufferGeometry();
    
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      
      // Spread in a wide area
      positions[i3] = (Math.random() - 0.5) * 50;
      positions[i3 + 1] = (Math.random() - 0.5) * 35;
      positions[i3 + 2] = (Math.random() - 0.5) * 40;
      
      // Slower, more meandering movement
      velocities[i3] = (Math.random() - 0.5) * 0.008;
      velocities[i3 + 1] = Math.random() * 0.005 + 0.001;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.006;
      
      // Subtle green/white color variations
      const green = 0.5 + Math.random() * 0.3;
      colors[i3] = 0.7 + Math.random() * 0.3;     // R
      colors[i3 + 1] = 0.8 + Math.random() * 0.2; // G
      colors[i3 + 2] = 0.6 + Math.random() * 0.2; // B
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    
    this.sporeMaterial = new THREE.PointsMaterial({
      size: 0.06,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.floatingSpores = new THREE.Points(geometry, this.sporeMaterial);
    this.scene.add(this.floatingSpores);
  }

  /**
   * Light rays - volumetric god rays effect
   */
  private createLightRays(): void {
    this.lightRays = new THREE.Group();
    
    const rayCount = 5;
    
    for (let i = 0; i < rayCount; i++) {
      const geometry = new THREE.PlaneGeometry(3 + Math.random() * 4, 50);
      const material = new THREE.MeshBasicMaterial({
        color: new THREE.Color(0.98, 0.95, 0.85),
        transparent: true,
        opacity: 0.03 + Math.random() * 0.03,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      });
      
      const ray = new THREE.Mesh(geometry, material);
      
      // Position rays coming from top-right (sun direction)
      ray.position.set(
        10 + i * 5 + Math.random() * 3,
        20,
        -5 + Math.random() * 10
      );
      
      // Angle downward
      ray.rotation.x = -Math.PI * 0.15;
      ray.rotation.z = -Math.PI * 0.2 - i * 0.05;
      ray.rotation.y = Math.random() * 0.1;
      
      this.lightRays.add(ray);
    }
    
    this.scene.add(this.lightRays);
  }

  /**
   * Ambient lighting for depth
   */
  private addAmbientLighting(): void {
    // Warm ambient
    const ambient = new THREE.AmbientLight(0xfff0e0, 0.3);
    this.scene.add(ambient);
    
    // Sun-like directional light
    const sunLight = new THREE.DirectionalLight(0xfff5e0, 0.4);
    sunLight.position.set(20, 30, 10);
    this.scene.add(sunLight);
  }

  // ============================================
  // PRIVATE METHODS - ANIMATION
  // ============================================

  private animateGoldenParticles(delta: number): void {
    if (!this.goldenParticles || !this.goldenMaterial) return;
    
    // Update shader uniforms
    this.goldenMaterial.uniforms['time'].value = this.time;
    this.goldenMaterial.uniforms['cursorX'].value = this.cursorX;
    this.goldenMaterial.uniforms['cursorY'].value = this.cursorY;
    
    const positions = this.goldenParticles.geometry.attributes['position'];
    const velocities = this.goldenParticles.geometry.attributes['velocity'];
    
    if (!positions || !velocities) return;
    
    const posArray = positions.array as Float32Array;
    const velArray = velocities.array as Float32Array;
    
    const windInfluence = 1 + this.scrollProgress * 0.5;
    
    for (let i = 0; i < posArray.length; i += 3) {
      // Apply velocity + wind
      posArray[i] += (velArray[i] + this.windDirection.x * 0.01) * delta * 60 * windInfluence;
      posArray[i + 1] += velArray[i + 1] * delta * 60;
      posArray[i + 2] += (velArray[i + 2] + this.windDirection.z * 0.008) * delta * 60;
      
      // Wrap around boundaries
      if (posArray[i] > 25) posArray[i] = -25;
      if (posArray[i] < -25) posArray[i] = 25;
      if (posArray[i + 1] > 20) posArray[i + 1] = -15;
      if (posArray[i + 2] > 20) posArray[i + 2] = -20;
      if (posArray[i + 2] < -20) posArray[i + 2] = 20;
    }
    
    positions.needsUpdate = true;
  }

  private animateFloatingSpores(delta: number): void {
    if (!this.floatingSpores) return;
    
    const positions = this.floatingSpores.geometry.attributes['position'];
    const velocities = this.floatingSpores.geometry.attributes['velocity'];
    
    if (!positions || !velocities) return;
    
    const posArray = positions.array as Float32Array;
    const velArray = velocities.array as Float32Array;
    
    for (let i = 0; i < posArray.length; i += 3) {
      // Add subtle sinusoidal motion
      const phase = i * 0.1 + this.time;
      
      posArray[i] += (velArray[i] + Math.sin(phase * 0.3) * 0.002) * delta * 60;
      posArray[i + 1] += velArray[i + 1] * delta * 60;
      posArray[i + 2] += (velArray[i + 2] + Math.cos(phase * 0.25) * 0.001) * delta * 60;
      
      // Wrap boundaries
      if (posArray[i] > 30) posArray[i] = -30;
      if (posArray[i] < -30) posArray[i] = 30;
      if (posArray[i + 1] > 20) posArray[i + 1] = -17;
      if (posArray[i + 2] > 25) posArray[i + 2] = -25;
      if (posArray[i + 2] < -25) posArray[i + 2] = 25;
    }
    
    positions.needsUpdate = true;
    
    // Slow rotation for organic feel
    this.floatingSpores.rotation.y = Math.sin(this.time * 0.05) * 0.02;
  }

  private animateLightRays(elapsed: number): void {
    if (!this.lightRays) return;
    
    this.lightRays.children.forEach((ray, i) => {
      const mesh = ray as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
      
      // Subtle shimmer
      const shimmer = 0.8 + Math.sin(elapsed * 0.5 + i * 1.2) * 0.2;
      mesh.scale.x = shimmer;
      
      // Gentle sway
      mesh.rotation.z = -Math.PI * 0.2 - i * 0.05 + Math.sin(elapsed * 0.2 + i) * 0.02;
    });
  }
}
