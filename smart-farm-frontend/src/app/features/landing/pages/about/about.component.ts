import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { LandingFooterComponent } from '../../sections/landing-footer/landing-footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';
import { SeoService } from '../../../../core/services/seo.service';

@Component({
  selector: 'app-about',
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

      <!-- Hero Band -->
      <header class="page-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="page-label">{{ 'landing.about.hero.label' | translate }}</span>
          <h1 [innerHTML]="'landing.about.hero.title' | translate"></h1>
          <p class="hero-sub">{{ 'landing.about.hero.sub' | translate }}</p>
        </div>
      </header>

      <main class="page-main">
        <!-- WHO WE ARE -->
        <section class="section who-section">
          <div class="container">
            <div class="two-col fade-in">
              <div class="col-text">
                <span class="section-label">{{ 'landing.about.who.label' | translate }}</span>
                <h2>{{ 'landing.about.who.title' | translate }}</h2>
                <div [innerHTML]="'landing.about.who.content' | translate"></div>
              </div>
              <div class="col-visual fade-in">
                <div class="stat-grid">
                  <div class="stat-card premium group" *ngFor="let s of stats">
                    <div class="stat-glow"></div>
                    <div class="stat-content">
                      <div class="stat-icon material-icons">{{ s.icon }}</div>
                      <div class="stat-number">{{ s.value }}</div>
                      <div class="stat-label">{{ s.label | translate }}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- MISSION VISION -->
        <section class="section mv-section">
          <div class="container">
            <div class="mv-bento-grid fade-in">
              <!-- Mission Text -->
              <div class="mv-card text-card mission">
                <div class="card-glass"></div>
                <div class="content-wrapper">
                  <div class="mv-icon material-icons">my_location</div>
                  <h3>{{ 'landing.about.mv.mission.title' | translate }}</h3>
                  <div
                    class="mv-desc"
                    [innerHTML]="'landing.about.mv.mission.content' | translate"
                  ></div>
                </div>
              </div>

              <!-- Image 1 -->
              <div class="mv-card img-card">
                <img src="assets/landing/images/agri-ai.jpg" alt="Agritech AI" />
                <div class="img-overlay"></div>
              </div>

              <!-- Image 2 -->
              <div class="mv-card img-card">
                <img src="assets/landing/images/serre.jpg" alt="Smart Greenhouse" />
                <div class="img-overlay"></div>
              </div>

              <!-- Vision Text -->
              <div class="mv-card text-card vision">
                <div class="card-glass"></div>
                <div class="content-wrapper">
                  <div class="mv-icon material-icons">travel_explore</div>
                  <h3>{{ 'landing.about.mv.vision.title' | translate }}</h3>
                  <p class="mv-desc">{{ 'landing.about.mv.vision.desc' | translate }}</p>
                  <p class="vision-intro">{{ 'landing.about.mv.vision.intro' | translate }}</p>
                  <ul class="vision-list">
                    <li>
                      <span class="material-icons inline-icon">data_exploration</span>
                      {{ 'landing.about.mv.vision.list.0' | translate }}
                    </li>
                    <li>
                      <span class="material-icons inline-icon">eco</span>
                      {{ 'landing.about.mv.vision.list.1' | translate }}
                    </li>
                    <li>
                      <span class="material-icons inline-icon">location_city</span>
                      {{ 'landing.about.mv.vision.list.2' | translate }}
                    </li>
                    <li>
                      <span class="material-icons inline-icon">groups</span>
                      {{ 'landing.about.mv.vision.list.3' | translate }}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- OUR APPROACH -->
        <section class="section approach-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.about.approach.label' | translate }}</span>
              <h2>{{ 'landing.about.approach.title' | translate }}</h2>
              <p class="section-sub">{{ 'landing.about.approach.sub' | translate }}</p>
            </div>
            <div class="steps-track">
              <div class="step-item" *ngFor="let step of approachSteps; let i = index">
                <div class="step-number">{{ i + 1 }}</div>
                <div class="step-body">
                  <h4>{{ step.title | translate }}</h4>
                  <p>{{ step.desc | translate }}</p>
                </div>
                <div class="step-connector" *ngIf="i < approachSteps.length - 1"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- VALUES -->
        <section class="section values-section">
          <div class="container fade-in">
            <div class="values-premium-card">
              <div class="values-card-left">
                <span class="section-label-light">{{
                  'landing.about.values.label' | translate
                }}</span>
                <h2>{{ 'landing.about.values.title' | translate }}</h2>
              </div>
              <div class="values-card-right">
                <div class="value-cell" *ngFor="let v of values">
                  <div class="value-icon material-icons">{{ v.icon }}</div>
                  <div class="value-text">
                    <h4>{{ v.title | translate }}</h4>
                    <p>{{ v.desc | translate }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- EXPERTISE -->
        <section class="section expertise-section">
          <div class="container fade-in">
            <div class="section-header center" style="margin-bottom: 3.5rem;">
              <span class="section-label">{{ 'landing.about.expertise.label' | translate }}</span>
              <h2>{{ 'landing.about.expertise.title' | translate }}</h2>
            </div>
            <div class="expertise-bento-grid">
              <div
                class="expertise-card fade-in"
                *ngFor="let e of expertise"
                [style.transition-delay]="'0.1s'"
              >
                <div class="exp-icon material-icons">{{ e.icon }}</div>
                <div class="exp-content">
                  <h4>{{ e.title | translate }}</h4>
                  <p>{{ e.desc | translate }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- TRUST / CONFIANCE -->
        <section class="section trust-section">
          <div class="container">
            <div class="trust-banner fade-in">
              <div class="trust-content-wrapper">
                <div class="trust-text">
                  <h2>{{ 'landing.about.trust.title' | translate }}</h2>
                  <div [innerHTML]="'landing.about.trust.content' | translate"></div>
                </div>
                <div class="trust-cta">
                  <a (click)="goToContactRegister()" class="btn-primary" style="cursor:pointer">{{
                    'landing.about.trust.cta1' | translate
                  }}</a>
                  <a routerLink="/services" class="btn-secondary">{{
                    'landing.about.trust.cta2' | translate
                  }}</a>
                </div>
              </div>
              <div class="trust-image">
                <img src="assets/landing/images/mission.jpg" alt="Feedin Green Community" />
                <div class="trust-image-overlay"></div>
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
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap');

      .page-wrapper {
        min-height: 100vh;
        background: #f8faf8;
        font-family: 'Inter', 'Roboto', system-ui, sans-serif;
      }

      /* ---- HERO ---- */
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
        background-image: url('/assets/images/pic1.jpg');
        background-size: cover;
        background-position: center;
        opacity: 0.8;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(5, 41, 82, 0.65) 0%, rgba(10, 74, 46, 0.55) 100%);
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
        font-size: 1.0625rem;
        color: rgba(255, 255, 255, 0.75);
        max-width: 560px;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* ---- LAYOUT ---- */
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

      .section:nth-child(even) {
        background: white;
      }

      .section-header.center {
        text-align: center;
        margin-bottom: 3rem;
      }

      .section-label {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: var(--primary-green);
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

      /* ---- WHO WE ARE ---- */
      .who-section {
        background: white;
      }

      .two-col {
        display: grid;
        grid-template-columns: 1fr;
        gap: 3rem;
        align-items: center;
      }

      .two-col.gap-lg {
        gap: 4rem;
      }

      @media (min-width: 1024px) {
        .two-col {
          grid-template-columns: 1fr 1fr;
        }
        .col-text {
          text-align: left;
        }
        .col-text p {
          margin-left: 0;
          margin-right: 0;
        }
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

      .stat-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        justify-content: center;
      }

      .stat-card.premium {
        position: relative;
        background: rgba(255, 255, 255, 0.8);
        -webkit-backdrop-filter: blur(16px);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 1);
        border-radius: 20px;
        padding: 2rem 1.5rem;
        text-align: left;
        box-shadow: 0 10px 30px -10px rgba(16, 185, 129, 0.15);
        overflow: hidden;
        transition:
          transform 0.4s cubic-bezier(0.4, 0, 0.2, 1),
          box-shadow 0.4s ease;
      }

      .stat-card.premium .stat-glow {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: radial-gradient(
          circle at 100% 0%,
          rgba(16, 185, 129, 0.15) 0%,
          transparent 60%
        );
        opacity: 0;
        transition: opacity 0.4s ease;
      }

      .stat-card.premium:hover {
        transform: translateY(-5px);
        box-shadow: 0 20px 40px -15px rgba(16, 185, 129, 0.25);
      }

      .stat-card.premium:hover .stat-glow {
        opacity: 1;
      }

      .stat-content {
        position: relative;
        z-index: 2;
      }

      .stat-icon {
        font-size: 2.25rem;
        margin-bottom: 1.25rem;
        color: #10b981;
        background: linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(5, 150, 105, 0.05));
        padding: 0.875rem;
        border-radius: 14px;
        display: inline-flex;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      }

      .stat-card.premium:hover .stat-icon {
        transform: scale(1.1) rotate(5deg);
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
      }

      .stat-number {
        font-family: 'Outfit', sans-serif;
        font-size: 2.5rem;
        font-weight: 800;
        color: #052952;
        line-height: 1.1;
        margin-bottom: 0.25rem;
      }

      .stat-label {
        font-size: 0.9375rem;
        font-weight: 500;
        color: #6b7280;
        line-height: 1.4;
      }

      /* ---- MISSION VISION BENTO ---- */
      .mv-section {
        background: #f8faf8;
        padding-top: 2rem;
      }

      .mv-bento-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.5rem;
      }

      @media (min-width: 768px) {
        .mv-bento-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .mv-card {
        position: relative;
        border-radius: 24px;
        overflow: hidden;
      }

      .mv-card.text-card {
        background: white;
        padding: 3rem 2.5rem;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.04);
        border: 1px solid rgba(16, 185, 129, 0.1);
        display: flex;
        flex-direction: column;
        justify-content: center;
      }

      .mv-card.img-card {
        min-height: 350px;
        box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
      }

      .mv-card.img-card img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.6s ease;
      }

      .mv-card.img-card:hover img {
        transform: scale(1.05);
      }

      .img-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(5, 41, 82, 0.4), transparent);
        pointer-events: none;
      }

      .card-glass {
        position: absolute;
        top: 0;
        right: 0;
        width: 150px;
        height: 150px;
        background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
        pointer-events: none;
      }

      .content-wrapper {
        position: relative;
        z-index: 2;
      }

      .mv-icon {
        font-size: 2.5rem;
        margin-bottom: 1.5rem;
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
        padding: 1rem;
        border-radius: 16px;
        display: inline-flex;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);
      }

      .mv-card h3 {
        font-size: 1.75rem;
        font-weight: 800;
        color: #052952;
        margin-bottom: 1.25rem;
        font-family: 'Outfit', sans-serif;
      }

      .mv-desc {
        color: #4b5563;
        line-height: 1.7;
        font-size: 1.0625rem;
        margin-bottom: 1.5rem;
      }

      .vision-intro {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 1rem;
        font-size: 1.0625rem;
      }

      .vision-list {
        list-style: none;
        padding: 0;
        margin: 0;
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
      }

      .vision-list li {
        display: flex;
        align-items: center;
        color: #374151;
        font-size: 1rem;
        font-weight: 500;
      }

      .vision-list li .inline-icon {
        color: #10b981;
        background: rgba(16, 185, 129, 0.1);
        border-radius: 50%;
        padding: 0.4rem;
        font-size: 1.2rem;
        margin-right: 0.75rem;
      }

      /* ---- APPROACH ---- */
      .approach-section {
        background: white;
      }

      .steps-track {
        display: flex;
        flex-direction: column;
        gap: 0;
        position: relative;
        max-width: 800px;
        margin: 0 auto;
      }

      .step-item {
        display: flex;
        align-items: flex-start;
        gap: 1.5rem;
        position: relative;
        padding-bottom: 2rem;
      }

      .step-number {
        width: 48px;
        height: 48px;
        min-width: 48px;
        border-radius: 50%;
        background: linear-gradient(135deg, #10b981, #059669);
        color: white;
        font-size: 1.125rem;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        position: relative;
        z-index: 1;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.5);
        transition: all 0.3s ease;
      }
      .step-item:hover .step-number {
        transform: scale(1.1);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
      }

      .step-body h4 {
        font-size: 1.125rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 0.5rem;
        padding-top: 0.625rem;
      }

      .step-body p {
        color: #6b7280;
        line-height: 1.6;
      }

      .step-connector {
        position: absolute;
        left: 23px;
        top: 48px;
        width: 2px;
        height: calc(100% - 48px);
        background: linear-gradient(180deg, rgba(16, 185, 129, 0.4), rgba(16, 185, 129, 0.1));
      }

      /* ---- VALUES ---- */
      .values-section {
        background: #f8faf8;
        padding: 5rem 0 7rem;
      }

      .values-premium-card {
        background: #ffffff;
        border-radius: 32px;
        box-shadow: 0 24px 50px -12px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }

      @media (min-width: 992px) {
        .values-premium-card {
          flex-direction: row;
        }
      }

      .values-card-left {
        background:
          linear-gradient(135deg, rgba(16, 185, 129, 0.85), rgba(5, 150, 105, 0.95)),
          url('/assets/landing/images/urban-farming.jpg') center/cover no-repeat;
        color: white;
        padding: 4rem 3rem;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        position: relative;
        overflow: hidden;
      }

      .values-card-left::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 60%);
        pointer-events: none;
      }

      .section-label-light {
        font-size: 0.8125rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 2px;
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.2);
        padding: 0.5rem 1rem;
        border-radius: 100px;
        border: 1px solid rgba(255, 255, 255, 0.3);
        display: inline-block;
        margin-bottom: 1rem;
      }

      .values-card-left h2 {
        color: white;
        font-size: 2.75rem;
        font-weight: 800;
        font-family: 'Outfit', sans-serif;
        line-height: 1.2;
        margin: 0;
        position: relative;
        z-index: 2;
      }

      .values-card-right {
        flex: 1.8;
        padding: 4rem 3rem;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2.5rem;
        background: white;
      }

      @media (min-width: 640px) {
        .values-card-right {
          grid-template-columns: 1fr 1fr;
        }
      }

      .value-cell {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        transition: transform 0.3s ease;
      }

      .value-cell:hover {
        transform: translateY(-5px);
      }

      .value-cell .value-icon {
        font-size: 2rem;
        color: var(--primary-green);
        background: #f0fdf4;
        width: 64px;
        height: 64px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 16px;
        margin-bottom: 1.25rem;
        box-shadow: 0 4px 10px rgba(16, 185, 129, 0.05);
        transition: all 0.3s ease;
      }

      .value-cell:hover .value-icon {
        background: var(--primary-green);
        color: white;
        transform: scale(1.05) rotate(5deg);
        box-shadow: 0 8px 20px rgba(16, 185, 129, 0.2);
      }

      .value-cell h4 {
        font-size: 1.25rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 0.5rem;
        font-family: inherit;
      }

      .value-cell p {
        font-size: 0.9375rem;
        color: #6b7280;
        line-height: 1.6;
        margin: 0;
      }

      /* ---- EXPERTISE ---- */
      .expertise-section {
        background: white;
        padding: 5rem 0;
      }

      .expertise-bento-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
        gap: 1.5rem;
        max-width: 1100px;
        margin: 0 auto;
      }

      .expertise-card {
        background: #ffffff;
        border: 1px solid #f3f4f6;
        border-radius: 20px;
        padding: 2rem;
        display: flex;
        align-items: flex-start;
        gap: 1.25rem;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow:
          0 4px 6px -1px rgba(0, 0, 0, 0.05),
          0 2px 4px -1px rgba(0, 0, 0, 0.03);
      }

      .expertise-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.08);
        border-color: #e5e7eb;
      }

      .exp-icon {
        font-size: 2rem;
        color: var(--primary-green);
        background: #f0fdf4;
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        transition: all 0.3s ease;
      }

      .expertise-card:hover .exp-icon {
        background: var(--primary-green);
        color: white;
        transform: scale(1.1) rotate(5deg);
        box-shadow: 0 8px 15px rgba(16, 185, 129, 0.25);
      }

      .exp-content h4 {
        font-size: 1.125rem;
        font-weight: 800;
        color: #111827;
        margin-bottom: 0.5rem;
        font-family: inherit;
        line-height: 1.3;
      }

      .exp-content p {
        font-size: 0.9375rem;
        color: #6b7280;
        line-height: 1.6;
        margin: 0;
      }

      /* ---- TRUST / CTA ---- */
      .trust-section {
        background: #f8faf8;
        padding-bottom: 6rem;
      }

      .trust-banner {
        position: relative;
        background: white;
        border-radius: 28px;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.08);
        border: 1px solid rgba(16, 185, 129, 0.1);
      }

      @media (min-width: 992px) {
        .trust-banner {
          flex-direction: row;
        }
      }

      .trust-content-wrapper {
        flex: 1;
        padding: 4rem 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2rem;
        z-index: 2;
        background: linear-gradient(135deg, white 60%, rgba(255, 255, 255, 0.8));
      }

      .trust-image {
        position: relative;
        flex: 1;
        min-height: 350px;
      }

      .trust-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .trust-image-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to right, white, transparent 30%);
      }

      @media (max-width: 991px) {
        .trust-image-overlay {
          background: linear-gradient(to bottom, white, transparent 30%);
        }
      }

      .trust-text h2 {
        color: #1f2937;
        margin-bottom: 1rem;
        font-size: 2rem;
        font-weight: 800;
        font-family: 'Outfit', sans-serif;
      }

      .trust-text p {
        color: #4b5563;
        font-size: 1.0625rem;
        line-height: 1.7;
        max-width: 520px;
      }

      .trust-cta {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: center;
      }

      .btn-primary {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: var(--primary-green);
        color: white;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        text-decoration: none;
        transition: all 0.25s ease;
        text-align: center;
      }

      .btn-primary:hover {
        background: #059669;
        box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
        transform: translateY(-2px);
      }

      .btn-secondary {
        display: inline-block;
        padding: 0.875rem 2rem;
        background: transparent;
        color: #1f2937;
        font-weight: 600;
        font-size: 0.9375rem;
        border-radius: 100px;
        border: 2px solid rgba(0, 0, 0, 0.15);
        text-decoration: none;
        transition: all 0.25s ease;
        text-align: center;
      }

      .btn-secondary:hover {
        border-color: var(--primary-green);
        color: var(--primary-green);
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
      .inline-icon {
        font-size: 1.1em;
        vertical-align: bottom;
        margin-right: 0.25rem;
      }
    `,
  ],
})
export class AboutComponent implements OnInit {
  private router = inject(Router);
  private seoService = inject(SeoService);

  stats = [
    { icon: 'domain', value: '150+', label: 'landing.about.stats.0' },
    { icon: 'landscape', value: '500+', label: 'landing.about.stats.1' },
    { icon: 'handshake', value: '50+', label: 'landing.about.stats.2' },
    { icon: 'verified', value: '99%', label: 'landing.about.stats.3' },
  ];

  approachSteps = [
    { title: 'landing.about.steps.0.title', desc: 'landing.about.steps.0.desc' },
    { title: 'landing.about.steps.1.title', desc: 'landing.about.steps.1.desc' },
    { title: 'landing.about.steps.2.title', desc: 'landing.about.steps.2.desc' },
    { title: 'landing.about.steps.3.title', desc: 'landing.about.steps.3.desc' },
  ];

  values = [
    {
      icon: 'tips_and_updates',
      title: 'landing.about.valuesItem.0.title',
      desc: 'landing.about.valuesItem.0.desc',
    },
    {
      icon: 'recycling',
      title: 'landing.about.valuesItem.1.title',
      desc: 'landing.about.valuesItem.1.desc',
    },
    {
      icon: 'handshake',
      title: 'landing.about.valuesItem.2.title',
      desc: 'landing.about.valuesItem.2.desc',
    },
    {
      icon: 'done_all',
      title: 'landing.about.valuesItem.3.title',
      desc: 'landing.about.valuesItem.3.desc',
    },
  ];

  expertise = [
    {
      icon: 'memory',
      title: 'landing.about.expertiseItems.0.title',
      desc: 'landing.about.expertiseItems.0.desc',
    },
    {
      icon: 'water_drop',
      title: 'landing.about.expertiseItems.1.title',
      desc: 'landing.about.expertiseItems.1.desc',
    },
    {
      icon: 'analytics',
      title: 'landing.about.expertiseItems.2.title',
      desc: 'landing.about.expertiseItems.2.desc',
    },
    {
      icon: 'layers',
      title: 'landing.about.expertiseItems.3.title',
      desc: 'landing.about.expertiseItems.3.desc',
    },
    {
      icon: 'solar_power',
      title: 'landing.about.expertiseItems.4.title',
      desc: 'landing.about.expertiseItems.4.desc',
    },
    {
      icon: 'engineering',
      title: 'landing.about.expertiseItems.5.title',
      desc: 'landing.about.expertiseItems.5.desc',
    },
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // SEO — About page meta tags
    this.seoService.setMeta({
      title: 'À Propos de Feedin Green | Agriculture Intelligente en Tunisie',
      description:
        'Découvrez Feedin Green : notre mission, notre vision et notre approche pour transformer ' +
        "l'agriculture tunisienne grâce à l'IoT et aux technologies intelligentes.",
      keywords:
        'feedin green, à propos, agriculture intelligente tunisie, mission feedin, ' +
        'IoT agricole, smart farm tunisie, agritech startup',
      url: 'https://feedingreen.com/about',
    });

    // Setup intersection observer for fade-in
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

  ngOnDestroy(): void {}

  /**
   * Navigate to the contact page with the 'register' (Demander un accès) tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}
