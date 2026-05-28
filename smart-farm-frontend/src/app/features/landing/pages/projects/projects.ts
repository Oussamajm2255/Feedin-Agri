/**
 * ProjectsComponent
 *
 * Premium "Our Projects" showcase page for the public landing site.
 * Standalone Angular component with inline template + styles.
 *
 * Sections:
 *  1. Hero — full-width with gradient overlay, stats ribbon, 2 CTAs
 *  2. Featured Project — 2-column layout with image + content
 *  3. Project Grid — responsive 3/2/1 column card grid
 *  4. Process — horizontal 5-step workflow
 *  5. Testimonial — centered single-quote block
 *  6. Final CTA — conversion section with 2 buttons
 *
 * i18n namespace: landing.projects.*
 */
import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-projects',
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

      <!-- ═══════════════════════════════════════════
           1. HERO SECTION
           ═══════════════════════════════════════════ -->
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
          <span class="page-label">{{ 'landing.projects.hero.label' | translate }}</span>
          <h1>
            {{ 'landing.projects.hero.title1' | translate }}
            <span class="accent">{{ 'landing.projects.hero.title2' | translate }}</span>
          </h1>
          <p class="hero-sub">{{ 'landing.projects.hero.sub' | translate }}</p>

          <div class="hero-actions">
            <a
              class="btn-primary"
              (click)="scrollToSection('projects-grid')"
              style="cursor:pointer"
            >
              {{ 'landing.projects.hero.cta1' | translate }}
            </a>
            <a class="btn-secondary-hero" (click)="goToContactRegister()" style="cursor:pointer">
              {{ 'landing.projects.hero.cta2' | translate }}
            </a>
          </div>

          <!-- Stats ribbon -->
          <div class="hero-stats">
            <div class="hero-stat" *ngFor="let s of heroStats">
              <span class="hero-stat-value">{{ s.value }}</span>
              <span class="hero-stat-label">{{ s.label | translate }}</span>
            </div>
          </div>
        </div>
      </header>

      <main class="page-main">
        <!-- ═══════════════════════════════════════════
             2. FEATURED PROJECT
             ═══════════════════════════════════════════ -->
        <section class="section featured-section">
          <div class="container">
            <div class="featured-grid fade-in">
              <!-- Image side -->
              <div class="featured-image">
                <img
                  src="assets/landing/images/etude-projet-formation.png"
                  [alt]="'landing.projects.featured.imgAlt' | translate"
                  class="featured-img"
                />
              </div>
              <!-- Content side -->
              <div class="featured-content">
                <span class="featured-badge">{{
                  'landing.projects.featured.badge' | translate
                }}</span>
                <h2>{{ 'landing.projects.featured.title' | translate }}</h2>
                <p class="featured-desc">{{ 'landing.projects.featured.desc' | translate }}</p>
                <div class="featured-results">
                  <div class="result-item" *ngFor="let r of featuredResults">
                    <span class="result-value">{{ r.value }}</span>
                    <span class="result-label">{{ r.label | translate }}</span>
                  </div>
                </div>
                <a class="btn-primary" (click)="goToContactRegister()" style="cursor:pointer">
                  {{ 'landing.projects.featured.cta' | translate }}
                </a>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════
             3. PROJECT GRID
             ═══════════════════════════════════════════ -->
        <section class="section grid-section" id="projects-grid">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.projects.grid.label' | translate }}</span>
              <h2>{{ 'landing.projects.grid.title' | translate }}</h2>
              <p class="section-sub">{{ 'landing.projects.grid.sub' | translate }}</p>
            </div>

            <div class="projects-grid fade-in">
              <div class="project-card" *ngFor="let p of projects">
                <!-- Image -->
                <div class="card-image">
                  <img [src]="p.img" [alt]="p.title | translate" class="card-img" />
                  <span class="card-badge">{{ p.category | translate }}</span>
                </div>
                <!-- Content -->
                <div class="card-body">
                  <h3>{{ p.title | translate }}</h3>
                  <p class="card-desc">{{ p.desc | translate }}</p>
                  <div class="card-tags">
                    <span class="tag" *ngFor="let t of p.tags">{{ t | translate }}</span>
                  </div>
                  <a class="card-cta" (click)="goToContactRegister()" style="cursor:pointer">
                    {{ 'landing.projects.grid.cardCta' | translate }}
                    <span class="material-icons cta-arrow">arrow_forward</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════
             4. PROCESS SECTION
             ═══════════════════════════════════════════ -->
        <section class="section process-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.projects.process.label' | translate }}</span>
              <h2>{{ 'landing.projects.process.title' | translate }}</h2>
            </div>
            <div class="process-track fade-in">
              <div
                class="process-step"
                *ngFor="let step of processSteps; let i = index; let last = last"
              >
                <div class="step-dot">
                  <span class="material-icons">{{ step.icon }}</span>
                </div>
                <h4>{{ step.title | translate }}</h4>
                <p>{{ step.desc | translate }}</p>
                <div class="step-connector" *ngIf="!last"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════
             5. TESTIMONIAL
             ═══════════════════════════════════════════ -->
        <section class="section testimonial-section">
          <div class="container">
            <div class="testimonial-block fade-in">
              <span class="material-icons quote-icon">format_quote</span>
              <blockquote>{{ 'landing.projects.testimonial.quote' | translate }}</blockquote>
              <div class="testimonial-author">
                <strong>{{ 'landing.projects.testimonial.name' | translate }}</strong>
                <span>{{ 'landing.projects.testimonial.role' | translate }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════
             6. COMING SOON
             ═══════════════════════════════════════════ -->
        <section class="section coming-soon-section">
          <div class="container center" style="text-align: center;">
            <div class="hourglass-wrapper fade-in">
              <div class="hourglass"></div>
            </div>
            <div class="coming-soon-content fade-in">
              <h3>{{ 'landing.projects.soon.title' | translate }}</h3>
              <p>{{ 'landing.projects.soon.desc' | translate }}</p>
            </div>
          </div>
        </section>

        <!-- ═══════════════════════════════════════════
             7. FINAL CTA
             ═══════════════════════════════════════════ -->
        <section class="section cta-section">
          <div class="container">
            <div class="cta-box">
              <h2>{{ 'landing.projects.cta.title' | translate }}</h2>
              <p>{{ 'landing.projects.cta.desc' | translate }}</p>
              <div class="cta-actions">
                <a class="btn-primary" (click)="goToContactRegister()" style="cursor:pointer">
                  {{ 'landing.projects.cta.btn1' | translate }}
                </a>
                <a routerLink="/services" class="btn-secondary">
                  {{ 'landing.projects.cta.btn2' | translate }}
                </a>
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
      /* ════════════════════════════════════════════════
         GLOBAL PAGE
         ════════════════════════════════════════════════ */
      .page-wrapper {
        min-height: 100vh;
        min-height: 100dvh;
        background: #f8f7f4;
        font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      }

      .page-main {
        padding-bottom: 0;
      }

      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
      }

      .section {
        padding: 5rem 0;
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

      h2 {
        font-size: clamp(1.75rem, 4vw, 2.5rem);
        font-weight: 800;
        color: #1f2937;
        line-height: 1.2;
        margin-bottom: 1rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        letter-spacing: -0.02em;
      }

      .section-sub {
        color: #6b7280;
        font-size: 1.0625rem;
        max-width: 560px;
        margin: 0.75rem auto 0;
        line-height: 1.6;
      }

      /* ════════════════════════════════════════════════
         1. HERO
         ════════════════════════════════════════════════ */
      .page-hero {
        position: relative;
        min-height: 75vh;
        min-height: 75dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #052952 url('/assets/images/bg1.jpg') no-repeat center center;
        background-size: cover;
        overflow: hidden;
        padding-top: var(--nav-height, 80px);
      }

      .page-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background: rgba(5, 41, 82, 0.75);
        opacity: 1;
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
          rgba(248, 247, 244, 0) 0%,
          rgba(248, 247, 244, 0.4) 40%,
          rgba(248, 247, 244, 0.85) 75%,
          rgba(248, 247, 244, 1) 100%
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
        background: linear-gradient(
          160deg,
          rgba(5, 41, 82, 0.92) 0%,
          rgba(10, 74, 46, 0.85) 50%,
          rgba(5, 41, 82, 0.9) 100%
        );
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
        padding: 3rem 1.5rem 4rem;
        max-width: 800px;
      }

      .page-label {
        display: inline-block;
        background: rgba(16, 185, 129, 0.15);
        border: 1px solid rgba(16, 185, 129, 0.35);
        color: #6ee7b7;
        font-size: 0.8125rem;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        padding: 0.375rem 1.25rem;
        border-radius: 100px;
        margin-bottom: 1.5rem;
      }

      .hero-content h1 {
        font-size: clamp(2rem, 6vw, 3.5rem);
        font-weight: 800;
        color: white;
        line-height: 1.12;
        margin-bottom: 1.25rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
        letter-spacing: -0.02em;
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
        max-width: 580px;
        margin: 0 auto 2rem;
        line-height: 1.7;
        font-weight: 500; /* Medium weight for readability */
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.7); /* Deep text shadow */
      }

      .hero-actions {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        align-items: center;
        margin-bottom: 3rem;
      }
      @media (min-width: 480px) {
        .hero-actions {
          flex-direction: row;
          justify-content: center;
        }
      }

      .hero-stats {
        display: flex;
        flex-wrap: wrap;
        justify-content: center;
        gap: 2rem;
      }

      .hero-stat {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.25rem;
      }

      .hero-stat-value {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem; /* Slightly larger */
        font-weight: 800;
        color: #4ade80; /* Vibrant bright green for maximum visibility */
        line-height: 1;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
      }

      .hero-stat-label {
        font-size: 0.875rem; /* Slightly larger */
        color: #ffffff;
        font-weight: 600; /* Bolder text */
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.7);
      }

      /* ════════════════════════════════════════════════
         2. FEATURED PROJECT
         ════════════════════════════════════════════════ */
      .featured-section {
        background: white;
      }

      .featured-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        align-items: center;
      }
      @media (min-width: 768px) {
        .featured-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .featured-image {
        border-radius: 20px;
        overflow: hidden;
      }

      .featured-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        min-height: 380px;
        display: block;
        transition: transform 0.5s ease;
      }
      .featured-img:hover {
        transform: scale(1.02);
      }

      .featured-content {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
      }

      .featured-badge {
        display: inline-block;
        align-self: flex-start;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: #059669;
        background: #f0fdf4;
        border: 1px solid rgba(16, 185, 129, 0.2);
        border-radius: 100px;
        padding: 0.3rem 0.875rem;
      }

      .featured-desc {
        color: #4b5563;
        font-size: 1.0625rem;
        line-height: 1.7;
      }

      .featured-results {
        display: flex;
        flex-wrap: wrap;
        gap: 1.5rem;
        padding: 1.5rem 0;
        border-top: 1px solid #f3f4f6;
        border-bottom: 1px solid #f3f4f6;
      }

      .result-item {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .result-value {
        font-family: 'Outfit', sans-serif;
        font-size: 1.75rem;
        font-weight: 800;
        color: #10b981;
        line-height: 1;
      }

      .result-label {
        font-size: 0.8125rem;
        color: #6b7280;
        font-weight: 500;
      }

      /* ════════════════════════════════════════════════
         3. PROJECT GRID
         ════════════════════════════════════════════════ */
      .grid-section {
        background: #f8f7f4;
      }

      .projects-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }
      @media (min-width: 640px) {
        .projects-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }
      @media (min-width: 1024px) {
        .projects-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .project-card {
        background: white;
        border-radius: 20px;
        overflow: hidden;
        border: 1px solid rgba(16, 185, 129, 0.08);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .project-card:hover {
        transform: translateY(-8px);
        box-shadow:
          0 20px 40px rgba(16, 185, 129, 0.1),
          0 0 0 1px rgba(16, 185, 129, 0.15);
      }

      .card-image {
        position: relative;
        overflow: hidden;
      }

      .card-img {
        width: 100%;
        height: 200px;
        object-fit: cover;
        display: block;
        transition: transform 0.5s ease;
      }

      .project-card:hover .card-img {
        transform: scale(1.05);
      }

      .card-badge {
        position: absolute;
        top: 0.875rem;
        left: 0.875rem;
        font-size: 0.6875rem;
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: white;
        background: rgba(16, 185, 129, 0.85);
        backdrop-filter: blur(8px);
        border-radius: 100px;
        padding: 0.25rem 0.75rem;
      }

      .card-body {
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .card-body h3 {
        font-size: 1.0625rem;
        font-weight: 700;
        color: #1f2937;
        line-height: 1.3;
      }

      .card-desc {
        color: #6b7280;
        font-size: 0.9375rem;
        line-height: 1.55;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
        margin: 0;
      }

      .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
      }

      .tag {
        font-size: 0.6875rem;
        font-weight: 600;
        color: #059669;
        background: #f0fdf4;
        border-radius: 100px;
        padding: 0.1875rem 0.625rem;
        border: 1px solid rgba(16, 185, 129, 0.15);
      }

      .card-cta {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
        font-size: 0.875rem;
        font-weight: 600;
        color: #10b981;
        text-decoration: none;
        padding-top: 0.5rem;
        transition: all 0.25s ease;
        cursor: pointer;
      }

      .card-cta:hover {
        color: #059669;
        gap: 0.625rem;
      }

      .card-cta .cta-arrow {
        font-size: 1rem;
        transition: transform 0.25s ease;
      }

      .card-cta:hover .cta-arrow {
        transform: translateX(4px);
      }

      /* ════════════════════════════════════════════════
         4. PROCESS
         ════════════════════════════════════════════════ */
      .process-section {
        background: white;
      }

      .process-track {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
      }
      @media (min-width: 768px) {
        .process-track {
          grid-template-columns: repeat(5, 1fr);
          gap: 0;
        }
      }

      .process-step {
        text-align: center;
        position: relative;
        padding: 1.5rem 1rem;
        transition: all 0.3s ease;
      }

      .process-step:hover {
        transform: translateY(-4px);
      }

      .step-dot {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(5, 150, 105, 0.05));
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 1rem;
        transition: all 0.35s ease;
      }

      .step-dot .material-icons {
        font-size: 1.5rem;
        color: #10b981;
        transition: all 0.35s ease;
      }

      .process-step:hover .step-dot {
        background: linear-gradient(135deg, #10b981, #059669);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        transform: scale(1.1);
      }

      .process-step:hover .step-dot .material-icons {
        color: white;
      }

      .process-step h4 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
      }

      .process-step p {
        font-size: 0.8125rem;
        color: #6b7280;
        line-height: 1.5;
      }

      /* Horizontal connector between steps — desktop only */
      .step-connector {
        display: none;
      }
      @media (min-width: 768px) {
        .step-connector {
          display: block;
          position: absolute;
          top: calc(1.5rem + 28px);
          right: -50%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, rgba(16, 185, 129, 0.3), rgba(16, 185, 129, 0.08));
          z-index: 0;
        }
      }

      /* ════════════════════════════════════════════════
         5. TESTIMONIAL
         ════════════════════════════════════════════════ */
      .testimonial-section {
        background: linear-gradient(180deg, #f8f7f4 0%, #f0fdf4 100%);
      }

      .testimonial-block {
        max-width: 720px;
        margin: 0 auto;
        text-align: center;
        padding: 3rem 2rem;
        background: white;
        border-radius: 24px;
        border: 1px solid rgba(16, 185, 129, 0.1);
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
      }

      .quote-icon {
        font-size: 3rem;
        color: rgba(16, 185, 129, 0.25);
        margin-bottom: 1rem;
        display: block;
      }

      blockquote {
        font-size: 1.125rem;
        font-style: italic;
        color: #374151;
        line-height: 1.7;
        margin: 0 0 1.5rem;
        padding: 0;
        border: none;
      }

      .testimonial-author {
        display: flex;
        flex-direction: column;
        gap: 0.125rem;
      }

      .testimonial-author strong {
        font-size: 0.9375rem;
        color: #1f2937;
        font-weight: 700;
      }

      .testimonial-author span {
        font-size: 0.8125rem;
        color: #6b7280;
      }

      /* ════════════════════════════════════════════════
         6. COMING SOON
         ════════════════════════════════════════════════ */
      .coming-soon-section {
        background: #f0fdf4;
        border-top: 1px solid rgba(16, 185, 129, 0.1);
        border-bottom: 1px solid rgba(16, 185, 129, 0.1);
      }
      .hourglass-wrapper {
        margin-bottom: 2rem;
      }
      .hourglass {
        display: inline-block;
        position: relative;
        width: 80px;
        height: 80px;
      }
      .hourglass:after {
        content: ' ';
        display: block;
        border-radius: 50%;
        width: 0;
        height: 0;
        margin: 8px;
        box-sizing: border-box;
        border: 32px solid #10b981;
        border-color: #10b981 transparent #10b981 transparent;
        animation: hourglass-anim 1.2s infinite;
      }
      @keyframes hourglass-anim {
        0% {
          transform: rotate(0);
          animation-timing-function: cubic-bezier(0.55, 0.055, 0.675, 0.19);
        }
        50% {
          transform: rotate(900deg);
          animation-timing-function: cubic-bezier(0.215, 0.61, 0.355, 1);
        }
        100% {
          transform: rotate(1800deg);
        }
      }
      .coming-soon-content h3 {
        font-size: clamp(1.5rem, 3vw, 2rem);
        color: #065f46;
        margin-bottom: 1rem;
      }
      .coming-soon-content p {
        color: #064e3b;
        opacity: 0.8;
        font-size: 1.125rem;
        max-width: 600px;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* ════════════════════════════════════════════════
         7. FINAL CTA
         ════════════════════════════════════════════════ */
      .cta-section {
        background: #f8f7f4;
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
        background:
          radial-gradient(ellipse at 20% 50%, rgba(16, 185, 129, 0.2) 0%, transparent 50%),
          radial-gradient(ellipse at 80% 50%, rgba(52, 211, 153, 0.15) 0%, transparent 50%);
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
        line-height: 1.6;
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

      /* ════════════════════════════════════════════════
         SHARED BUTTONS
         ════════════════════════════════════════════════ */
      .btn-primary {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        text-decoration: none;
        transition: all 0.25s ease;
        border: none;
        cursor: pointer;
      }
      .btn-primary:hover {
        background: linear-gradient(135deg, #059669, #047857);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        transform: translateY(-2px);
      }
      .btn-primary:active {
        transform: scale(0.98);
      }

      .btn-secondary-hero {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: rgba(255, 255, 255, 0.08);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        border: 2px solid rgba(255, 255, 255, 0.25);
        text-decoration: none;
        transition: all 0.25s ease;
        cursor: pointer;
      }
      .btn-secondary-hero:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
      }

      .btn-secondary {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: rgba(255, 255, 255, 0.08);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        border: 2px solid rgba(255, 255, 255, 0.25);
        text-decoration: none;
        transition: all 0.25s ease;
      }
      .btn-secondary:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(255, 255, 255, 0.4);
      }

      /* ════════════════════════════════════════════════
         SCROLL ANIMATION
         ════════════════════════════════════════════════ */
      .fade-in {
        opacity: 0;
        transform: translateY(24px);
        transition:
          opacity 0.6s ease-out,
          transform 0.6s ease-out;
      }
      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* ════════════════════════════════════════════════
         MOBILE ADJUSTMENTS
         ════════════════════════════════════════════════ */
      @media (max-width: 639px) {
        .page-hero {
          min-height: 60vh;
          min-height: 60dvh;
        }
        .hero-content {
          padding: 2rem 1rem 3rem;
        }
        .hero-stats {
          gap: 1.25rem;
        }
        .hero-stat-value {
          font-size: 1.5rem;
        }
        .section {
          padding: 3.5rem 0;
        }
        .featured-img-placeholder {
          min-height: 260px;
        }
        .featured-results {
          gap: 1rem;
        }
        .result-value {
          font-size: 1.5rem;
        }
        .cta-box {
          padding: 3rem 1.5rem;
        }
        .testimonial-block {
          padding: 2rem 1.25rem;
        }
      }
    `,
  ],
})
export class ProjectsComponent implements OnInit {
  private router = inject(Router);
  private seoService = inject(SeoService);

  /** Hero micro-stats */
  heroStats = [
    { value: '50+', label: 'landing.projects.hero.stat1' },
    { value: '120+', label: 'landing.projects.hero.stat2' },
    { value: '15K+', label: 'landing.projects.hero.stat3' },
  ];

  /** Featured project results */
  featuredResults = [
    { value: '-40%', label: 'landing.projects.featured.r1' },
    { value: '+65%', label: 'landing.projects.featured.r2' },
    { value: '3x', label: 'landing.projects.featured.r3' },
  ];

  /** Project cards data */
  projects = [
    {
      img: '/assets/landing/images/serre.jpg',
      category: 'landing.projects.cards.0.category',
      title: 'landing.projects.cards.0.title',
      desc: 'landing.projects.cards.0.desc',
      tags: [
        'landing.projects.cards.0.tags.0',
        'landing.projects.cards.0.tags.1',
        'landing.projects.cards.0.tags.2',
      ],
    },
    {
      img: '/assets/landing/images/serre-agricole-connectee.png',
      category: 'landing.projects.cards.1.category',
      title: 'landing.projects.cards.1.title',
      desc: 'landing.projects.cards.1.desc',
      tags: [
        'landing.projects.cards.1.tags.0',
        'landing.projects.cards.1.tags.1',
        'landing.projects.cards.1.tags.2',
      ],
    },
    {
      img: '/assets/landing/images/dashboard-iot-capteurs.png',
      category: 'landing.projects.cards.2.category',
      title: 'landing.projects.cards.2.title',
      desc: 'landing.projects.cards.2.desc',
      tags: [
        'landing.projects.cards.2.tags.0',
        'landing.projects.cards.2.tags.1',
        'landing.projects.cards.2.tags.2',
      ],
    },
  ];

  /** Process steps */
  processSteps = [
    {
      icon: 'search',
      title: 'landing.projects.process.steps.0.title',
      desc: 'landing.projects.process.steps.0.desc',
    },
    {
      icon: 'draw',
      title: 'landing.projects.process.steps.1.title',
      desc: 'landing.projects.process.steps.1.desc',
    },
    {
      icon: 'code',
      title: 'landing.projects.process.steps.2.title',
      desc: 'landing.projects.process.steps.2.desc',
    },
    {
      icon: 'rocket_launch',
      title: 'landing.projects.process.steps.3.title',
      desc: 'landing.projects.process.steps.3.desc',
    },
    {
      icon: 'trending_up',
      title: 'landing.projects.process.steps.4.title',
      desc: 'landing.projects.process.steps.4.desc',
    },
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);

    this.seoService.setMeta({
      title: 'Nos Projets | Feedin Green — Réalisations & Impact Agricole',
      description:
        'Découvrez les projets réalisés par Feedin Green : serres connectées, systèmes IoT, ' +
        'irrigation intelligente et solutions agricoles innovantes en Tunisie et en Afrique.',
      keywords:
        'projets feedin, réalisations agriculture, serre connectée tunisie, IoT agricole, ' +
        'smart farming projects, irrigation intelligente, agriculture de précision',
      url: 'https://feedingreen.com/projets',
    });

    // Initialize scroll-triggered fade-in animations
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
   * Smooth-scroll to a section by element ID.
   */
  scrollToSection(id: string): void {
    const el = document.getElementById(id);
    if (el) {
      const offset = el.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: offset, behavior: 'smooth' });
    }
  }

  /**
   * Navigate to contact page with register tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}
