import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-solutions',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PublicNavComponent,
    LandingFooterComponent,
    ScrollToTopComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper">
      <app-public-nav></app-public-nav>

      <!-- Hero -->
      <header class="page-hero">
        <div class="hero-overlay"></div>
        
        <!-- Floating Hexagon IoT Icons Tech Overlay -->
        <div class="tech-overlay-grid">
          <div class="hex-icon floating-hex hex-1"><span class="material-icons">thermostat</span></div>
          <div class="hex-icon floating-hex hex-2"><span class="material-icons">water_drop</span></div>
          <div class="hex-icon floating-hex hex-3"><span class="material-icons">recycling</span></div>
          <div class="hex-icon floating-hex hex-4"><span class="material-icons">eco</span></div>
          <div class="hex-icon floating-hex hex-5"><span class="material-icons">memory</span></div>
          <div class="hex-icon floating-hex hex-6"><span class="material-icons">agriculture</span></div>
        </div>

        <div class="hero-content">
          <span class="page-label">{{ 'landing.solutions.hero.label' | translate }}</span>
          <h1>
            {{ 'landing.solutions.hero.title1' | translate }}
            <span class="accent">{{ 'landing.solutions.hero.title2' | translate }}</span>
          </h1>
          <p class="hero-sub">{{ 'landing.solutions.hero.sub' | translate }}</p>
        </div>
      </header>

      <main class="page-main">
        <!-- HOW IT WORKS -->
        <section class="section how-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.solutions.how.label' | translate }}</span>
              <h2>{{ 'landing.solutions.how.title' | translate }}</h2>
              <p class="section-sub">{{ 'landing.solutions.how.sub' | translate }}</p>
            </div>

            <div class="how-flow">
              <div class="flow-step" *ngFor="let step of howItWorks; let i = index">
                <div class="flow-pill">
                  <div class="flow-icon material-icons">{{ step.icon }}</div>
                  <div class="flow-content">
                    <h4>{{ step.title | translate }}</h4>
                    <p>{{ step.desc | translate }}</p>
                  </div>
                </div>
                <div class="flow-arrow" *ngIf="i < howItWorks.length - 1">→</div>
              </div>
            </div>
          </div>
        </section>

        <!-- SOLUTIONS GRID -->
        <section class="section solutions-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.solutions.tech.label' | translate }}</span>
              <h2>{{ 'landing.solutions.tech.title' | translate }}</h2>
            </div>

            <div class="solutions-grid">
              <div class="sol-card" *ngFor="let sol of solutions">
                <div class="sol-visual">
                  <div class="sol-icon material-icons">{{ sol.icon }}</div>
                </div>
                <div class="sol-body">
                  <div class="sol-tag">{{ sol.tag | translate }}</div>
                  <h3>{{ sol.title | translate }}</h3>
                  <p>{{ sol.desc | translate }}</p>
                  <div class="sol-points">
                    <div class="sol-point" *ngFor="let pt of sol.points">
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <circle cx="10" cy="10" r="10" fill="#d1fae5" />
                        <path
                          d="M5.5 10l3 3 6-6"
                          stroke="#10b981"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                      <span>{{ pt | translate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- MODULAR & SCALABLE -->
        <section class="section modular-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.solutions.modular.label' | translate }}</span>
              <h2>{{ 'landing.solutions.modular.title' | translate }}</h2>
              <p class="section-sub">{{ 'landing.solutions.modular.sub' | translate }}</p>
            </div>
            <div class="modular-grid fade-in">
              <div class="mod-card" *ngFor="let m of modular">
                <div class="mod-icon material-icons">{{ m.icon }}</div>
                <h4>{{ m.title | translate }}</h4>
                <p>{{ m.desc | translate }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="section cta-section">
          <div class="container">
            <div class="cta-box">
              <h2>{{ 'landing.solutions.cta.title' | translate }}</h2>
              <p>{{ 'landing.solutions.cta.desc' | translate }}</p>
              <div class="cta-actions">
                <a (click)="goToContactRegister()" class="btn-primary" style="cursor:pointer">{{
                  'landing.solutions.cta.btn1' | translate
                }}</a>
                <a routerLink="/projects" class="btn-secondary">{{
                  'landing.solutions.cta.btn2' | translate
                }}</a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <app-landing-footer></app-landing-footer>
      <app-scroll-to-top></app-scroll-to-top>
    </div>
  `,
  styles: [
    `
      .page-wrapper {
        min-height: 100vh;
        min-height: 100dvh;
        background: #f8faf8;
        font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      }

      .page-hero {
        position: relative;
        min-height: 52vh;
        min-height: 52dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a4a2e;
        overflow: hidden;
        padding-top: var(--nav-height);
      }

      .page-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('/assets/landing/images/solution.avif');
        background-size: cover;
        background-position: center;
        opacity: 0.8;
      }

      .page-hero::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 180px;
        z-index: 3;
        pointer-events: none;
        background: linear-gradient(
          to bottom,
          rgba(248, 250, 248, 0) 0%,
          rgba(248, 250, 248, 0.4) 40%,
          rgba(248, 250, 248, 0.85) 75%,
          rgba(248, 250, 248, 1) 100%
        );
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        mask-image: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.3) 30%,
          rgba(0, 0, 0, 0.8) 70%,
          rgba(0, 0, 0, 1) 100%
        );
        -webkit-mask-image: linear-gradient(
          to bottom,
          rgba(0, 0, 0, 0) 0%,
          rgba(0, 0, 0, 0.3) 30%,
          rgba(0, 0, 0, 0.8) 70%,
          rgba(0, 0, 0, 1) 100%
        );
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(5, 41, 82, 0.65) 0%, rgba(10, 74, 46, 0.55) 100%);
      }

      /* Tech Overlay with floating IoT icons */
      .tech-overlay-grid {
        position: absolute;
        inset: 0;
        pointer-events: none;
        z-index: 1;
      }

      .floating-hex {
        position: absolute;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: rgba(255, 255, 255, 0.03);
        border: 1px solid rgba(34, 197, 94, 0.2);
        color: #4ade80;
        clip-path: polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%);
        box-shadow: 0 0 15px rgba(74, 222, 128, 0.05);
        animation: float-slow-hex 6s ease-in-out infinite;
      }

      .floating-hex span {
        font-size: 1.5rem;
      }

      .hex-1 { top: 15%; left: 10%; animation-delay: 0s; }
      .hex-2 { top: 25%; right: 12%; animation-delay: 1.5s; }
      .hex-3 { bottom: 20%; left: 15%; animation-delay: 3s; }
      .hex-4 { bottom: 15%; right: 18%; animation-delay: 4.5s; }
      .hex-5 { top: 50%; left: 8%; animation-delay: 2s; }
      .hex-6 { top: 55%; right: 8%; animation-delay: 3.5s; }

      @keyframes float-slow-hex {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(0px); }
      }

      .hero-content {
        position: relative;
        z-index: 2;
        text-align: center;
        padding: 2rem 1.5rem;
      }

      .page-label {
        display: inline-block;
        background: rgba(16, 185, 129, 0.2);
        border: 1px solid rgba(16, 185, 129, 0.4);
        color: #6ee7b7;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 0.375rem 1rem;
        border-radius: 100px;
        margin-bottom: 1.25rem;
      }

      .hero-content h1 {
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 800;
        color: white;
        line-height: 1.15;
        margin-bottom: 1rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      }

      .accent {
        background: linear-gradient(135deg, #6ee7b7, #34d399);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .hero-sub {
        font-size: 1.15rem;
        color: #f8fafc; /* Solid off-white for high contrast */
        max-width: 640px;
        margin: 0 auto;
        line-height: 1.65;
        font-weight: 500; /* Medium weight for readability */
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.7); /* Deep text shadow */
      }

      .page-main {
        padding-bottom: 4rem;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
      }
      .section {
        padding: 5rem 0;
      }
      .how-section {
        background: white;
      }
      .solutions-section {
        background: #f8faf8;
      }
      .tech-section {
        background: white;
      }
      .modular-section {
        background: linear-gradient(180deg, #f0fdf4, #ecfdf5);
      }
      .cta-section {
        background: #f8faf8;
      }

      .section-header.center {
        text-align: center;
        margin-bottom: 3.5rem;
      }
      .section-label {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #10b981;
        margin-bottom: 0.75rem;
      }
      .section-sub {
        color: #6b7280;
        font-size: 1.0625rem;
        max-width: 560px;
        margin: 0.75rem auto 0;
        line-height: 1.6;
      }
      h2 {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 800;
        color: #1f2937;
        line-height: 1.2;
        margin-bottom: 1rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      }

      /* HOW IT WORKS */
      .how-flow {
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
      }

      @media (min-width: 768px) {
        .how-flow {
          flex-direction: row;
          align-items: center;
          justify-content: center;
        }
      }

      .flow-step {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
      }

      .flow-pill {
        flex: 1;
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 20px;
        padding: 1.5rem;
        transition: all 0.3s ease;
      }

      .flow-pill:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.4);
      }

      .flow-icon {
        font-size: 2rem;
        flex-shrink: 0;
        color: #10b981;
        text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        background: rgba(16, 185, 129, 0.1);
        padding: 0.75rem;
        border-radius: 12px;
        display: inline-flex;
        transition: all 0.3s ease;
      }
      .flow-pill:hover .flow-icon {
        transform: scale(1.1) rotate(5deg);
        text-shadow: 0 0 25px rgba(16, 185, 129, 0.6);
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
      }

      .flow-content h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.375rem;
      }
      .flow-content p {
        font-size: 0.8125rem;
        color: #6b7280;
        line-height: 1.5;
      }

      .flow-arrow {
        font-size: 1.25rem;
        color: #10b981;
        font-weight: 700;
        flex-shrink: 0;
        display: none;
      }

      @media (min-width: 768px) {
        .flow-arrow {
          display: block;
        }
      }

      /* SOLUTIONS GRID */
      .solutions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
        justify-content: center;
      }

      .sol-card {
        background: white;
        border: 1px solid rgba(16, 185, 129, 0.1);
        border-radius: 24px;
        overflow: hidden;
        transition: all 0.35s ease;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      }

      .sol-card:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 40px rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .sol-visual {
        background: #111;
        padding: 2rem;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
      }
      .sol-visual::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('/assets/images/pic3.jpg');
        background-size: cover;
        opacity: 0.55;
      }

      .sol-icon {
        font-size: 3rem;
        color: #34d399;
        text-shadow: 0 0 20px rgba(52, 211, 153, 0.6);
        position: relative;
        z-index: 2;
        transition: all 0.3s ease;
        display: inline-block;
      }
      .sol-card:hover .sol-icon {
        transform: scale(1.1);
        text-shadow: 0 0 30px rgba(52, 211, 153, 0.9);
      }

      .sol-body {
        padding: 1.75rem;
      }

      .sol-tag {
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #10b981;
        background: #f0fdf4;
        border-radius: 100px;
        padding: 0.25rem 0.75rem;
        display: inline-block;
        margin-bottom: 1rem;
      }

      .sol-body h3 {
        font-size: 1.0625rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.625rem;
      }
      .sol-body p {
        font-size: 0.9rem;
        color: #6b7280;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .sol-points {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .sol-point {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.8125rem;
        color: #374151;
      }

      /* MODULAR */
      .modular-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      @media (min-width: 640px) {
        .modular-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      @media (min-width: 1024px) {
        .modular-grid {
          grid-template-columns: repeat(4, 1fr);
        }
      }

      .mod-card {
        background: white;
        border-radius: 20px;
        padding: 2rem 1.5rem;
        text-align: center;
        border: 1px solid rgba(16, 185, 129, 0.12);
        transition: all 0.3s ease;
      }

      .mod-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 32px rgba(16, 185, 129, 0.1);
      }

      .mod-icon {
        font-size: 2.25rem;
        margin-bottom: 1rem;
        color: #10b981;
        text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(16, 185, 129, 0.05));
        padding: 1rem;
        border-radius: 50%;
        display: inline-flex;
        transition: all 0.3s ease;
      }
      .mod-card:hover .mod-icon {
        transform: scale(1.1);
        box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
      }
      .mod-card h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      .mod-card p {
        font-size: 0.875rem;
        color: #6b7280;
        line-height: 1.6;
      }

      /* CTA */
      .cta-box {
        position: relative;
        background: #0a4a2e;
        border-radius: 28px;
        padding: 4rem 2rem;
        text-align: center;
        overflow: hidden;
      }
      .cta-box::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('/assets/landing/images/bg2.webp');
        background-size: cover;
        background-position: center;
        opacity: 0.6;
        mix-blend-mode: overlay;
      }
      .cta-box h2,
      .cta-box p,
      .cta-actions {
        position: relative;
        z-index: 2;
      }
      .cta-box h2 {
        color: white;
        font-size: clamp(1.5rem, 4vw, 2.25rem);
        margin-bottom: 1rem;
      }
      .cta-box p {
        color: rgba(255, 255, 255, 0.75);
        font-size: 1.0625rem;
        margin-bottom: 2.5rem;
        max-width: 480px;
        margin-left: auto;
        margin-right: auto;
      }

      .cta-actions {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
      }
      @media (min-width: 480px) {
        .cta-actions {
          flex-direction: row;
          justify-content: center;
        }
      }

      .btn-primary {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: #10b981;
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        text-decoration: none;
        transition: all 0.25s ease;
      }
      .btn-primary:hover {
        background: #059669;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        transform: translateY(-2px);
      }

      .btn-secondary {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        text-decoration: none;
        transition: all 0.25s ease;
      }
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
      }

      .col-visual {
        display: flex;
        align-items: center;
        justify-content: center;
      }

      /* Animation CSS */
      .fade-in {
        opacity: 0;
        transform: translateY(20px);
        transition:
          opacity 0.6s ease-out,
          transform 0.6s ease-out;
      }
      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `,
  ],
})
export class SolutionsComponent implements OnInit {
  private router = inject(Router);
  private seoService = inject(SeoService);

  howItWorks = [
    {
      icon: 'sensors',
      title: 'landing.solutions.howSteps.0.title',
      desc: 'landing.solutions.howSteps.0.desc',
    },
    {
      icon: 'cloud',
      title: 'landing.solutions.howSteps.1.title',
      desc: 'landing.solutions.howSteps.1.desc',
    },
    {
      icon: 'psychology',
      title: 'landing.solutions.howSteps.2.title',
      desc: 'landing.solutions.howSteps.2.desc',
    },
    {
      icon: 'bolt',
      title: 'landing.solutions.howSteps.3.title',
      desc: 'landing.solutions.howSteps.3.desc',
    },
  ];

  solutions = [
    {
      icon: 'sensors',
      tag: 'landing.solutions.solutions.0.tag',
      title: 'landing.solutions.solutions.0.title',
      desc: 'landing.solutions.solutions.0.desc',
      points: [
        'landing.solutions.solutions.0.points.0',
        'landing.solutions.solutions.0.points.1',
        'landing.solutions.solutions.0.points.2',
        'landing.solutions.solutions.0.points.3',
      ],
    },
    {
      icon: 'smart_toy',
      tag: 'landing.solutions.solutions.1.tag',
      title: 'landing.solutions.solutions.1.title',
      desc: 'landing.solutions.solutions.1.desc',
      points: [
        'landing.solutions.solutions.1.points.0',
        'landing.solutions.solutions.1.points.1',
        'landing.solutions.solutions.1.points.2',
        'landing.solutions.solutions.1.points.3',
      ],
    },
    {
      icon: 'bar_chart',
      tag: 'landing.solutions.solutions.2.tag',
      title: 'landing.solutions.solutions.2.title',
      desc: 'landing.solutions.solutions.2.desc',
      points: [
        'landing.solutions.solutions.2.points.0',
        'landing.solutions.solutions.2.points.1',
        'landing.solutions.solutions.2.points.2',
      ],
    },
    {
      icon: 'my_location',
      tag: 'landing.solutions.solutions.3.tag',
      title: 'landing.solutions.solutions.3.title',
      desc: 'landing.solutions.solutions.3.desc',
      points: [
        'landing.solutions.solutions.3.points.0',
        'landing.solutions.solutions.3.points.1',
        'landing.solutions.solutions.3.points.2',
      ],
    },
    {
      icon: 'build',
      tag: 'landing.solutions.solutions.4.tag',
      title: 'landing.solutions.solutions.4.title',
      desc: 'landing.solutions.solutions.4.desc',
      points: [
        'landing.solutions.solutions.4.points.0',
        'landing.solutions.solutions.4.points.1',
        'landing.solutions.solutions.4.points.2',
        'landing.solutions.solutions.4.points.3',
      ],
    },
    {
      icon: 'view_module',
      tag: 'landing.solutions.solutions.5.tag',
      title: 'landing.solutions.solutions.5.title',
      desc: 'landing.solutions.solutions.5.desc',
      points: [
        'landing.solutions.solutions.5.points.0',
        'landing.solutions.solutions.5.points.1',
        'landing.solutions.solutions.5.points.2',
        'landing.solutions.solutions.5.points.3',
      ],
    },
  ];

  techTags = [
    'landing.solutions.techTags.0',
    'landing.solutions.techTags.1',
    'landing.solutions.techTags.2',
    'landing.solutions.techTags.3',
    'landing.solutions.techTags.4',
    'landing.solutions.techTags.5',
    'landing.solutions.techTags.6',
    'landing.solutions.techTags.7',
  ];

  gauges = [
    { dash: '80', val: '82%', label: 'landing.solutions.gauges.0' },
    { dash: '95', val: '96%', label: 'landing.solutions.gauges.1' },
    { dash: '60', val: '65%', label: 'landing.solutions.gauges.2' },
  ];

  chartBars = [45, 62, 58, 78, 85, 72, 90, 88, 95, 91, 87, 93];

  modular = [
    {
      icon: 'extension',
      title: 'landing.solutions.modularItems.0.title',
      desc: 'landing.solutions.modularItems.0.desc',
    },
    {
      icon: 'trending_up',
      title: 'landing.solutions.modularItems.1.title',
      desc: 'landing.solutions.modularItems.1.desc',
    },
    {
      icon: 'sync',
      title: 'landing.solutions.modularItems.2.title',
      desc: 'landing.solutions.modularItems.2.desc',
    },
    {
      icon: 'security',
      title: 'landing.solutions.modularItems.3.title',
      desc: 'landing.solutions.modularItems.3.desc',
    },
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // SEO — Solutions page meta tags
    this.seoService.setMeta({
      title: "Solutions IoT Agricoles | Feedin Green — Technologies pour l'Agriculture",
      description:
        'Découvrez les solutions technologiques Feedin Green : capteurs IoT, tableaux de bord intelligents, ' +
        'automatisation des serres et analyse de données pour optimiser votre exploitation agricole.',
      keywords:
        'solutions IoT agricoles, capteurs intelligents, automatisation serre, tableau de bord agricole, ' +
        'feedin green solutions, technologie agricole tunisie, smart farming solutions',
      url: 'https://feedingreen.com/solutions',
    });
    setTimeout(() => {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 },
      );

      document.querySelectorAll('.fade-in').forEach((el) => observer.observe(el));
    }, 100);
  }

  /**
   * Navigate to the contact page with the 'register' (Demander un accès) tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}
