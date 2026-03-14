import { Component, ChangeDetectionStrategy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { PublicNavComponent } from '../shared/public-nav.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterLink, PublicNavComponent, FooterComponent, ScrollToTopComponent, TranslatePipe],
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
                  <div class="stat-card" *ngFor="let s of stats">
                    <div class="stat-icon material-icons">{{s.icon}}</div>
                    <div class="stat-number">{{s.value}}</div>
                    <div class="stat-label">{{s.label | translate}}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- MISSION VISION -->
        <section class="section mv-section">
          <div class="container">
            <div class="mv-grid fade-in">
              <div class="mv-card mission">
                <div class="mv-icon material-icons">my_location</div>
                <h3>{{ 'landing.about.mv.mission.title' | translate }}</h3>
                <div [innerHTML]="'landing.about.mv.mission.content' | translate"></div>
              </div>
              <div class="mv-card vision">
                <div class="mv-icon material-icons">travel_explore</div>
                <h3>{{ 'landing.about.mv.vision.title' | translate }}</h3>
                <p>{{ 'landing.about.mv.vision.desc' | translate }}</p>
                <ul class="vision-list">
                  <li><span class="material-icons inline-icon">language</span> {{ 'landing.about.mv.vision.list.0' | translate }}</li>
                  <li><span class="material-icons inline-icon">recycling</span> {{ 'landing.about.mv.vision.list.1' | translate }}</li>
                  <li><span class="material-icons inline-icon">location_city</span> {{ 'landing.about.mv.vision.list.2' | translate }}</li>
                  <li><span class="material-icons inline-icon">monetization_on</span> {{ 'landing.about.mv.vision.list.3' | translate }}</li>
                </ul>
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
                <div class="step-number">{{i + 1}}</div>
                <div class="step-body">
                  <h4>{{step.title | translate}}</h4>
                  <p>{{step.desc | translate}}</p>
                </div>
                <div class="step-connector" *ngIf="i < approachSteps.length - 1"></div>
              </div>
            </div>
          </div>
        </section>

        <!-- VALUES -->
        <section class="section values-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.about.values.label' | translate }}</span>
              <h2>{{ 'landing.about.values.title' | translate }}</h2>
            </div>
            <div class="values-grid">
              <div class="value-card fade-in" *ngFor="let v of values" [style.transition-delay]="'0.1s'">
                <div class="value-icon material-icons">{{v.icon}}</div>
                <h4>{{v.title | translate}}</h4>
                <p>{{v.desc | translate}}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- EXPERTISE -->
        <section class="section expertise-section">
          <div class="container">
            <div class="two-col gap-lg">
              <div class="col-text">
                <span class="section-label">{{ 'landing.about.expertise.label' | translate }}</span>
                <h2>{{ 'landing.about.expertise.title' | translate }}</h2>
                <ul class="expertise-list">
                  <li *ngFor="let e of expertise">
                    <div class="exp-bullet"></div>
                    <span>{{e | translate}}</span>
                  </li>
                </ul>
              </div>
              <div class="col-text">
                <span class="section-label">{{ 'landing.about.target.label' | translate }}</span>
                <h2>{{ 'landing.about.target.title' | translate }}</h2>
                <div class="audience-cards">
                  <div class="audience-chip fade-in" *ngFor="let a of audience">
                    <span class="chip-icon material-icons">{{a.icon}}</span>
                    <span>{{a.label | translate}}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- TRUST / CONFIANCE -->
        <section class="section trust-section">
          <div class="container">
            <div class="trust-banner">
              <div class="trust-text">
                <h2>{{ 'landing.about.trust.title' | translate }}</h2>
                <div [innerHTML]="'landing.about.trust.content' | translate"></div>
              </div>
              <div class="trust-cta">
                <a (click)="goToContactRegister()" class="btn-primary" style="cursor:pointer">{{ 'landing.about.trust.cta1' | translate }}</a>
                <a routerLink="/services" class="btn-secondary">{{ 'landing.about.trust.cta2' | translate }}</a>
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
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap');

    .page-wrapper {
      min-height: 100vh;
      background: #f8faf8;
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
    }

    /* ---- HERO ---- */
    .page-hero {
      position: relative;
      min-height: 55vh;
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
      background-image: url('/assets/images/pic1.jpg');
      background-size: cover;
      background-position: center;
      opacity: 0.8;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(5,41,82,0.65) 0%, rgba(10,74,46,0.55) 100%);
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
      max-width: 560px;
      margin: 0 auto;
      line-height: 1.6;
    }

    /* ---- LAYOUT ---- */
    .page-main { padding-bottom: 4rem; }

    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1.5rem;
    }

    .section {
      padding: 5rem 0;
    }

    .section:nth-child(even) { background: white; }

    .section-header.center { text-align: center; margin-bottom: 3rem; }

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
    .who-section { background: white; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
      align-items: center;
    }

    .two-col.gap-lg { gap: 4rem; }

    @media (min-width: 900px) {
      .two-col { grid-template-columns: 1fr 1fr; }
    }

    .col-text p {
      color: #4b5563;
      line-height: 1.7;
      margin-bottom: 1rem;
      font-size: 1.0625rem;
    }

    .stat-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .stat-card {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 16px;
      padding: 1.5rem 1rem;
      text-align: center;
      transition: transform 0.3s ease, box-shadow 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(16,185,129,0.15);
    }

    .stat-icon { font-size: 2rem; margin-bottom: 0.5rem; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.4); background: rgba(16,185,129,0.1); padding: 0.75rem; border-radius: 12px; display: inline-flex; transition: all 0.3s ease; }
    .stat-card:hover .stat-icon { transform: scale(1.1) rotate(5deg); text-shadow: 0 0 25px rgba(16,185,129,0.6); background: rgba(16,185,129,0.15); color: #34d399; }
    .stat-number { font-size: 1.75rem; font-weight: 800; color: #10b981; }
    .stat-label { font-size: 0.8125rem; color: #6b7280; margin-top: 0.25rem; }

    /* ---- MISSION VISION ---- */
    .mv-section { background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); }

    .mv-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }

    @media (min-width: 768px) {
      .mv-grid { grid-template-columns: 1fr 1fr; }
    }

    .mv-card {
      background: white;
      border-radius: 24px;
      padding: 2.5rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.06);
      border: 1px solid rgba(16,185,129,0.1);
    }

    .mv-icon { font-size: 2.5rem; margin-bottom: 1rem; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.4); background: rgba(16,185,129,0.08); padding: 1rem; border-radius: 16px; display: inline-flex; transition: all 0.3s ease; }
    .mv-card:hover .mv-icon { transform: translateY(-3px) scale(1.05); box-shadow: 0 8px 24px rgba(16,185,129,0.2); }

    .mv-card h3 {
      font-size: 1.375rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 1rem;
    }

    .mv-card p { color: #4b5563; line-height: 1.7; margin-bottom: 0.75rem; }

    .vision-list {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.625rem;
    }

    .vision-list li {
      color: #374151;
      font-size: 0.9375rem;
      padding: 0.5rem 0;
      border-bottom: 1px solid #f3f4f6;
    }

    /* ---- APPROACH ---- */
    .approach-section { background: white; }

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
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      position: relative;
      z-index: 1;
      text-shadow: 0 0 8px rgba(255,255,255,0.5);
      transition: all 0.3s ease;
    }
    .step-item:hover .step-number {
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(16,185,129,0.5);
    }

    .step-body h4 {
      font-size: 1.125rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
      padding-top: 0.625rem;
    }

    .step-body p { color: #6b7280; line-height: 1.6; }

    .step-connector {
      position: absolute;
      left: 23px;
      top: 48px;
      width: 2px;
      height: calc(100% - 48px);
      background: linear-gradient(180deg, rgba(16,185,129,0.4), rgba(16,185,129,0.1));
    }

    /* ---- VALUES ---- */
    .values-section { background: #f8faf8; }

    .values-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 640px) {
      .values-grid { grid-template-columns: 1fr 1fr; }
    }

    @media (min-width: 1024px) {
      .values-grid { grid-template-columns: repeat(4, 1fr); }
    }

    .value-card {
      background: white;
      border-radius: 20px;
      padding: 2rem 1.5rem;
      text-align: center;
      border: 1px solid rgba(16,185,129,0.1);
      transition: all 0.3s ease;
    }

    .value-card:hover {
      transform: translateY(-6px);
      box-shadow: 0 12px 32px rgba(16,185,129,0.12);
      border-color: rgba(16,185,129,0.3);
    }

    .value-icon { font-size: 2.25rem; margin-bottom: 1rem; color: #10b981; text-shadow: 0 0 15px rgba(16,185,129,0.4); background: linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.05)); padding: 1rem; border-radius: 50%; display: inline-flex; transition: all 0.3s ease; }
    .value-card:hover .value-icon { transform: scale(1.1); box-shadow: 0 0 20px rgba(16,185,129,0.3); }

    .value-card h4 {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 0.5rem;
    }

    .value-card p { font-size: 0.875rem; color: #6b7280; line-height: 1.6; }

    /* ---- EXPERTISE ---- */
    .expertise-section { background: white; }

    .expertise-list {
      list-style: none;
      padding: 0;
      margin: 1.5rem 0 0;
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
    }

    .expertise-list li {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #374151;
      font-size: 0.9375rem;
    }

    .exp-bullet {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-green);
      flex-shrink: 0;
    }

    .audience-cards {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }

    .audience-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1.125rem;
      background: #f0fdf4;
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 100px;
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .audience-chip:hover {
      background: #d1fae5;
      border-color: rgba(16,185,129,0.4);
    }
    .chip-icon { font-size: 1.25rem; color: #10b981; text-shadow: 0 0 10px rgba(16,185,129,0.3); transition: all 0.3s ease; margin-right: 0.25rem; }
    .audience-chip:hover .chip-icon { transform: scale(1.1); text-shadow: 0 0 15px rgba(16,185,129,0.5); }

    /* ---- TRUST / CTA ---- */
    .trust-section { background: white; }

    .trust-banner {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid rgba(16,185,129,0.2);
      border-radius: 28px;
      padding: 3rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      align-items: flex-start;
    }

    @media (min-width: 768px) {
      .trust-banner {
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
      }
    }

    .trust-text h2 { color: #1f2937; margin-bottom: 0.75rem; font-size: 1.5rem; }
    .trust-text p { color: #6b7280; font-size: 0.9375rem; line-height: 1.7; max-width: 520px; }

    .trust-cta {
      display: flex;
      flex-direction: column;
      gap: 0.875rem;
      flex-shrink: 0;
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
      box-shadow: 0 8px 24px rgba(16,185,129,0.3);
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
      border: 2px solid rgba(0,0,0,0.15);
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
      transition: opacity 0.6s ease-out, transform 0.6s ease-out;
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
  `]
})
export class AboutComponent implements OnInit {
  private router = inject(Router);

  stats = [
    { icon: 'eco', value: '100+', label: 'landing.about.stats.0' },
    { icon: 'handshake', value: '50+', label: 'landing.about.stats.1' },
    { icon: 'public', value: '5+', label: 'landing.about.stats.2' },
    { icon: 'bolt', value: '98%', label: 'landing.about.stats.3' }
  ];

  approachSteps = [
    { title: 'landing.about.steps.0.title', desc: 'landing.about.steps.0.desc' },
    { title: 'landing.about.steps.1.title', desc: 'landing.about.steps.1.desc' },
    { title: 'landing.about.steps.2.title', desc: 'landing.about.steps.2.desc' },
    { title: 'landing.about.steps.3.title', desc: 'landing.about.steps.3.desc' }
  ];

  values = [
    { icon: 'tips_and_updates', title: 'landing.about.valuesItem.0.title', desc: 'landing.about.valuesItem.0.desc' },
    { icon: 'recycling', title: 'landing.about.valuesItem.1.title', desc: 'landing.about.valuesItem.1.desc' },
    { icon: 'handshake', title: 'landing.about.valuesItem.2.title', desc: 'landing.about.valuesItem.2.desc' },
    { icon: 'done_all', title: 'landing.about.valuesItem.3.title', desc: 'landing.about.valuesItem.3.desc' }
  ];

  expertise = [
    'landing.about.expertiseItems.0',
    'landing.about.expertiseItems.1',
    'landing.about.expertiseItems.2',
    'landing.about.expertiseItems.3',
    'landing.about.expertiseItems.4',
    'landing.about.expertiseItems.5'
  ];

  audience = [
    { icon: 'agriculture', label: 'landing.about.audienceItems.0' },
    { icon: 'rocket_launch', label: 'landing.about.audienceItems.1' },
    { icon: 'factory', label: 'landing.about.audienceItems.2' },
    { icon: 'account_balance', label: 'landing.about.audienceItems.3' },
    { icon: 'location_city', label: 'landing.about.audienceItems.4' }
  ];



  ngOnInit(): void {
    window.scrollTo(0, 0);

    // Setup intersection observer for fade-in
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

  ngOnDestroy(): void {
  }


  /**
   * Navigate to the contact page with the 'register' (Demander un accès) tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}
