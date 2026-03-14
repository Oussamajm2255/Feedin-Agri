/**
 * HeroScene
 * 
 * Three.js scene for the hero section:
 * - Agricultural field grid transforming into data visualization
 * - Particle system representing data flow
 * - Subtle camera movement synced to scroll/cursor
 * 
 * WHY this visual story:
 * - Field grid = Agriculture (familiar, grounded)
 * - Particles rising = Data/Technology (modern, innovative)
 * - Transition = "We bridge the gap"
 */

import * as THREE from 'three';
import { 
  createFieldGrid, 
  createDataParticles, 
  createGlowPointsMaterial,
  lerp,
  easeOutCubic
} from '../utils/three-helpers';

export class HeroScene {
  private fieldGrid: THREE.Points | null = null;
  private dataParticles: THREE.Points | null = null;
  private gridMaterial: THREE.ShaderMaterial | null = null;
  private particleMaterial: THREE.PointsMaterial | null = null;
  
  // Animation state
  private time = 0;
  private scrollProgress = 0;
  private targetOpacity = { grid: 1, particles: 0.6 };

  constructor(private scene: THREE.Scene) {}

  /**
   * Initialize all scene objects
   */
  init(): void {
    this.createFieldGrid();
    this.createDataFlow();
    this.addAmbientLighting();
  }

  /**
   * Update animation each frame
   */
  update(delta: number, elapsed: number): void {
    this.time = elapsed;
    
    // Animate field grid
    if (this.gridMaterial) {
      this.gridMaterial.uniforms['time'].value = elapsed;
    }
    
    // Animate data particles
    this.animateDataParticles(delta);
  }

  /**
   * Set scroll progress (0-1) for scene transitions
   */
  setScrollProgress(progress: number): void {
    this.scrollProgress = progress;
    
    // As user scrolls, transition from agriculture to data
    // Grid fades slightly, particles become more prominent
    const gridOpacity = lerp(1, 0.4, easeOutCubic(progress));
    const particleOpacity = lerp(0.6, 1, easeOutCubic(progress));
    
    if (this.gridMaterial) {
      this.gridMaterial.uniforms['opacity'].value = gridOpacity;
    }
    
    if (this.particleMaterial) {
      this.particleMaterial.opacity = particleOpacity;
    }
  }

  /**
   * Dispose of all resources
   */
  dispose(): void {
    if (this.fieldGrid) {
      this.fieldGrid.geometry.dispose();
      this.scene.remove(this.fieldGrid);
    }
    
    if (this.dataParticles) {
      this.dataParticles.geometry.dispose();
      this.scene.remove(this.dataParticles);
    }
    
    if (this.gridMaterial) {
      this.gridMaterial.dispose();
    }
    
    if (this.particleMaterial) {
      this.particleMaterial.dispose();
    }
  }

  // ============================================
  // PRIVATE METHODS
  // ============================================

  private createFieldGrid(): void {
    // Create grid geometry representing agricultural field
    const geometry = createFieldGrid(20, 20, 50);
    
    // Use custom shader for animated glow effect
    this.gridMaterial = createGlowPointsMaterial();
    
    this.fieldGrid = new THREE.Points(geometry, this.gridMaterial);
    this.fieldGrid.position.y = -2;
    this.fieldGrid.rotation.x = -Math.PI * 0.3;
    
    this.scene.add(this.fieldGrid);
  }

  private createDataFlow(): void {
    // Create particles that rise like data points
    const geometry = createDataParticles(500);
    
    this.particleMaterial = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    this.dataParticles = new THREE.Points(geometry, this.particleMaterial);
    this.dataParticles.position.y = 0;
    
    this.scene.add(this.dataParticles);
  }

  private animateDataParticles(delta: number): void {
    if (!this.dataParticles) return;
    
    const positions = this.dataParticles.geometry.attributes['position'];
    const velocities = this.dataParticles.geometry.attributes['velocity'];
    
    if (!positions || !velocities) return;
    
    const posArray = positions.array as Float32Array;
    const velArray = velocities.array as Float32Array;
    
    for (let i = 0; i < posArray.length; i += 3) {
      // Apply velocity
      posArray[i] += velArray[i] * delta * 60;     // X
      posArray[i + 1] += velArray[i + 1] * delta * 60;  // Y
      posArray[i + 2] += velArray[i + 2] * delta * 60;  // Z
      
      // Reset particles that go too high
      if (posArray[i + 1] > 8) {
        posArray[i + 1] = -5;
        // Randomize X and Z position on reset
        const theta = Math.random() * Math.PI * 2;
        const radius = Math.random() * 8;
        posArray[i] = Math.cos(theta) * radius;
        posArray[i + 2] = Math.sin(theta) * radius;
      }
    }
    
    positions.needsUpdate = true;
  }

  private addAmbientLighting(): void {
    // Soft ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Subtle point light for depth
    const pointLight = new THREE.PointLight(0x10b981, 0.8, 50);
    pointLight.position.set(5, 8, 5);
    this.scene.add(pointLight);
    
    // Secondary light for visual interest
    const pointLight2 = new THREE.PointLight(0x3b82f6, 0.5, 40);
    pointLight2.position.set(-5, 5, -5);
    this.scene.add(pointLight2);
  }
}
