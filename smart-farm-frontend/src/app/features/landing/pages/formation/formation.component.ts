import { Component, ChangeDetectionStrategy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';
import { TrainingRequestDrawerComponent } from './training-request-drawer/training-request-drawer.component';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-formation',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PublicNavComponent,
    LandingFooterComponent,
    ScrollToTopComponent,
    TranslatePipe,
    TrainingRequestDrawerComponent,
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
          <span class="page-label">{{ 'landing.formation.hero.label' | translate }}</span>
          <h1>
            {{ 'landing.formation.hero.title1' | translate }}
            <span class="accent">{{ 'landing.formation.hero.title2' | translate }}</span>
          </h1>
          <p class="hero-sub">{{ 'landing.formation.hero.sub' | translate }}</p>
        </div>
        <div class="hero-stats">
          <div class="hs-item" *ngFor="let s of heroStats">
            <div class="hs-value">{{ s.value }}</div>
            <div class="hs-label">{{ s.label | translate }}</div>
          </div>
        </div>
      </header>

      <main class="page-main">
        <!-- PHILOSOPHY -->
        <section class="section phil-section">
          <div class="container">
            <div class="two-col alignment-center">
              <div class="col-text fade-in">
                <span class="section-label">{{ 'landing.formation.phil.label' | translate }}</span>
                <h2>{{ 'landing.formation.phil.title' | translate }}</h2>
                <p>{{ 'landing.formation.phil.p1' | translate }}</p>
                <p>{{ 'landing.formation.phil.p2' | translate }}</p>
                <blockquote class="feature-quote">
                  <span class="material-icons quote-icon">format_quote</span>
                  <p>"{{ 'landing.formation.phil.quote' | translate }}"</p>
                </blockquote>
              </div>
              <div class="col-visual fade-in">
                <div class="visual-stack">
                  <div class="img-wrapper">
                    <img src="/assets/images/pic2.jpg" alt="Formation Focus" class="stack-img" />
                    <div class="img-overlay"></div>
                  </div>
                  <div class="objective-cards">
                    <div class="obj-card" *ngFor="let obj of objectives">
                      <div class="obj-check material-icons">check</div>
                      <span>{{ obj | translate }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- TRAINING TYPES -->
        <section class="section training-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{
                'landing.formation.training.label' | translate
              }}</span>
              <h2>{{ 'landing.formation.training.title' | translate }}</h2>
              <p class="section-sub">{{ 'landing.formation.training.sub' | translate }}</p>
            </div>

            <div class="training-grid fade-in">
              <div class="training-card" *ngFor="let t of trainings; let i = index">
                <div class="tc-top">
                  <div class="tc-icon-wrapper">
                    <div class="tc-icon material-icons">{{ t.icon }}</div>
                  </div>
                  <div class="tc-number">0{{ i + 1 }}</div>
                </div>
                <div class="tc-badge">{{ t.badge | translate }}</div>
                <h3>{{ t.title | translate }}</h3>
                <p>{{ t.desc | translate }}</p>
                <div class="tc-modules-container">
                  <div class="tc-module-header">
                    <span class="material-icons">list_alt</span>
                    {{ 'landing.formation.training.moduleHeader' | translate }}
                  </div>
                  <ul class="tc-modules">
                    <li class="tc-module" *ngFor="let m of t.modules">
                      <span class="material-icons module-check">check_circle</span>
                      <span>{{ m | translate }}</span>
                    </li>
                  </ul>
                </div>
                <div class="tc-footer">
                  <div class="tc-duration">
                    <span class="material-icons">schedule</span>
                    {{ t.duration | translate }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- POST-FORMATION -->
        <section class="section post-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.formation.post.label' | translate }}</span>
              <h2>{{ 'landing.formation.post.title' | translate }}</h2>
            </div>

            <div class="post-layout">
              <div class="post-grid fade-in">
                <div class="post-card" *ngFor="let p of postFormation; let i = index">
                  <div class="pc-header">
                    <div class="pc-icon material-icons">{{ p.icon }}</div>
                    <div class="pc-index">0{{ i + 1 }}</div>
                  </div>
                  <div class="pc-content">
                    <h4>{{ p.title | translate }}</h4>
                    <p>{{ p.desc | translate }}</p>
                  </div>
                </div>
              </div>

              <div class="post-objective-wrapper fade-in">
                <div class="post-objective">
                  <div class="po-icon-container">
                    <div class="po-icon material-icons">my_location</div>
                  </div>
                  <div class="po-content">
                    <h4>{{ 'landing.formation.post.objTitle' | translate }}</h4>
                    <p>
                      {{ 'landing.formation.post.objDesc1' | translate }}
                      <span class="jersey-10-regular highlight-text">Feed In Green</span
                      >{{ 'landing.formation.post.objDesc2' | translate }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- VALUE ADDED -->
        <section class="section value-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.formation.value.label' | translate }}</span>
              <h2>
                {{ 'landing.formation.value.title' | translate }}
                <span class="jersey-10-regular feedin-green-text">Feed In Green</span>
              </h2>
            </div>
            <div class="value-bento fade-in">
              <div class="value-item" *ngFor="let v of valueAdded; let i = index">
                <div class="vi-icon-box">
                  <div class="vi-icon material-icons">{{ v.icon }}</div>
                </div>
                <div class="vi-content">
                  <h4>{{ v.title | translate }}</h4>
                  <p>{{ v.desc | translate }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="section cta-section">
          <div class="container">
            <div class="cta-box fade-in">
              <h2>{{ 'landing.formation.cta.title' | translate }}</h2>
              <p>{{ 'landing.formation.cta.desc' | translate }}</p>
              <div class="cta-actions">
                <button (click)="openDrawer()" class="btn-primary btn-glow">
                  <span>{{ 'landing.formation.cta.btn1' | translate }}</span>
                  <span class="material-icons icon-nav">arrow_forward</span>
                </button>
                <a routerLink="/services" class="btn-secondary">
                  <span>{{ 'landing.formation.cta.btn2' | translate }}</span>
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      <app-landing-footer></app-landing-footer>
      <app-scroll-to-top></app-scroll-to-top>
      <app-training-request-drawer
        [isOpen]="drawerOpen()"
        (closed)="closeDrawer()"
      ></app-training-request-drawer>
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
        min-height: 60vh;
        min-height: 60dvh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        background: #052952;
        overflow: hidden;
        padding-top: var(--nav-height);
        padding-bottom: 3rem;
      }

      .page-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('/assets/landing/images/amenagment2.png');
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
        background: linear-gradient(160deg, rgba(10, 74, 46, 0.65) 0%, rgba(5, 41, 82, 0.55) 100%);
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
        padding: 2rem 1.5rem 1.5rem;
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
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.65;
        font-weight: 500; /* Medium weight for readability */
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.7); /* Deep text shadow */
      }

      .hero-stats {
        position: relative;
        z-index: 2;
        display: flex;
        gap: 3rem;
        margin-top: 2.5rem;
        flex-wrap: wrap;
        justify-content: center;
        padding: 0 1.5rem;
      }

      .hs-item {
        text-align: center;
      }
      .hs-value {
        font-size: 2.5rem; /* Slightly larger */
        font-weight: 800;
        color: #4ade80; /* Vibrant bright green for maximum visibility */
        font-family: 'Outfit', system-ui, sans-serif;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
      }
      .hs-label {
        font-size: 0.875rem; /* Slightly larger */
        color: #ffffff;
        font-weight: 600; /* Bolder text */
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
        margin-top: 0.25rem;
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
      .phil-section {
        background: white;
      }
      .training-section {
        background: #f8faf8;
      }
      .post-section {
        background: white;
      }
      .value-section {
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

      /* PHILOSOPHY */
      .alignment-center {
        align-items: center;
      }
      .two-col {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4rem;
      }
      @media (min-width: 900px) {
        .two-col {
          grid-template-columns: 1.1fr 0.9fr;
          gap: 6rem;
        }
      }

      .col-text p {
        color: #4b5563;
        line-height: 1.8;
        margin-bottom: 1.25rem;
        font-size: 1.0625rem;
      }

      .feature-quote {
        position: relative;
        background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        border-left: 4px solid #10b981;
        border-radius: 0 20px 20px 0;
        padding: 1.5rem 2rem;
        margin-top: 2rem;
        transition: all 0.3s ease;
      }
      .feature-quote:hover {
        transform: translateX(8px);
        box-shadow: 0 10px 30px rgba(16, 185, 129, 0.1);
      }
      .quote-icon {
        position: absolute;
        top: -15px;
        left: 20px;
        font-size: 2.5rem;
        color: rgba(16, 185, 129, 0.5);
        background: white;
        border-radius: 50%;
        padding: 5px;
      }
      .feature-quote p {
        font-style: italic;
        color: #1f2937;
        font-size: 1.125rem;
        font-weight: 500;
        margin: 0;
      }

      .visual-stack {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }

      .img-wrapper {
        position: relative;
        width: 100%;
        height: 280px;
        border-radius: 24px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        display: none;
      }
      @media (min-width: 900px) {
        .img-wrapper {
          display: block;
        }
      }
      .stack-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.7s ease;
      }
      .visual-stack:hover .stack-img {
        transform: scale(1.05);
      }
      .img-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(10, 74, 46, 0.4), transparent);
      }

      .objective-cards {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        position: relative;
        z-index: 2;
      }
      @media (min-width: 900px) {
        .objective-cards {
          margin-top: -60px;
          margin-left: -40px;
          margin-right: 40px;
        }
      }

      .obj-card {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 16px;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.06);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .obj-card:hover {
        border-color: rgba(16, 185, 129, 0.5);
        box-shadow: 0 12px 40px rgba(16, 185, 129, 0.15);
        transform: translateX(8px) scale(1.02);
      }

      .obj-check {
        width: 34px;
        height: 34px;
        min-width: 34px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.1rem;
        font-weight: bold;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .obj-card:hover .obj-check {
        transform: scale(1.2) rotate(10deg);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
      }

      .obj-card span {
        font-size: 1rem;
        font-weight: 500;
        color: #374151;
        line-height: 1.4;
      }

      /* TRAINING GRID */
      .training-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      @media (min-width: 768px) {
        .training-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .training-card {
        background: white;
        border: 1px solid rgba(16, 185, 129, 0.15);
        border-radius: 28px;
        padding: 2.5rem 2rem;
        position: relative;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        display: flex;
        flex-direction: column;
      }

      .training-card:hover {
        transform: translateY(-12px);
        box-shadow: 0 24px 50px rgba(16, 185, 129, 0.12);
        border-color: rgba(16, 185, 129, 0.4);
      }

      .tc-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 1.5rem;
      }

      .tc-icon-wrapper {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        background: #f0fdf4;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.4s ease;
      }

      .tc-icon {
        font-size: 2.2rem;
        color: #10b981;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }

      .training-card:hover .tc-icon-wrapper {
        background: #10b981;
        transform: rotate(-5deg);
      }
      .training-card:hover .tc-icon {
        color: white;
        transform: scale(1.1);
      }

      .tc-number {
        font-size: 2.5rem;
        font-weight: 900;
        color: transparent;
        -webkit-text-stroke: 1px rgba(16, 185, 129, 0.4);
        font-family: 'Outfit', sans-serif;
        line-height: 1;
        transition: all 0.4s ease;
      }
      .training-card:hover .tc-number {
        -webkit-text-stroke: 1px #10b981;
        color: rgba(16, 185, 129, 0.1);
        transform: scale(1.1);
      }

      .tc-badge {
        display: inline-flex;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #059669;
        background: #ecfdf5;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 100px;
        padding: 0.4rem 1rem;
        margin-bottom: 1.25rem;
      }

      .training-card h3 {
        font-size: 1.25rem;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 1rem;
        line-height: 1.3;
      }
      .training-card p {
        color: #6b7280;
        font-size: 1rem;
        line-height: 1.6;
        margin-bottom: 2rem;
        flex-grow: 1;
      }

      .tc-modules-container {
        margin-bottom: 1.5rem;
        background: #f9fafb;
        border-radius: 16px;
        padding: 1.25rem;
      }
      .tc-module-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        font-weight: 700;
        color: #374151;
        margin-bottom: 1rem;
      }
      .tc-module-header .material-icons {
        font-size: 1.1rem;
        color: #10b981;
      }

      .tc-modules {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }
      .tc-module {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        font-size: 0.9rem;
        color: #4b5563;
      }
      .module-check {
        font-size: 1.1rem;
        color: #34d399;
        margin-top: 0.1rem;
      }

      .tc-footer {
        padding-top: 1.5rem;
        border-top: 1px solid #f3f4f6;
        margin-top: auto;
      }
      .tc-duration {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.9rem;
        font-weight: 600;
        color: #1f2937;
      }
      .tc-duration .material-icons {
        font-size: 1.2rem;
        color: #10b981;
      }

      /* POST-FORMATION */
      .post-layout {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
      }
      @media (min-width: 1024px) {
        .post-layout {
          grid-template-columns: 1.2fr 0.8fr;
          align-items: start;
        }
      }

      .post-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      @media (min-width: 640px) {
        .post-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .post-card {
        background: #ffffff;
        border: 1px solid rgba(16, 185, 129, 0.1);
        border-radius: 24px;
        padding: 2rem;
        transition: all 0.4s ease;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.02);
      }

      .post-card:hover {
        background: #f0fdf4;
        box-shadow: 0 12px 30px rgba(16, 185, 129, 0.1);
        transform: translateY(-8px);
        border-color: rgba(16, 185, 129, 0.3);
      }

      .pc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.25rem;
      }

      .pc-icon {
        font-size: 2.5rem;
        color: #10b981;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        background: #ecfdf5;
        padding: 0.75rem;
        border-radius: 16px;
      }
      .post-card:hover .pc-icon {
        transform: scale(1.1) rotate(-10deg);
        background: #10b981;
        color: white;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
      }

      .pc-index {
        font-size: 1.5rem;
        font-weight: 800;
        color: rgba(16, 185, 129, 0.15);
        font-family: 'Outfit', sans-serif;
      }

      .pc-content h4 {
        font-size: 1.125rem;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      .pc-content p {
        font-size: 0.95rem;
        color: #6b7280;
        line-height: 1.6;
      }

      .post-objective-wrapper {
        position: relative;
        height: 100%;
      }

      .post-objective {
        position: sticky;
        top: 6rem;
        display: flex;
        flex-direction: column;
        gap: 2rem;
        border-radius: 28px;
        padding: 3rem 2.5rem;
        color: white;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(16, 185, 129, 0.2);
        background-color: #0a4a2e;
      }

      .post-objective::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('/assets/images/pic3.jpg');
        background-size: cover;
        background-position: center;
        opacity: 0.7;
        z-index: 0;
        transition: transform 3s ease;
      }

      .post-objective:hover::before {
        transform: scale(1.05);
      }

      .post-objective::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(145deg, rgba(8, 60, 36, 0.75), rgba(10, 74, 46, 0.8));
        z-index: 0;
      }

      .po-icon-container,
      .po-content {
        position: relative;
        z-index: 1;
      }

      .po-icon {
        font-size: 4rem;
        color: #34d399;
        display: inline-block;
        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        filter: drop-shadow(0 0 15px rgba(52, 211, 153, 0.4));
      }
      .post-objective:hover .po-icon {
        transform: scale(1.15) rotate(15deg);
        color: #6ee7b7;
        filter: drop-shadow(0 0 25px rgba(52, 211, 153, 0.6));
      }
      .po-content h4 {
        font-size: 1.5rem;
        font-weight: 800;
        color: white;
        margin-bottom: 1rem;
        font-family: 'Outfit', sans-serif;
      }
      .po-content p {
        color: rgba(255, 255, 255, 0.9);
        font-size: 1.0625rem;
        line-height: 1.8;
      }
      .highlight-text {
        color: #34d399;
      }

      /* VALUE ADDED */
      .value-bento {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      @media (min-width: 768px) {
        .value-bento {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (min-width: 1024px) {
        .value-bento {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
        }
        .value-item {
          flex: 1 1 calc(33.333% - 1.5rem);
          max-width: calc(33.333% - 0.5rem);
        }
      }

      .value-item {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        background: white;
        border-radius: 24px;
        padding: 2rem;
        border: 1px solid rgba(16, 185, 129, 0.1);
        transition: all 0.4s ease;
      }

      .value-item:hover {
        box-shadow: 0 16px 32px rgba(16, 185, 129, 0.08);
        border-color: rgba(16, 185, 129, 0.3);
        transform: translateY(-6px);
      }

      .vi-icon-box {
        width: 60px;
        height: 60px;
        min-width: 60px;
        border-radius: 16px;
        background: #ecfdf5;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.4s ease;
      }
      .vi-icon {
        font-size: 2.2rem;
        color: #10b981;
        transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .value-item:hover .vi-icon-box {
        background: #10b981;
        transform: rotate(5deg) scale(1.05);
      }
      .value-item:hover .vi-icon {
        color: white;
      }

      .vi-content h4 {
        font-size: 1.125rem;
        font-weight: 800;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }
      .vi-content p {
        font-size: 0.95rem;
        color: #6b7280;
        line-height: 1.6;
      }

      .feedin-green-text {
        color: #10b981;
      }

      /* CTA */
      .cta-section {
        background: #f8faf8;
      }

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
        background-image: url('/assets/images/pic4.jpg');
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

      .btn-primary.btn-glow {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.75rem;
        padding: 0.875rem 2rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        font-weight: 700;
        font-size: 0.9375rem;
        border-radius: 100px;
        border: none;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.2);
      }
      .btn-primary.btn-glow:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.4);
      }
      .icon-nav {
        transition: transform 0.3s ease;
      }
      .btn-primary.btn-glow:hover .icon-nav {
        transform: translateX(4px);
      }

      .btn-secondary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0.875rem 2rem;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        text-decoration: none;
        transition: all 0.3s ease;
      }
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-2px);
      }

      /* Animation CSS */
      .fade-in {
        opacity: 0;
        transform: translateY(30px);
        transition:
          opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1),
          transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      }
      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `,
  ],
})
export class FormationComponent implements OnInit {
  private router = inject(Router);
  private seoService = inject(SeoService);

  drawerOpen = signal(false);

  heroStats = [
    { value: '3', label: 'landing.formation.stats.0.label' },
    { value: '100%', label: 'landing.formation.stats.1.label' },
    { value: '∞', label: 'landing.formation.stats.2.label' },
  ];

  objectives = [
    'landing.formation.obj.0',
    'landing.formation.obj.1',
    'landing.formation.obj.2',
    'landing.formation.obj.3',
    'landing.formation.obj.4',
  ];

  trainings = [
    {
      icon: 'construction',
      badge: 'landing.formation.trainings.0.badge',
      title: 'landing.formation.trainings.0.title',
      desc: 'landing.formation.trainings.0.desc',
      modules: [
        'landing.formation.trainings.0.modules.0',
        'landing.formation.trainings.0.modules.1',
        'landing.formation.trainings.0.modules.2',
        'landing.formation.trainings.0.modules.3',
        'landing.formation.trainings.0.modules.4',
      ],
      duration: 'landing.formation.trainings.0.duration',
    },
    {
      icon: 'location_city',
      badge: 'landing.formation.trainings.1.badge',
      title: 'landing.formation.trainings.1.title',
      desc: 'landing.formation.trainings.1.desc',
      modules: [
        'landing.formation.trainings.1.modules.0',
        'landing.formation.trainings.1.modules.1',
        'landing.formation.trainings.1.modules.2',
        'landing.formation.trainings.1.modules.3',
        'landing.formation.trainings.1.modules.4',
      ],
      duration: 'landing.formation.trainings.1.duration',
    },
    {
      icon: 'engineering',
      badge: 'landing.formation.trainings.2.badge',
      title: 'landing.formation.trainings.2.title',
      desc: 'landing.formation.trainings.2.desc',
      modules: [
        'landing.formation.trainings.2.modules.0',
        'landing.formation.trainings.2.modules.1',
        'landing.formation.trainings.2.modules.2',
        'landing.formation.trainings.2.modules.3',
        'landing.formation.trainings.2.modules.4',
      ],
      duration: 'landing.formation.trainings.2.duration',
    },
  ];

  postFormation = [
    {
      icon: 'phone',
      title: 'landing.formation.post.items.0.title',
      desc: 'landing.formation.post.items.0.desc',
    },
    {
      icon: 'laptop_chromebook',
      title: 'landing.formation.post.items.1.title',
      desc: 'landing.formation.post.items.1.desc',
    },
    {
      icon: 'bar_chart',
      title: 'landing.formation.post.items.2.title',
      desc: 'landing.formation.post.items.2.desc',
    },
    {
      icon: 'my_location',
      title: 'landing.formation.post.items.3.title',
      desc: 'landing.formation.post.items.3.desc',
    },
  ];

  valueAdded = [
    {
      icon: 'grass',
      title: 'landing.formation.valueAdded.0.title',
      desc: 'landing.formation.valueAdded.0.desc',
    },
    {
      icon: 'school',
      title: 'landing.formation.valueAdded.1.title',
      desc: 'landing.formation.valueAdded.1.desc',
    },
    {
      icon: 'menu_book',
      title: 'landing.formation.valueAdded.2.title',
      desc: 'landing.formation.valueAdded.2.desc',
    },
    {
      icon: 'sync',
      title: 'landing.formation.valueAdded.3.title',
      desc: 'landing.formation.valueAdded.3.desc',
    },
    {
      icon: 'handshake',
      title: 'landing.formation.valueAdded.4.title',
      desc: 'landing.formation.valueAdded.4.desc',
    },
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // SEO — Formation page meta tags
    this.seoService.setMeta({
      title: 'Formation Agriculture Intelligente | Feedin Green — Programmes de Formation',
      description:
        'Programmes de formation Feedin Green : maîtrisez les technologies IoT agricoles, ' +
        "la gestion des serres connectées et l'analyse de données pour votre exploitation.",
      keywords:
        'formation agriculture, formation IoT agricole, cours agriculture intelligente, ' +
        'feedin green formation, apprentissage smart farming, formation serre connectée tunisie',
      url: 'https://feedingreen.com/formation',
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
   * Open the Training Request Drawer.
   */
  openDrawer(): void {
    this.drawerOpen.set(true);
  }

  /**
   * Close the Training Request Drawer.
   */
  closeDrawer(): void {
    this.drawerOpen.set(false);
  }
}
