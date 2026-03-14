import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-services',
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
          <span class="page-label">{{ 'landing.services.hero.label' | translate }}</span>
          <h1>{{ 'landing.services.hero.title1' | translate }} <span class="accent">{{ 'landing.services.hero.title2' | translate }}</span></h1>
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
              <p class="section-sub">{{ 'landing.services.grid.sub1' | translate }} <span class="jersey-10-regular">FEEDIN</span> {{ 'landing.services.grid.sub2' | translate }}</p>
            </div>

            <div class="services-grid fade-in">
              <div class="service-card" *ngFor="let s of services">
                <div class="service-header">
                  <div class="service-icon material-icons">{{s.icon}}</div>
                  <div class="service-tag">{{s.tag | translate}}</div>
                </div>
                <h3>{{s.title | translate}}</h3>
                <p [innerHTML]="s.desc | translate"></p>
                <div class="service-includes" *ngIf="s.includes">
                  <h5>{{ 'landing.services.grid.includes' | translate }}</h5>
                  <ul>
                    <li *ngFor="let item of s.includes">{{item | translate}}</li>
                  </ul>
                </div>
                <div class="service-benefits" *ngIf="s.benefits">
                  <div class="benefit-chip" *ngFor="let b of s.benefits">✓ {{b | translate}}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- FOR FARMERS SECTION -->
        <section class="section farmers-section">
          <div class="container">
            <div class="two-col fade-in">
              <div class="col-text">
                <span class="section-label">{{ 'landing.services.farmers.label' | translate }}</span>
                <h2>{{ 'landing.services.farmers.title' | translate }}</h2>
                <p><span class="jersey-10-regular">FEEDIN</span> {{ 'landing.services.farmers.p1' | translate }}</p>
                <p>{{ 'landing.services.farmers.p2' | translate }}</p>
                <div class="farmer-benefits">
                  <div class="fb-item" *ngFor="let fb of farmerBenefits">
                    <div class="fb-icon material-icons">{{fb.icon}}</div>
                    <div>
                      <h5>{{fb.title | translate}}</h5>
                      <p>{{fb.desc | translate}}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="col-visual fade-in">
                <div class="visual-card">
                  <div class="vc-header">
                    <div class="vc-dot green"></div>
                    <div class="vc-dot yellow"></div>
                    <div class="vc-dot red"></div>
                    <span>{{ 'landing.services.farmers.dashboard' | translate }}</span>
                  </div>
                  <div class="vc-content">
                    <div class="metric" *ngFor="let m of metrics">
                      <div class="metric-label">{{m.label | translate}}</div>
                      <div class="metric-bar">
                        <div class="metric-fill" [style.width]="m.pct"></div>
                      </div>
                      <div class="metric-val">{{m.val}}</div>
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
                <div class="ps-number">{{i + 1}}</div>
                <div class="ps-icon material-icons">{{p.icon}}</div>
                <h4>{{p.title | translate}}</h4>
                <p>{{p.desc | translate}}</p>
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
                <a (click)="goToContactRegister()" class="btn-primary" style="cursor:pointer">{{ 'landing.services.cta.btn1' | translate }}</a>
                <a routerLink="/formation" class="btn-secondary">{{ 'landing.services.cta.btn2' | translate }}</a>
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
      min-height: 50vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #052952;
      overflow: hidden;
      padding-top: 100px;
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

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(10,74,46,0.65) 0%, rgba(5,41,82,0.55) 100%);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 2rem 1.5rem;
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

    .page-main { padding-bottom: 4rem; }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .section { padding: 5rem 0; }
    .services-section { background: white; }

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

    /* Services Grid */
    .services-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 640px) {
      .services-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (min-width: 1024px) {
      .services-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .service-card {
      background: #fff;
      border: 1px solid rgba(16,185,129,0.12);
      border-radius: 24px;
      padding: 2rem;
      transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
      box-shadow: 0 2px 12px rgba(0,0,0,0.04);
    }

    .service-card:hover {
      transform: translateY(-8px);
      box-shadow: 0 20px 48px rgba(16,185,129,0.12);
      border-color: rgba(16,185,129,0.3);
    }

    .service-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .service-icon {
      font-size: 2.25rem;
      width: 56px;
      height: 56px;
      background: rgba(16,185,129,0.1);
      color: #10b981;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 0 10px rgba(16,185,129,0.4);
      transition: all 0.3s ease;
    }
    .service-card:hover .service-icon {
      transform: scale(1.1) rotate(-5deg);
      background: rgba(16,185,129,0.2);
      color: #34d399;
      text-shadow: 0 0 20px rgba(16,185,129,0.6);
      box-shadow: 0 4px 15px rgba(16,185,129,0.3);
    }

    .service-tag {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #10b981;
      background: #f0fdf4;
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 100px;
      padding: 0.25rem 0.75rem;
    }

    .service-card h3 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.75rem;
    }

    .service-card p { color: #6b7280; font-size: 0.9375rem; line-height: 1.6; margin-bottom: 1.25rem; }

    .service-includes h5 {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.625rem;
    }

    .service-includes ul {
      list-style: none;
      padding: 0;
      margin: 0 0 1rem;
    }

    .service-includes li {
      font-size: 0.875rem;
      color: #6b7280;
      padding: 0.25rem 0;
      padding-left: 1.25rem;
      position: relative;
    }

    .service-includes li::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: 700;
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

    /* Farmers Section */
    .farmers-section { background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); }

    .two-col {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      align-items: center;
    }

    @media (min-width: 900px) {
      .two-col { grid-template-columns: 1fr 1fr; }
    }

    .col-text p { color: #4b5563; line-height: 1.7; margin-bottom: 1rem; font-size: 1.0625rem; }

    .farmer-benefits {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
      margin-top: 2rem;
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
      background: rgba(16,185,129,0.1);
      color: #10b981;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(16,185,129,0.2);
      text-shadow: 0 0 10px rgba(16,185,129,0.4);
      transition: all 0.3s ease;
    }
    .fb-item:hover .fb-icon {
      transform: translateY(-2px) scale(1.05);
      background: rgba(16,185,129,0.15);
      color: #34d399;
      box-shadow: 0 6px 15px rgba(16,185,129,0.3);
    }

    .fb-item h5 { font-size: 0.9375rem; font-weight: 700; color: #1f2937; margin-bottom: 0.25rem; }
    .fb-item p { font-size: 0.875rem; color: #6b7280; margin: 0; line-height: 1.5; }

    /* Visual Card / Dashboard mockup */
    .visual-card {
      background: white;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,0.12);
      border: 1px solid rgba(16,185,129,0.1);
    }

    .vc-header {
      background: #f9fafb;
      border-bottom: 1px solid #f3f4f6;
      padding: 0.875rem 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: #9ca3af;
      font-weight: 500;
    }

    .vc-dot { width: 10px; height: 10px; border-radius: 50%; }
    .vc-dot.green { background: #34d399; }
    .vc-dot.yellow { background: #fbbf24; }
    .vc-dot.red { background: #f87171; }

    .vc-content { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; }

    .metric { display: flex; align-items: center; gap: 0.75rem; }
    .metric-label { font-size: 0.8125rem; color: #6b7280; width: 80px; flex-shrink: 0; }
    .metric-bar {
      flex: 1;
      height: 8px;
      background: #f3f4f6;
      border-radius: 100px;
      overflow: hidden;
    }
    .metric-fill {
      height: 100%;
      background: linear-gradient(90deg, #10b981, #34d399);
      border-radius: 100px;
      transition: width 1s ease;
    }
    .metric-val { font-size: 0.8125rem; font-weight: 700; color: #1f2937; width: 40px; text-align: right; }

    /* Process */
    .process-section { background: white; }

    .process-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .process-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .process-step {
      text-align: center;
      padding: 2rem;
      border-radius: 20px;
      background: #f8faf8;
      border: 1px solid rgba(16,185,129,0.1);
      transition: all 0.3s ease;
    }

    .process-step:hover {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(16,185,129,0.1);
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
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }
    .process-step:hover .ps-number { transform: scale(1.1); box-shadow: 0 8px 20px rgba(16,185,129,0.5); }

    .ps-icon { font-size: 2.5rem; margin-bottom: 1rem; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.4); transition: all 0.3s ease; display: inline-block; }
    .process-step:hover .ps-icon { transform: scale(1.1) translateY(-5px); text-shadow: 0 0 25px rgba(16,185,129,0.6); color: #34d399; }

    .process-step h4 { font-size: 1.0625rem; font-weight: 700; color: #1f2937; margin-bottom: 0.625rem; }
    .process-step p { font-size: 0.9375rem; color: #6b7280; line-height: 1.6; }

    /* CTA */
    .cta-section { background: #f8faf8; }

    .cta-box {
      position: relative;
      background: #052952;
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
      opacity: 0.45;
      mix-blend-mode: overlay;
    }
    .cta-box h2, .cta-box p, .cta-actions { position: relative; z-index: 2; }

    .cta-box h2 { color: white; font-size: clamp(1.5rem, 4vw, 2.25rem); margin-bottom: 1rem; }
    .cta-box p { color: rgba(255,255,255,0.75); font-size: 1.0625rem; margin-bottom: 2.5rem; max-width: 480px; margin-left: auto; margin-right: auto; }

    .cta-actions {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      align-items: center;
    }

    @media (min-width: 480px) {
      .cta-actions { flex-direction: row; justify-content: center; }
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
export class ServicesComponent implements OnInit {
  private router = inject(Router);

  services = [
    {
      icon: 'construction', tag: 'landing.services.services.0.tag', title: 'landing.services.services.0.title',
      desc: 'landing.services.services.0.desc',
      includes: ['landing.services.services.0.includes.0', 'landing.services.services.0.includes.1', 'landing.services.services.0.includes.2', 'landing.services.services.0.includes.3', 'landing.services.services.0.includes.4'],
      benefits: ['landing.services.services.0.benefits.0', 'landing.services.services.0.benefits.1', 'landing.services.services.0.benefits.2']
    },
    {
      icon: 'location_city', tag: 'landing.services.services.1.tag', title: 'landing.services.services.1.title',
      desc: 'landing.services.services.1.desc',
      includes: ['landing.services.services.1.includes.0', 'landing.services.services.1.includes.1', 'landing.services.services.1.includes.2', 'landing.services.services.1.includes.3'],
      benefits: ['landing.services.services.1.benefits.0', 'landing.services.services.1.benefits.1', 'landing.services.services.1.benefits.2']
    },
    {
      icon: 'engineering', tag: 'landing.services.services.2.tag', title: 'landing.services.services.2.title',
      desc: 'landing.services.services.2.desc',
      includes: ['landing.services.services.2.includes.0', 'landing.services.services.2.includes.1', 'landing.services.services.2.includes.2', 'landing.services.services.2.includes.3'],
      benefits: ['landing.services.services.2.benefits.0', 'landing.services.services.2.benefits.1', 'landing.services.services.2.benefits.2']
    },
    {
      icon: 'public', tag: 'landing.services.services.3.tag', title: 'landing.services.services.3.title',
      desc: 'landing.services.services.3.desc',
      includes: ['landing.services.services.3.includes.0', 'landing.services.services.3.includes.1', 'landing.services.services.3.includes.2', 'landing.services.services.3.includes.3'],
      benefits: ['landing.services.services.3.benefits.0', 'landing.services.services.3.benefits.1', 'landing.services.services.3.benefits.2']
    },
    {
      icon: 'eco', tag: 'landing.services.services.4.tag', title: 'landing.services.services.4.title',
      desc: 'landing.services.services.4.desc',
      includes: ['landing.services.services.4.includes.0', 'landing.services.services.4.includes.1', 'landing.services.services.4.includes.2', 'landing.services.services.4.includes.3'],
      benefits: ['landing.services.services.4.benefits.0', 'landing.services.services.4.benefits.1', 'landing.services.services.4.benefits.2']
    },
    {
      icon: 'school', tag: 'landing.services.services.5.tag', title: 'landing.services.services.5.title',
      desc: 'landing.services.services.5.desc',
      includes: ['landing.services.services.5.includes.0', 'landing.services.services.5.includes.1', 'landing.services.services.5.includes.2', 'landing.services.services.5.includes.3', 'landing.services.services.5.includes.4'],
      benefits: ['landing.services.services.5.benefits.0', 'landing.services.services.5.benefits.1', 'landing.services.services.5.benefits.2']
    }
  ];

  farmerBenefits = [
    { icon: 'smartphone', title: 'landing.services.farmerBenefits.0.title', desc: 'landing.services.farmerBenefits.0.desc' },
    { icon: 'water_drop', title: 'landing.services.farmerBenefits.1.title', desc: 'landing.services.farmerBenefits.1.desc' },
    { icon: 'bar_chart', title: 'landing.services.farmerBenefits.2.title', desc: 'landing.services.farmerBenefits.2.desc' },
    { icon: 'support_agent', title: 'landing.services.farmerBenefits.3.title', desc: 'landing.services.farmerBenefits.3.desc' }
  ];

  metrics = [
    { label: 'landing.services.metrics.0.label', pct: '82%', val: '24°C' },
    { label: 'landing.services.metrics.1.label', pct: '65%', val: '65%' },
    { label: 'landing.services.metrics.2.label', pct: '45%', val: '450ppm' },
    { label: 'landing.services.metrics.3.label', pct: '91%', val: '+34%' }
  ];

  process = [
    { icon: 'search', title: 'landing.services.processSteps.0.title', desc: 'landing.services.processSteps.0.desc' },
    { icon: 'build', title: 'landing.services.processSteps.1.title', desc: 'landing.services.processSteps.1.desc' },
    { icon: 'trending_up', title: 'landing.services.processSteps.2.title', desc: 'landing.services.processSteps.2.desc' }
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
