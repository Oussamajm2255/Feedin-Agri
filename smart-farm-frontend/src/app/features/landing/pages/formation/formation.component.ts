import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-formation',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavComponent, FooterComponent, ScrollToTopComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper">
      <app-public-nav></app-public-nav>

      <!-- Hero -->
      <header class="page-hero">
        <div class="hero-overlay"></div>
        <div class="hero-content">
          <span class="page-label">{{ 'landing.formation.hero.label' | translate }}</span>
          <h1>{{ 'landing.formation.hero.title1' | translate }} <span class="accent">{{ 'landing.formation.hero.title2' | translate }}</span></h1>
          <p class="hero-sub">{{ 'landing.formation.hero.sub' | translate }}</p>
        </div>
        <div class="hero-stats">
          <div class="hs-item" *ngFor="let s of heroStats">
            <div class="hs-value">{{s.value}}</div>
            <div class="hs-label">{{s.label | translate}}</div>
          </div>
        </div>
      </header>

      <main class="page-main">

        <!-- PHILOSOPHY -->
        <section class="section phil-section">
          <div class="container">
            <div class="two-col">
              <div class="col-text">
                <span class="section-label">{{ 'landing.formation.phil.label' | translate }}</span>
                <h2>{{ 'landing.formation.phil.title' | translate }}</h2>
                <p>{{ 'landing.formation.phil.p1' | translate }}</p>
                <p>{{ 'landing.formation.phil.p2' | translate }}</p>
                <blockquote class="feature-quote">
                  "{{ 'landing.formation.phil.quote' | translate }}"
                </blockquote>
              </div>
              <div class="col-visual fade-in">
                <div class="objective-cards">
                  <div class="obj-card" *ngFor="let obj of objectives">
                    <div class="obj-check material-icons">check</div>
                    <span>{{obj | translate}}</span>
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
              <span class="section-label">{{ 'landing.formation.training.label' | translate }}</span>
              <h2>{{ 'landing.formation.training.title' | translate }}</h2>
              <p class="section-sub">{{ 'landing.formation.training.sub' | translate }}</p>
            </div>

            <div class="training-grid fade-in">
              <div class="training-card" *ngFor="let t of trainings; let i = index">
                <div class="tc-number">{{i + 1}}</div>
                <div class="tc-icon material-icons">{{t.icon}}</div>
                <div class="tc-badge">{{t.badge | translate}}</div>
                <h3>{{t.title | translate}}</h3>
                <p>{{t.desc | translate}}</p>
                <div class="tc-modules">
                  <div class="tc-module-header">{{ 'landing.formation.training.moduleHeader' | translate }}</div>
                  <div class="tc-module" *ngFor="let m of t.modules">
                    <span class="module-dot"></span>
                    <span>{{m | translate}}</span>
                  </div>
                </div>
                <div class="tc-duration">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                  {{t.duration | translate}}
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
            <div class="post-grid fade-in">
              <div class="post-card" *ngFor="let p of postFormation">
                <div class="pc-icon material-icons">{{p.icon}}</div>
                <h4>{{p.title | translate}}</h4>
                <p>{{p.desc | translate}}</p>
              </div>
            </div>
            <div class="post-objective fade-in">
              <div class="po-icon material-icons">my_location</div>
              <div>
                <h4>{{ 'landing.formation.post.objTitle' | translate }}</h4>
                <p>{{ 'landing.formation.post.objDesc1' | translate }} <span class="jersey-10-regular">FEEDIN</span>{{ 'landing.formation.post.objDesc2' | translate }}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- VALUE ADDED -->
        <section class="section value-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.formation.value.label' | translate }}</span>
              <h2>{{ 'landing.formation.value.title' | translate }} <span class="jersey-10-regular">FEEDIN</span></h2>
            </div>
            <div class="value-grid fade-in">
              <div class="value-item" *ngFor="let v of valueAdded">
                <div class="vi-icon material-icons">{{v.icon}}</div>
                <div>
                  <h4>{{v.title | translate}}</h4>
                  <p>{{v.desc | translate}}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- CTA -->
        <section class="section cta-section">
          <div class="container">
            <div class="cta-box">
              <div class="cta-content">
                <h2>{{ 'landing.formation.cta.title' | translate }}</h2>
                <p>{{ 'landing.formation.cta.desc' | translate }}</p>
              </div>
              <div class="cta-actions">
                <a (click)="goToContactRegister()" class="btn-primary" style="cursor:pointer">{{ 'landing.formation.cta.btn1' | translate }}</a>
                <a routerLink="/services" class="btn-secondary">{{ 'landing.formation.cta.btn2' | translate }}</a>
              </div>
            </div>
          </div>
        </section>

      </main>

      <app-footer></app-footer>
      <app-scroll-to-top></app-scroll-to-top>
    </div>
  `,
  styles: [`
    .page-wrapper {
      min-height: 100vh;
      background: #f8faf8;
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
    }

    .page-hero {
      position: relative;
      min-height: 60vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #052952;
      overflow: hidden;
      padding-top: 100px;
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

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(160deg, rgba(10,74,46,0.65) 0%, rgba(5,41,82,0.55) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 2rem 1.5rem 1.5rem;
    }

    .page-label {
      display: inline-block;
      background: rgba(16,185,129,0.2);
      border: 1px solid rgba(16,185,129,0.4);
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
      color: rgba(255,255,255,0.75);
      max-width: 600px;
      margin: 0 auto;
      line-height: 1.6;
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

    .hs-item { text-align: center; }
    .hs-value { font-size: 2rem; font-weight: 800; color: #34d399; font-family: 'Outfit', system-ui, sans-serif; }
    .hs-label { font-size: 0.8125rem; color: rgba(255,255,255,0.6); margin-top: 0.25rem; }

    .page-main { padding-bottom: 4rem; }

    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }
    .section { padding: 5rem 0; }
    .phil-section { background: white; }
    .training-section { background: #f8faf8; }
    .post-section { background: white; }
    .value-section { background: linear-gradient(180deg, #f0fdf4, #ecfdf5); }
    .cta-section { background: #f8faf8; }

    .section-header.center { text-align: center; margin-bottom: 3.5rem; }
    .section-label {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      color: #10b981;
      margin-bottom: 0.75rem;
    }
    .section-sub { color: #6b7280; font-size: 1.0625rem; max-width: 560px; margin: 0.75rem auto 0; line-height: 1.6; }
    h2 { font-size: clamp(1.75rem, 4vw, 2.5rem); font-weight: 800; color: #1f2937; line-height: 1.2; margin-bottom: 1rem; font-family: 'Outfit', 'Inter', system-ui, sans-serif; }

    /* PHILOSOPHY */
    .two-col { display: grid; grid-template-columns: 1fr; gap: 3rem; align-items: center; }
    @media (min-width: 900px) { .two-col { grid-template-columns: 1fr 1fr; } }

    .col-text p { color: #4b5563; line-height: 1.7; margin-bottom: 1rem; font-size: 1.0625rem; }

    .feature-quote {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border-left: 4px solid #10b981;
      border-radius: 0 16px 16px 0;
      padding: 1.25rem 1.5rem;
      font-style: italic;
      color: #374151;
      font-size: 1rem;
      margin-top: 1.5rem;
    }

    .objective-cards {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .obj-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      border: 1px solid rgba(16,185,129,0.15);
      border-radius: 14px;
      padding: 1rem 1.25rem;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
      transition: all 0.25s ease;
    }

    .obj-card:hover {
      border-color: rgba(16,185,129,0.35);
      box-shadow: 0 4px 16px rgba(16,185,129,0.1);
      transform: translateX(4px);
    }

    .obj-check {
      width: 28px;
      height: 28px;
      min-width: 28px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 700;
      box-shadow: 0 4px 10px rgba(16,185,129,0.3);
      transition: all 0.3s ease;
    }
    .obj-card:hover .obj-check { transform: scale(1.1) rotate(5deg); box-shadow: 0 6px 15px rgba(16,185,129,0.5); }

    .obj-card span { font-size: 0.9375rem; color: #374151; line-height: 1.4; }

    /* TRAINING GRID */
    .training-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .training-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .training-card {
      background: white;
      border: 1px solid rgba(16,185,129,0.12);
      border-radius: 24px;
      padding: 2.25rem 2rem;
      position: relative;
      transition: all 0.35s ease;
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    .training-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 48px rgba(16,185,129,0.12);
      border-color: rgba(16,185,129,0.3);
    }

    .tc-number {
      position: absolute;
      top: 1.25rem;
      right: 1.25rem;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 800;
    }

    .tc-icon { font-size: 2.5rem; margin-bottom: 1rem; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.4); display: inline-block; transition: all 0.3s ease; }
    .training-card:hover .tc-icon { transform: scale(1.1) translateY(-4px); text-shadow: 0 0 25px rgba(16,185,129,0.6); color: #34d399; }
    .tc-badge {
      display: inline-block;
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #10b981;
      background: #f0fdf4;
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 100px;
      padding: 0.25rem 0.75rem;
      margin-bottom: 1rem;
    }

    .training-card h3 { font-size: 1.0625rem; font-weight: 700; color: #1f2937; margin-bottom: 0.75rem; }
    .training-card p { color: #6b7280; font-size: 0.9375rem; line-height: 1.6; margin-bottom: 1.5rem; }

    .tc-modules { margin-bottom: 1.5rem; }
    .tc-module-header { font-size: 0.8125rem; font-weight: 700; color: #374151; margin-bottom: 0.75rem; }
    .tc-module {
      display: flex;
      align-items: flex-start;
      gap: 0.625rem;
      font-size: 0.875rem;
      color: #4b5563;
      padding: 0.3125rem 0;
    }

    .module-dot {
      width: 6px;
      height: 6px;
      min-width: 6px;
      border-radius: 50%;
      background: #10b981;
      margin-top: 0.375rem;
    }

    .tc-duration {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #9ca3af;
      padding-top: 1rem;
      border-top: 1px solid #f3f4f6;
    }

    /* POST-FORMATION */
    .post-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
      margin-bottom: 2.5rem;
    }

    @media (min-width: 640px) {
      .post-grid { grid-template-columns: 1fr 1fr; }
    }

    .post-card {
      background: #f0fdf4;
      border: 1px solid rgba(16,185,129,0.15);
      border-radius: 20px;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      transition: all 0.3s ease;
    }

    .post-card:hover {
      background: #ecfdf5;
      box-shadow: 0 8px 24px rgba(16,185,129,0.1);
    }

    .pc-icon { font-size: 2rem; color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.3); transition: all 0.3s ease; display: inline-block; }
    .post-card:hover .pc-icon { transform: scale(1.1) rotate(-5deg); text-shadow: 0 0 20px rgba(16,185,129,0.5); color: #34d399; }
    .post-card h4 { font-size: 1rem; font-weight: 700; color: #1f2937; }
    .post-card p { font-size: 0.9rem; color: #6b7280; line-height: 1.6; }

    .post-objective {
      display: flex;
      align-items: flex-start;
      gap: 1.5rem;
      background: linear-gradient(135deg, #052952, #0a4a2e);
      border-radius: 24px;
      padding: 2.5rem;
      color: white;
    }

    .po-icon { font-size: 3rem; flex-shrink: 0; color: #34d399; text-shadow: 0 0 20px rgba(52,211,153,0.5); display: inline-block; transition: all 0.3s ease; }
    .post-objective:hover .po-icon { transform: scale(1.1); text-shadow: 0 0 30px rgba(52,211,153,0.8); color: #6ee7b7; }
    .post-objective h4 { font-size: 1.125rem; font-weight: 700; color: white; margin-bottom: 0.5rem; }
    .post-objective p { color: rgba(255,255,255,0.8); font-size: 0.9375rem; line-height: 1.7; }

    /* VALUE ADDED */
    .value-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }

    @media (min-width: 640px) {
      .value-grid { grid-template-columns: 1fr 1fr; }
    }

    .value-item {
      display: flex;
      align-items: flex-start;
      gap: 1.25rem;
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(16,185,129,0.1);
      transition: all 0.3s ease;
    }

    .value-item:hover {
      box-shadow: 0 8px 24px rgba(16,185,129,0.1);
      border-color: rgba(16,185,129,0.25);
    }

    .vi-icon { font-size: 2rem; flex-shrink: 0; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.3); background: rgba(16,185,129,0.1); padding: 0.75rem; border-radius: 12px; display: inline-flex; transition: all 0.3s ease; }
    .value-item:hover .vi-icon { transform: scale(1.1) rotate(5deg); background: rgba(16,185,129,0.15); color: #34d399; text-shadow: 0 0 25px rgba(16,185,129,0.5); }
    .value-item h4 { font-size: 0.9375rem; font-weight: 700; color: #1f2937; margin-bottom: 0.375rem; }
    .value-item p { font-size: 0.875rem; color: #6b7280; line-height: 1.6; }

    /* CTA */
    .cta-box {
      position: relative;
      background: #052952;
      border-radius: 28px;
      padding: 3.5rem 2.5rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: flex-start;
      overflow: hidden;
    }
    .cta-box::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url('/assets/images/pic4.jpg');
      background-size: cover;
      background-position: center;
      opacity: 0.45;
      mix-blend-mode: overlay;
    }
    .cta-content, .cta-actions { position: relative; z-index: 2; }

    @media (min-width: 768px) {
      .cta-box { flex-direction: row; align-items: center; justify-content: space-between; }
    }

    .cta-content h2 { color: white; font-size: clamp(1.375rem, 3.5vw, 2rem); margin-bottom: 0.75rem; }
    .cta-content p { color: rgba(255,255,255,0.75); font-size: 0.9375rem; line-height: 1.6; max-width: 480px; }

    .cta-actions { display: flex; flex-direction: column; gap: 0.875rem; flex-shrink: 0; }

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
      text-align: center;
    }
    .btn-primary:hover { background: #059669; box-shadow: 0 8px 24px rgba(16,185,129,0.3); transform: translateY(-2px); }

    .btn-secondary {
      display: inline-block;
      padding: 0.875rem 2rem;
      background: rgba(255,255,255,0.1);
      color: white;
      font-weight: 600;
      font-size: 0.9375rem;
      border-radius: 100px;
      border: 2px solid rgba(255,255,255,0.3);
      text-decoration: none;
      transition: all 0.25s ease;
      text-align: center;
    }
    .btn-secondary:hover { background: rgba(255,255,255,0.2); }

    .col-visual { display: flex; align-items: center; justify-content: center; }

    /* Animation CSS */
    .fade-in {
      opacity: 0;
      transform: translateY(20px);
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    .fade-in.visible {
      opacity: 1;
      transform: translateY(0);
    }
  `]
})
export class FormationComponent implements OnInit {
  private router = inject(Router);

  heroStats = [
    { value: '3', label: 'landing.formation.stats.0.label' },
    { value: '100%', label: 'landing.formation.stats.1.label' },
    { value: '∞', label: 'landing.formation.stats.2.label' }
  ];

  objectives = [
    'landing.formation.obj.0',
    'landing.formation.obj.1',
    'landing.formation.obj.2',
    'landing.formation.obj.3',
    'landing.formation.obj.4'
  ];

  trainings = [
    {
      icon: 'construction', badge: 'landing.formation.trainings.0.badge', title: 'landing.formation.trainings.0.title',
      desc: 'landing.formation.trainings.0.desc',
      modules: ['landing.formation.trainings.0.modules.0', 'landing.formation.trainings.0.modules.1', 'landing.formation.trainings.0.modules.2', 'landing.formation.trainings.0.modules.3', 'landing.formation.trainings.0.modules.4'],
      duration: 'landing.formation.trainings.0.duration'
    },
    {
      icon: 'location_city', badge: 'landing.formation.trainings.1.badge', title: 'landing.formation.trainings.1.title',
      desc: 'landing.formation.trainings.1.desc',
      modules: ['landing.formation.trainings.1.modules.0', 'landing.formation.trainings.1.modules.1', 'landing.formation.trainings.1.modules.2', 'landing.formation.trainings.1.modules.3', 'landing.formation.trainings.1.modules.4'],
      duration: 'landing.formation.trainings.1.duration'
    },
    {
      icon: 'engineering', badge: 'landing.formation.trainings.2.badge', title: 'landing.formation.trainings.2.title',
      desc: 'landing.formation.trainings.2.desc',
      modules: ['landing.formation.trainings.2.modules.0', 'landing.formation.trainings.2.modules.1', 'landing.formation.trainings.2.modules.2', 'landing.formation.trainings.2.modules.3', 'landing.formation.trainings.2.modules.4'],
      duration: 'landing.formation.trainings.2.duration'
    }
  ];

  postFormation = [
    { icon: 'phone', title: 'landing.formation.post.items.0.title', desc: 'landing.formation.post.items.0.desc' },
    { icon: 'laptop_chromebook', title: 'landing.formation.post.items.1.title', desc: 'landing.formation.post.items.1.desc' },
    { icon: 'bar_chart', title: 'landing.formation.post.items.2.title', desc: 'landing.formation.post.items.2.desc' },
    { icon: 'my_location', title: 'landing.formation.post.items.3.title', desc: 'landing.formation.post.items.3.desc' }
  ];

  valueAdded = [
    { icon: 'grass', title: 'landing.formation.valueAdded.0.title', desc: 'landing.formation.valueAdded.0.desc' },
    { icon: 'school', title: 'landing.formation.valueAdded.1.title', desc: 'landing.formation.valueAdded.1.desc' },
    { icon: 'menu_book', title: 'landing.formation.valueAdded.2.title', desc: 'landing.formation.valueAdded.2.desc' },
    { icon: 'sync', title: 'landing.formation.valueAdded.3.title', desc: 'landing.formation.valueAdded.3.desc' },
    { icon: 'handshake', title: 'landing.formation.valueAdded.4.title', desc: 'landing.formation.valueAdded.4.desc' }
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);
    setTimeout(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1 });
      
      document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
    }, 100);
  }

  /**
   * Navigate to the contact page with the 'register' (Demander un accès) tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}
