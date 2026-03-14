/**
 * HeroSectionComponent
 * 
 * 🌾 IMMERSIVE HERO EXPERIENCE
 * Combines stunning agricultural imagery with Three.js particle magic
 * Creates a premium, state-of-the-art first impression
 * 
 * Visual: Beautiful Tunisian olive grove backdrop with floating particle overlay
 * Interaction: Smooth scroll-driven animations and parallax effects
 */

import { 
  Component, 
  ElementRef, 
  ViewChild, 
  AfterViewInit, 
  OnDestroy,
  ChangeDetectionStrategy,
  signal,
  inject,
  NgZone
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ThreeSceneService } from '../../3d/services/three-scene.service';
import { ScrollAnimationService } from '../../animations/services/scroll-animation.service';
import { ImmersiveHeroScene } from './hero-canvas-scene';
import { ThemeService } from '../../../../core/services/theme.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule, TranslatePipe],
  providers: [ThreeSceneService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="hero" id="hero-section" #heroSection>
      <!-- Background Image -->
      <div class="hero-backdrop" #backdrop>
        <picture>
          <source srcset="/assets/images/logos/landing-bg.webp" type="image/webp">
          <img 
            src="/assets/images/logos/landing-bg.jpg" 
            alt="Paysage agricole intelligent" 
            class="hero-bg-img"
            loading="eager"
            fetchpriority="high"
            decoding="sync"
            width="1920"
            height="1080"
          >
        </picture>
        <div class="backdrop-overlay"></div>
        <div class="backdrop-vignette"></div>
      </div>
      
      <!-- Three.js Canvas Container - Particle Overlay -->
      <div class="hero-canvas" #canvasContainer></div>
      

      
      <!-- Hero Content -->
      <div class="hero-content" [class.animate]="contentReady()" [class.dark-mode]="theme() === 'dark'">
        <h1 class="hero-headline">
          <span class="headline-line">{{ 'landing.hero.title1' | translate }}</span>
          <span class="headline-line">{{ 'landing.hero.title2' | translate }}</span>
        </h1>
        
        <div class="hero-cta-block">
          <div class="cta-row">
            <button class="hero-cta primary" (click)="onGetStarted()">
              <span class="cta-text">{{ 'landing.hero.cta1' | translate }}</span>
              <span class="cta-shine"></span>
            </button>
            <button class="hero-cta secondary" (click)="navigateTo('/solutions')">
              <span class="cta-text">{{ 'landing.hero.cta2' | translate }}</span>
            </button>
          </div>
          <p class="cta-helper-text">{{ 'landing.hero.helper' | translate }}</p>
        </div>
      </div>
      
      <!-- Scroll Indicator -->
      <div class="scroll-indicator" [class.hidden]="hasScrolled()">
        <div class="scroll-mouse">
          <div class="scroll-wheel"></div>
        </div>
        <span class="scroll-text">{{ 'landing.hero.scrollDown' | translate }}</span>
      </div>
      
      <!-- Ambient Light Effects -->
      <div class="ambient-glow ambient-glow--left"></div>
      <div class="ambient-glow ambient-glow--right"></div>
    </section>
  `,
  styles: [`
    /* =========================================
       HERO SECTION - IMMERSIVE EXPERIENCE
       Mobile-First Approach
       ========================================= */
    .hero {
      position: relative;
      min-height: 100vh;
      min-height: 100dvh;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      contain: layout style paint;
    }

    /* =========================================
       BACKDROP - Agricultural Image
       ========================================= */
    .hero-backdrop {
      position: absolute;
      inset: 0;
      z-index: 0;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background: #000;
    }

    .hero-bg-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      z-index: 2;
      opacity: 0;
      animation: heroFadeIn 1s ease-out forwards;
      will-change: opacity;
    }

    /* Opacity-only animation for LCP image — avoids expensive GPU scaling */
    @keyframes heroFadeIn {
      to { opacity: 1; }
    }

    .backdrop-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(
        180deg,
        rgba(0, 0, 0, 0.3) 0%,
        transparent 50%,
        rgba(0, 0, 0, 0.3) 100%
      );
      z-index: 3;
    }

    .backdrop-vignette {
      position: absolute;
      inset: 0;
      background: radial-gradient(
        circle at center,
        transparent 20%,
        rgba(0, 0, 0, 0.4) 100%
      );
      z-index: 4;
    }

    /* =========================================
       THREE.JS CANVAS OVERLAY
       ========================================= */
    .hero-canvas {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    /* =========================================
       NAVIGATION - Mobile-First
       ========================================= */
    .hero-nav {
      position: absolute;
      top: 0.75rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 100;
      width: calc(100% - 1.5rem);
      max-width: 1200px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .hero-nav.scrolled {
      position: fixed;
      top: 0.5rem;
    }

    .nav-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.5rem 0.75rem;
      background: var(--glass-bg);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-color);
      border-radius: 100px;
      box-shadow: var(--header-shadow);
      gap: 0.5rem;
    }

    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      cursor: pointer;
      flex-shrink: 0;
    }

    .brand-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--glass-bg);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    .brand-logo {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    .brand-text {
      font-size: 1.25rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--text-primary);
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      height: 32px;
    }

    .nav-brand:hover .brand-icon {
      transform: scale(1.1) rotate(-8deg);
    }

    .nav-brand:hover .brand-text {
      color: var(--primary-green);
    }

    /* ---- Nav Links (hidden on mobile, shown via hamburger) ---- */
    .nav-links {
      display: none;
      position: fixed;
      top: 0;
      right: 0;
      width: 280px;
      height: 100vh;
      height: 100dvh;
      flex-direction: column;
      gap: 0.25rem;
      padding: 5rem 1.5rem 2rem;
      background: var(--glass-bg);
      backdrop-filter: blur(30px);
      border-left: 1px solid var(--border-color);
      box-shadow: -8px 0 32px rgba(0, 0, 0, 0.15);
      z-index: 200;
      transform: translateX(100%);
      transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .nav-links.mobile-open {
      display: flex;
      transform: translateX(0);
    }

    /* Mobile overlay */
    .mobile-overlay {
      display: none;
      position: fixed;
      inset: 0;
      background: transparent;
      z-index: 150;
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    .mobile-overlay.active {
      display: block;
      opacity: 1;
    }

    .nav-link {
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 500;
      font-size: 1rem;
      cursor: pointer;
      position: relative;
      transition: color 0.2s ease;
      padding: 0.75rem 1rem;
      border-radius: 12px;
    }

    .nav-link:hover {
      color: var(--primary-green);
      background: rgba(16, 185, 129, 0.08);
    }

    .nav-link.active {
      color: var(--primary-green);
      font-weight: 600;
      background: rgba(16, 185, 129, 0.1);
    }

    /* Mobile auth buttons inside the slide-out menu */
    .mobile-auth-buttons {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: auto;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border-color);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .nav-icon-btn {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.3s ease;
      flex-shrink: 0;
    }

    .nav-icon-btn:hover {
      background: var(--primary-green);
      color: white;
      border-color: transparent;
    }

    /* ---- Auth Buttons ---- */
    .nav-btn {
      border: none;
      border-radius: 100px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.25s ease;
      white-space: nowrap;
      font-family: system-ui, -apple-system, sans-serif;
    }

    .nav-btn--secondary {
      padding: 0.625rem 1rem;
      background: transparent;
      color: var(--text-primary);
      font-size: 0.8125rem;
    }

    .nav-btn--secondary:hover {
      color: var(--primary-green);
    }

    .nav-btn--primary {
      padding: 0.625rem 1.25rem;
      background: var(--primary-green);
      color: white;
      font-size: 0.8125rem;
    }

    .nav-btn--primary:hover {
      background: var(--dark-green, #059669);
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
    }

    /* Desktop auth buttons - hidden on mobile */
    .desktop-only {
      display: none;
    }

    /* ---- Hamburger Button ---- */
    .hamburger-btn {
      display: flex;
      flex-direction: column;
      gap: 4px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 8px;
      z-index: 250;
      flex-shrink: 0;
    }

    .hamburger-line {
      display: block;
      width: 20px;
      height: 2px;
      background: var(--text-primary);
      border-radius: 2px;
      transition: all 0.3s ease;
      transform-origin: center;
    }

    .hamburger-btn.active .hamburger-line:nth-child(1) {
      transform: rotate(45deg) translate(4px, 4px);
    }

    .hamburger-btn.active .hamburger-line:nth-child(2) {
      opacity: 0;
      transform: scaleX(0);
    }

    .hamburger-btn.active .hamburger-line:nth-child(3) {
      transform: rotate(-45deg) translate(4px, -4px);
    }

    /* =========================================
       HERO CONTENT - Typography & CTA
       ========================================= */
    .hero-content {
      position: relative;
      z-index: 10;
      text-align: center;
      padding: 1.25rem;
      margin-top: -2vh;
    }

    .hero-headline {
      font-family: 'Georgia', 'Playfair Display', serif;
      font-size: clamp(1.75rem, 12vw, 2.5rem);
      font-weight: 700;
      line-height: 1.1;
      margin: 0 0 2rem;
      letter-spacing: -0.02em;
    }

    .headline-line {
      display: block;
      opacity: 0;
      transform: translateY(40px);
      animation: headlineReveal 1s ease-out forwards;
      background: linear-gradient(135deg, #17C6BC 0%, #052952 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      color: transparent;
    }

    .headline-line:nth-child(1) {
      animation-delay: 0.2s;
    }

    .headline-line:nth-child(2) {
      animation-delay: 0.4s;
    }

    @keyframes headlineReveal {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .hero-cta {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.875rem 2.25rem;
      border: none;
      border-radius: 100px;
      cursor: pointer;
      overflow: hidden;
      opacity: 0;
      transform: translateY(20px);
      animation: ctaReveal 0.8s ease-out 0.7s forwards;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .hero-cta.primary {
      background: var(--primary-green);
      box-shadow: 
        0 8px 24px rgba(16, 185, 129, 0.25),
        0 4px 8px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    
    .hero-cta.primary:hover {
      transform: translateY(-3px);
      box-shadow: 
        0 16px 40px rgba(16, 185, 129, 0.4),
        0 6px 12px rgba(0, 0, 0, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.3);
      background: var(--primary-green);
    }

    .hero-cta.secondary {
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.3);
      animation-delay: 0.8s;
    }

    .hero-cta.secondary:hover {
      background: rgba(255, 255, 255, 0.2);
      transform: translateY(-3px);
      border-color: rgba(255, 255, 255, 0.5);
    }

    .hero-cta.secondary .cta-text {
      color: white;
    }

    .hero-cta:active {
      transform: translateY(-1px);
    }

    .cta-text {
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      color: white;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    }

    .cta-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 50%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(255, 255, 255, 0.3),
        transparent
      );
      transition: left 0.6s ease;
    }

    .hero-cta:hover .cta-shine {
      left: 150%;
    }

    @keyframes ctaReveal {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* CTA Block wrapper */
    .hero-cta-block {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      margin-top: 1rem;
    }

    .cta-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
      justify-content: center;
    }
    /* Helper Text under CTA */
    .cta-helper-text {
      margin: 10px 0 0;
      font-family: system-ui, -apple-system, sans-serif;
      font-size: 0.8125rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.65);
      text-align: center;
      letter-spacing: 0.01em;
      line-height: 1.4;
      max-width: 320px;
      opacity: 0;
      transform: translateY(12px);
      animation: ctaReveal 0.7s ease-out 0.95s forwards;
    }

    /* =========================================
       SCROLL INDICATOR
       ========================================= */
    .scroll-indicator {
      position: absolute;
      bottom: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      opacity: 1;
      transition: opacity 0.5s ease;
      z-index: 10;
    }

    .scroll-indicator.hidden {
      opacity: 0;
      pointer-events: none;
    }

    .scroll-mouse {
      width: 22px;
      height: 36px;
      border: 2px solid var(--text-primary);
      border-radius: 11px;
      position: relative;
    }

    .scroll-wheel {
      position: absolute;
      top: 6px;
      left: 50%;
      transform: translateX(-50%);
      width: 3px;
      height: 7px;
      background: var(--text-primary);
      border-radius: 2px;
      animation: scrollBounce 2s ease-in-out infinite;
    }

    @keyframes scrollBounce {
      0%, 100% { 
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
      50% { 
        transform: translateX(-50%) translateY(8px);
        opacity: 0.3;
      }
    }

    .scroll-text {
      font-size: 0.625rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      color: var(--text-secondary);
      font-weight: 500;
    }

    /* =========================================
       AMBIENT GLOW EFFECTS
       ========================================= */
    .ambient-glow {
      position: absolute;
      width: 300px;
      height: 300px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.15;
      pointer-events: none;
      z-index: 2;
    }

    .ambient-glow--left {
      top: -10%;
      left: -10%;
      background: radial-gradient(circle, #6d8b53 0%, transparent 70%);
      animation: glowPulseLeft 8s ease-in-out infinite;
    }

    .ambient-glow--right {
      bottom: -20%;
      right: -10%;
      background: radial-gradient(circle, #c9a86c 0%, transparent 70%);
      animation: glowPulseRight 10s ease-in-out infinite;
    }

    @keyframes glowPulseLeft {
      0%, 100% { 
        transform: translate(0, 0) scale(1);
        opacity: 0.12;
      }
      50% { 
        transform: translate(20px, 10px) scale(1.1);
        opacity: 0.18;
      }
    }

    @keyframes glowPulseRight {
      0%, 100% { 
        transform: translate(0, 0) scale(1);
        opacity: 0.1;
      }
      50% { 
        transform: translate(-15px, -20px) scale(1.15);
        opacity: 0.15;
      }
    }

    /* =========================================
       RESPONSIVE — TABLET (≥768px)
       ========================================= */
    @media (min-width: 768px) {
      .hero-nav {
        top: 1rem;
        width: calc(100% - 2.5rem);
      }

      .hero-nav.scrolled {
        top: 0.75rem;
      }

      .nav-inner {
        padding: 0.625rem 1.25rem;
        gap: 0.75rem;
      }

      .brand-icon {
        width: 36px;
        height: 36px;
        border-radius: 12px;
      }

      .brand-text {
        font-size: 1.375rem;
        height: 36px;
      }

      .nav-icon-btn {
        width: 40px;
        height: 40px;
      }

      .hero-content {
        padding: 2rem;
        margin-top: -3vh;
      }

      .hero-headline {
        font-size: clamp(2rem, 7vw, 3.5rem);
      }

      .hero-cta {
        padding: 1rem 2.5rem;
      }

      .cta-text {
        font-size: 0.875rem;
        letter-spacing: 0.12em;
      }

      .scroll-indicator {
        bottom: 2rem;
        gap: 0.75rem;
      }

      .scroll-mouse {
        width: 24px;
        height: 40px;
        border-radius: 12px;
      }

      .scroll-wheel {
        top: 8px;
        width: 4px;
        height: 8px;
      }

      .scroll-text {
        font-size: 0.6875rem;
      }

      .ambient-glow {
        width: 450px;
        height: 450px;
      }
    }

    /* =========================================
       RESPONSIVE — DESKTOP (≥1024px)
       ========================================= */
    @media (min-width: 1024px) {
      .hero-nav {
        top: 1.5rem;
        width: calc(100% - 3rem);
      }

      .hero-nav.scrolled {
        top: 1rem;
      }

      .nav-inner {
        padding: 0.75rem 1.5rem;
        gap: 1rem;
      }

      .brand-text {
        font-size: 1.5rem;
      }

      /* Show inline nav links on desktop */
      .nav-links {
        display: flex;
        position: static;
        width: auto;
        height: auto;
        flex-direction: row;
        gap: 1.25rem;
        padding: 0;
        background: none;
        backdrop-filter: none;
        border-left: none;
        box-shadow: none;
        transform: none;
        transition: none;
      }

      .nav-link {
        font-size: 0.9375rem;
        padding: 0.25rem 0;
        border-radius: 0;
      }

      .nav-link::after {
        content: '';
        position: absolute;
        bottom: -4px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 4px;
        background: var(--primary-green);
        border-radius: 2px;
        transition: width 0.3s ease;
        opacity: 0;
      }

      .nav-link:hover {
        background: none;
      }

      .nav-link:hover::after {
        width: 4px;
        opacity: 1;
      }

      .nav-link.active {
        background: none;
      }

      .nav-link.active::after {
        width: 4px;
        opacity: 1;
      }

      /* Show desktop auth buttons, hide hamburger & mobile stuff */
      .desktop-only {
        display: inline-flex;
      }

      .hamburger-btn {
        display: none;
      }

      .mobile-overlay {
        display: none !important;
      }

      .mobile-auth-buttons {
        display: none;
      }

      .nav-actions {
        gap: 0.75rem;
      }

      .hero-content {
        margin-top: -5vh;
      }

      .hero-headline {
        font-size: clamp(2.5rem, 7vw, 4.5rem);
        margin-bottom: 2.5rem;
      }

      .hero-cta {
        padding: 1.125rem 3rem;
      }

      .cta-text {
        font-size: 0.875rem;
        letter-spacing: 0.15em;
      }

      .scroll-indicator {
        bottom: 2.5rem;
      }

      .ambient-glow {
        width: 600px;
        height: 600px;
      }
    }

    /* =========================================
       LARGE DESKTOP (≥1280px)
       ========================================= */
    @media (min-width: 1280px) {
      .nav-links {
        gap: 1.5rem;
      }

      .hero-headline {
        font-size: clamp(3rem, 8vw, 5.5rem);
      }
    }

    /* =========================================
       REDUCED MOTION SUPPORT
       ========================================= */
    @media (prefers-reduced-motion: reduce) {
      .headline-line,
      .hero-cta,
      .cta-helper-text {
        opacity: 1;
        transform: none;
        animation: none;
      }

      .scroll-wheel {
        animation: none;
      }

      .ambient-glow--left,
      .ambient-glow--right {
        animation: none;
      }

      .cta-shine {
        display: none;
      }

      .nav-links {
        transition: none;
      }
    }
  `]
})
export class HeroSectionComponent implements AfterViewInit, OnDestroy {
  @ViewChild('canvasContainer') canvasContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('heroSection') heroSection!: ElementRef<HTMLElement>;
  @ViewChild('backdrop') backdrop!: ElementRef<HTMLDivElement>;
  
  private threeService = inject(ThreeSceneService);
  private scrollService = inject(ScrollAnimationService);
  private themeService = inject(ThemeService);
  private ngZone = inject(NgZone);
  private router = inject(Router);


  theme = toSignal(this.themeService.theme$);
  
  private heroScene: ImmersiveHeroScene | null = null;
  private scrollUnsubscribe: (() => void) | null = null;
  
  // Stored handler references for proper cleanup
  private cursorMoveHandler: ((e: MouseEvent) => void) | null = null;
  private parallaxScrollHandler: (() => void) | null = null;
  
  hasScrolled = signal(false);
  contentReady = signal(false);

  ngAfterViewInit(): void {
    // Give browser time to load image
    setTimeout(() => {
      this.contentReady.set(true);
    }, 100);
    
    // Check device capability before initializing Three.js
    // Skip entirely on very low-end devices to preserve performance
    const shouldInitThree = this.shouldInitThreeJS();
    
    if (shouldInitThree) {
      // Defer Three.js initialization to reduce TBT — render hero content first (LCP),
      // then load particles after the browser is idle
      const initHeavy = async () => {
        await this.initThreeScene();
        this.setupCursorTracking();
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(initHeavy, { timeout: 3000 });
      } else {
        setTimeout(initHeavy, 500);
      }
    }

    // These are lightweight — run immediately
    this.setupScrollTracking();
    this.setupParallax();
  }

  /**
   * Determine if the device can handle Three.js particle rendering.
   * Skips on very low-end: < 2 cores, < 2GB memory, or reduced motion.
   */
  private shouldInitThreeJS(): boolean {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    
    const cores = navigator.hardwareConcurrency || 4;
    const memory = (navigator as any).deviceMemory || 8;
    
    // Very low-end devices: skip Three.js entirely
    if (cores < 2 || memory < 2) {
      return false;
    }
    
    // Check for WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return false;
    } catch {
      return false;
    }
    
    return true;
  }

  ngOnDestroy(): void {
    if (this.heroScene) {
      this.heroScene.dispose();
    }
    this.threeService.dispose();
    if (this.scrollUnsubscribe) {
      this.scrollUnsubscribe();
    }

    // Cleanup cursor tracking listener
    if (this.cursorMoveHandler) {
      this.heroSection?.nativeElement.removeEventListener('mousemove', this.cursorMoveHandler);
      this.cursorMoveHandler = null;
    }

    // Cleanup parallax scroll listener
    if (this.parallaxScrollHandler) {
      window.removeEventListener('scroll', this.parallaxScrollHandler);
      this.parallaxScrollHandler = null;
    }
  }

  onGetStarted(): void {
    // Navigate directly to the contact lead form
    this.router.navigate(['/contact']);
  }
  navigateTo(path: string): void {
    this.router.navigate([path]);
  }

  private async initThreeScene(): Promise<void> {
    const initResult = await this.threeService.init({
      container: this.canvasContainer.nativeElement,
      onAnimate: (delta, elapsed) => {
        if (this.heroScene) {
          this.heroScene.update(delta, elapsed);
        }
      }
    });

    if (!initResult) return;
    const { scene } = initResult;
    
    // Dynamically import THREE to pass to ImmersiveHeroScene
    const THREE = await import('three');

    // Initialize immersive scene with particles
    this.heroScene = new ImmersiveHeroScene(scene, THREE);
    this.heroScene.init();

    // Start rendering
    this.threeService.start();
  }

  private setupScrollTracking(): void {
    this.scrollService.createScrollTimeline({
      trigger: this.heroSection.nativeElement,
      start: 'top top',
      end: 'bottom top',
      onUpdate: (progress) => {
        this.threeService.updateCameraForScroll(progress);
        if (this.heroScene) {
          this.heroScene.setScrollProgress(progress);
        }
        
        this.ngZone.run(() => {
          this.hasScrolled.set(progress > 0.03);
        });
      }
    });
  }

  private setupCursorTracking(): void {
    this.ngZone.runOutsideAngular(() => {
      const container = this.heroSection.nativeElement;
      
      this.cursorMoveHandler = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const normalizedX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const normalizedY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        
        this.threeService.updateCameraForCursor(normalizedX, normalizedY);
        
        // Update scene with cursor for particle interaction
        if (this.heroScene) {
          this.heroScene.setCursorPosition(normalizedX, normalizedY);
        }
      };

      container.addEventListener('mousemove', this.cursorMoveHandler);
    });
  }

  private setupParallax(): void {
    this.ngZone.runOutsideAngular(() => {
      let ticking = false;
      // Cache the image element to avoid repeated querySelector calls per frame
      let cachedImg: HTMLElement | null = null;
      
      const updateParallax = () => {
        const scrollY = window.scrollY;
        const parallaxAmount = scrollY * 0.08; // Slightly subtler parallax
        
        if (!cachedImg && this.backdrop?.nativeElement) {
          cachedImg = this.backdrop.nativeElement.querySelector('.hero-bg-img') as HTMLElement;
          if (cachedImg) {
            cachedImg.style.willChange = 'transform';
          }
        }
        
        if (cachedImg) {
          // Use translate3d for GPU-composited movement (no layout trigger)
          cachedImg.style.transform = `translate3d(0, ${parallaxAmount}px, 0)`;
        }
        
        ticking = false;
      };
      
      this.parallaxScrollHandler = () => {
        if (!ticking) {
          requestAnimationFrame(updateParallax);
          ticking = true;
        }
      };

      window.addEventListener('scroll', this.parallaxScrollHandler, { passive: true });
    });
  }
}
