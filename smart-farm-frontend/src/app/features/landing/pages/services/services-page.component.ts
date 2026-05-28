import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-services',
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
          <span class="page-label">{{ 'landing.services.hero.label' | translate }}</span>
          <h1>
            {{ 'landing.services.hero.title1' | translate }}
            <span class="accent">{{ 'landing.services.hero.title2' | translate }}</span>
          </h1>
          <p class="hero-sub">{{ 'landing.services.hero.sub' | translate }}</p>
        </div>
      </header>

      <main class="page-main">
        <!-- Services Grid -->
        <section class="section services-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.services.grid.label' | translate }}</span>
              <h2>{{ 'landing.services.grid.title' | translate }}</h2>
              <p class="section-sub">
                {{ 'landing.services.grid.sub1' | translate }}
                <span class="jersey-10-regular">FEEDIN</span>
                {{ 'landing.services.grid.sub2' | translate }}
              </p>
            </div>

            <div class="services-list fade-in">
              <div class="service-card" *ngFor="let s of services; let i = index">
                <div class="service-card-main">
                  <div class="service-image" *ngIf="s.image">
                    <img [src]="s.image" [alt]="s.title | translate" loading="lazy" />
                    <div class="service-image-overlay"></div>
                  </div>
                  <div class="service-card-content">
                    <div class="service-meta">
                      <div class="service-tag-wrapper">
                        <span class="service-icon material-icons">{{ s.icon }}</span>
                        <span class="service-tag">{{ s.tag | translate }}</span>
                      </div>
                    </div>
                    
                    <h3>{{ s.title | translate }}</h3>
                    <p class="service-desc" [innerHTML]="s.desc | translate"></p>
                    
                    <div class="service-includes" *ngIf="s.includes">
                      <h5 class="includes-title">{{ s.includesTitle | translate }}</h5>
                      <div class="includes-grid">
                        <span class="include-item" *ngFor="let item of s.includes">
                          <span class="material-icons check-icon">check_circle</span>
                          {{ item | translate }}
                        </span>
                      </div>
                    </div>
                    
                    <p class="service-footer-text" *ngIf="s.footerText">
                      {{ s.footerText | translate }}
                    </p>
                    
                    <div class="service-actions">
                      <button (click)="goToContactRegister()" class="btn-action-primary">
                        {{ 'landing.services.cta.btn1' | translate }}
                        <span class="material-icons">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FOR FARMERS SECTION -->
        <section class="section farmers-section">
          <div class="container">
            <div class="fade-in" style="max-width: 800px; margin: 0 auto;">
              <div class="col-text">
                <span class="section-label">{{
                  'landing.services.farmers.label' | translate
                }}</span>
                <h2>{{ 'landing.services.farmers.title' | translate }}</h2>
                <p>
                  {{ 'landing.services.farmers.p1' | translate }}
                </p>
                <p>{{ 'landing.services.farmers.p2' | translate }}</p>
                <div class="farmer-benefits">
                  <div class="fb-item" *ngFor="let fb of farmerBenefits">
                    <div class="fb-icon material-icons">{{ fb.icon }}</div>
                    <div>
                      <h5>{{ fb.title | translate }}</h5>
                      <p>{{ fb.desc | translate }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- PROCESS -->
        <section class="section process-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.services.process.label' | translate }}</span>
              <h2>{{ 'landing.services.process.title' | translate }}</h2>
            </div>
            <div class="process-grid fade-in">
              <div class="process-step" *ngFor="let p of process; let i = index">
                <div class="ps-number">{{ i + 1 }}</div>
                <div class="ps-icon material-icons">{{ p.icon }}</div>
                <h4>{{ p.title | translate }}</h4>
                <p>{{ p.desc | translate }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="section cta-section">
          <div class="container">
            <div class="cta-box">
              <h2>{{ 'landing.services.cta.title' | translate }}</h2>
              <p>{{ 'landing.services.cta.desc' | translate }}</p>
              <div class="cta-actions">
                <a (click)="goToContactRegister()" class="btn-primary" style="cursor:pointer">{{
                  'landing.services.cta.btn1' | translate
                }}</a>
                <a routerLink="/projets" class="btn-secondary">{{
                  'landing.services.cta.btn2' | translate
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
        min-height: 50vh;
        min-height: 50dvh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #052952;
        overflow: hidden;
        padding-top: var(--nav-height);
      }

      .page-hero::before {
        content: '';
        position: absolute;
        inset: 0;
        background-image: url('/assets/images/greenhouse.jpg');
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
        background: linear-gradient(135deg, rgba(10, 74, 46, 0.65) 0%, rgba(5, 41, 82, 0.55) 100%);
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
        max-width: 600px;
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
      .services-section {
        background: white;
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

      .services-list {
        display: flex;
        flex-direction: column;
        gap: 2.5rem;
      }

      .service-card {
        background: rgba(255, 255, 255, 0.85);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(16, 185, 129, 0.15);
        border-radius: 28px;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      .service-card:hover {
        border-color: rgba(16, 185, 129, 0.4);
        box-shadow: 0 20px 40px rgba(16, 185, 129, 0.08);
        transform: translateY(-4px);
      }

      .service-card-main {
        display: flex;
        flex-direction: row;
        align-items: stretch;
      }

      .service-image {
        position: relative;
        width: 380px;
        min-width: 380px;
        overflow: hidden;
      }

      .service-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .service-card:hover .service-image img {
        transform: scale(1.08);
      }

      .service-image-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, rgba(16, 185, 129, 0) 60%, rgba(255, 255, 255, 0.85) 100%);
        pointer-events: none;
        transition: background 0.4s ease;
      }

      .service-card:hover .service-image-overlay {
        background: linear-gradient(to right, rgba(16, 185, 129, 0.05) 50%, rgba(255, 255, 255, 0.9) 100%);
      }

      .service-card-content {
        padding: 2.5rem;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        flex-grow: 1;
      }

      .service-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 1.25rem;
      }

      .service-tag-wrapper {
        display: flex;
        align-items: center;
        gap: 0.75rem;
      }

      .service-icon {
        font-size: 1.75rem;
        width: 44px;
        height: 44px;
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.1);
        transition: all 0.3s ease;
      }

      .service-card:hover .service-icon {
        transform: scale(1.1) rotate(-5deg);
        background: #10b981;
        color: white;
        box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
      }

      .service-tag {
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        color: #065f46;
        background: rgba(16, 185, 129, 0.12);
        border: 1px solid rgba(16, 185, 129, 0.25);
        border-radius: 100px;
        padding: 0.35rem 0.85rem;
      }

      .service-card h3 {
        font-size: 1.6rem;
        font-weight: 800;
        color: #111827;
        margin: 0 0 1rem;
        font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      }

      .service-desc {
        font-size: 1.05rem;
        color: #4b5563;
        line-height: 1.6;
        margin: 0 0 1.5rem;
      }

      .service-includes {
        margin-bottom: 1.5rem;
      }

      .service-includes .includes-title {
        font-size: 0.95rem;
        font-weight: 700;
        color: #374151;
        margin: 0 0 1.25rem;
        line-height: 1.5;
      }

      .service-footer-text {
        font-size: 0.95rem;
        line-height: 1.6;
        color: #065f46;
        background: rgba(16, 185, 129, 0.04);
        padding: 1rem 1.25rem;
        border-left: 4px solid #10b981;
        border-radius: 0 16px 16px 0;
        margin: 0 0 2rem;
        font-weight: 500;
      }

      body.rtl .service-footer-text {
        border-left: none;
        border-right: 4px solid #10b981;
        border-radius: 16px 0 0 16px;
      }

      .includes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        gap: 0.875rem;
      }

      .include-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        font-size: 0.9375rem;
        color: #374151;
        font-weight: 500;
      }

      .check-icon {
        font-size: 1.25rem;
        color: #10b981;
      }

      .service-benefits {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
      }

      .benefit-chip {
        font-size: 0.75rem;
        color: #059669;
        background: #f0fdf4;
        border-radius: 100px;
        padding: 0.25rem 0.625rem;
        font-weight: 500;
      }

      .service-actions {
        display: flex;
        align-items: center;
        gap: 1.25rem;
        margin-top: auto;
      }

      .btn-action-primary {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.85rem 1.75rem;
        background: #10b981;
        color: white;
        border: none;
        border-radius: 100px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 14px rgba(16, 185, 129, 0.25);
      }

      .btn-action-primary:hover {
        background: #059669;
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.35);
      }

      .btn-action-primary span {
        font-size: 1.125rem;
        transition: transform 0.3s ease;
      }

      .btn-action-primary:hover span {
        transform: translateX(3px);
      }

      .btn-action-secondary {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.85rem 1.75rem;
        background: #f3f4f6;
        color: #374151;
        border: 1px solid #e5e7eb;
        border-radius: 100px;
        font-size: 0.95rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
      }

      @media (max-width: 992px) {
        .service-card-main {
          flex-direction: column;
        }
        .service-image {
          width: 100%;
          min-width: 100%;
          height: 250px;
        }
        .service-image-overlay {
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0) 60%, rgba(255, 255, 255, 0.95) 100%);
        }
        .service-card:hover .service-image-overlay {
          background: linear-gradient(to bottom, rgba(16, 185, 129, 0.05) 50%, rgba(255, 255, 255, 0.95) 100%);
        }
        .service-card-content {
          padding: 1.75rem;
        }
        .service-card h3 {
          font-size: 1.4rem;
        }
        .service-actions {
          flex-direction: column;
          align-items: stretch;
        }
        .btn-action-primary {
          justify-content: center;
        }
      }

      /* Farmers Section */
      .farmers-section {
        background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%);
      }

      .col-text {
        text-align: center;
      }

      .col-text p {
        color: #4b5563;
        line-height: 1.7;
        margin-bottom: 1rem;
        font-size: 1.0625rem;
        margin-left: auto;
        margin-right: auto;
        max-width: 600px;
      }

      .farmer-benefits {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        margin-top: 2rem;
        max-width: 600px;
        margin-left: auto;
        margin-right: auto;
        text-align: left;
      }

      .fb-item {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
      }

      .fb-icon {
        font-size: 1.5rem;
        width: 44px;
        height: 44px;
        min-width: 44px;
        background: rgba(16, 185, 129, 0.1);
        color: #10b981;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);
        text-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
        transition: all 0.3s ease;
      }
      .fb-item:hover .fb-icon {
        transform: translateY(-2px) scale(1.05);
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        box-shadow: 0 6px 15px rgba(16, 185, 129, 0.3);
      }

      .fb-item h5 {
        font-size: 0.9375rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.25rem;
      }
      .fb-item p {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }

      /* Process */
      .process-section {
        background: white;
      }

      .process-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      @media (min-width: 768px) {
        .process-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .process-step {
        text-align: center;
        padding: 2rem;
        border-radius: 20px;
        background: #f8faf8;
        border: 1px solid rgba(16, 185, 129, 0.1);
        transition: all 0.3s ease;
      }

      .process-step:hover {
        background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
        transform: translateY(-4px);
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.1);
      }

      .ps-number {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 0.875rem;
        margin: 0 auto 0.75rem;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        position: relative;
        z-index: 1;
        transition: all 0.3s ease;
      }
      .process-step:hover .ps-number {
        transform: scale(1.1);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
      }

      .ps-icon {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: #10b981;
        text-shadow: 0 0 15px rgba(16, 185, 129, 0.4);
        transition: all 0.3s ease;
        display: inline-block;
      }
      .process-step:hover .ps-icon {
        transform: scale(1.1) translateY(-5px);
        text-shadow: 0 0 25px rgba(16, 185, 129, 0.6);
        color: #34d399;
      }

      .process-step h4 {
        font-size: 1.0625rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.625rem;
      }
      .process-step p {
        font-size: 0.9375rem;
        color: #6b7280;
        line-height: 1.6;
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
        background-image: url('/assets/landing/images/bg5.avif');
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
export class ServicesComponent implements OnInit {
  private router = inject(Router);
  private seoService = inject(SeoService);

  services = [
    {
      icon: 'eco',
      image: '/assets/images/services/service-0.png',
      tag: 'landing.services.services.0.tag',
      title: 'landing.services.services.0.title',
      desc: 'landing.services.services.0.desc',
      includesTitle: 'landing.services.services.0.includesTitle',
      includes: [
        'landing.services.services.0.includes.0',
        'landing.services.services.0.includes.1',
        'landing.services.services.0.includes.2',
        'landing.services.services.0.includes.3',
      ],
      footerText: 'landing.services.services.0.footerText',
    },
    {
      icon: 'memory',
      image: '/assets/images/services/service-1.png',
      tag: 'landing.services.services.1.tag',
      title: 'landing.services.services.1.title',
      desc: 'landing.services.services.1.desc',
      includesTitle: 'landing.services.services.1.includesTitle',
      includes: [
        'landing.services.services.1.includes.0',
        'landing.services.services.1.includes.1',
        'landing.services.services.1.includes.2',
        'landing.services.services.1.includes.3',
        'landing.services.services.1.includes.4',
      ],
      footerText: 'landing.services.services.1.footerText',
    },
    {
      icon: 'school',
      image: '/assets/images/services/service-2.png',
      tag: 'landing.services.services.2.tag',
      title: 'landing.services.services.2.title',
      desc: 'landing.services.services.2.desc',
      includesTitle: 'landing.services.services.2.includesTitle',
      includes: [
        'landing.services.services.2.includes.0',
        'landing.services.services.2.includes.1',
        'landing.services.services.2.includes.2',
        'landing.services.services.2.includes.3',
      ],
      footerText: 'landing.services.services.2.footerText',
    },
  ];

  farmerBenefits = [
    {
      icon: 'smartphone',
      title: 'landing.services.farmerBenefits.0.title',
      desc: 'landing.services.farmerBenefits.0.desc',
    },
    {
      icon: 'water_drop',
      title: 'landing.services.farmerBenefits.1.title',
      desc: 'landing.services.farmerBenefits.1.desc',
    },
    {
      icon: 'bar_chart',
      title: 'landing.services.farmerBenefits.2.title',
      desc: 'landing.services.farmerBenefits.2.desc',
    },
    {
      icon: 'support_agent',
      title: 'landing.services.farmerBenefits.3.title',
      desc: 'landing.services.farmerBenefits.3.desc',
    },
  ];

  metrics = [
    { label: 'landing.services.metrics.0.label', pct: '82%', val: '24°C' },
    { label: 'landing.services.metrics.1.label', pct: '65%', val: '65%' },
    { label: 'landing.services.metrics.2.label', pct: '45%', val: '450ppm' },
    { label: 'landing.services.metrics.3.label', pct: '91%', val: '+34%' },
  ];

  process = [
    {
      icon: 'search',
      title: 'landing.services.processSteps.0.title',
      desc: 'landing.services.processSteps.0.desc',
    },
    {
      icon: 'build',
      title: 'landing.services.processSteps.1.title',
      desc: 'landing.services.processSteps.1.desc',
    },
    {
      icon: 'trending_up',
      title: 'landing.services.processSteps.2.title',
      desc: 'landing.services.processSteps.2.desc',
    },
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // SEO — Services page meta tags
    this.seoService.setMeta({
      title: 'Nos Services | Feedin Green — Installation IoT & Serres Connectées',
      description:
        'Découvrez les services Feedin Green : installation de capteurs IoT, conception de serres connectées, ' +
        'maintenance prédictive et accompagnement technique pour votre exploitation agricole.',
      keywords:
        'services feedin, installation IoT agricole, serre connectée tunisie, capteurs sol, ' +
        'maintenance agriculture, smart farm services, accompagnement technique agricole',
      url: 'https://feedingreen.com/services',
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
