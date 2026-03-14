import { Component, ChangeDetectionStrategy, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PublicNavComponent } from '../shared/public-nav.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { ScrollToTopComponent } from '../../../../shared/components/scroll-to-top/scroll-to-top.component';
import { AuthService } from '../../../../core/services/auth.service';
import { RegisterRequest, UserRole, UserStatus } from '../../../../core/models/user.model';
import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

interface ContactForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  projectType: string;
  message: string;
}

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, PublicNavComponent, FooterComponent, ScrollToTopComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper">
      <app-public-nav></app-public-nav>

      <!-- Hero -->
      <header class="contact-hero">
        <div class="hero-overlay"></div>
        <div class="ch-glow ch-glow-left"></div>
        <div class="ch-glow ch-glow-right"></div>
        <div class="hero-content">
          <span class="page-label">{{ 'landing.contact.hero.label' | translate }}</span>
          <h1 [innerHTML]="'landing.contact.hero.title' | translate"></h1>
          <p class="hero-sub">{{ 'landing.contact.hero.sub' | translate }}</p>
          <div class="hero-badges">
            <span class="badge fade-in" *ngFor="let b of heroBadges">
              <span class="badge-icon material-icons">{{b.icon}}</span>{{b.text | translate}}
            </span>
          </div>
        </div>
      </header>

      <main class="page-main">
        <div class="contact-layout">

          <!-- LEFT: Info Panel -->
          <aside class="contact-info">

            <!-- Quick info cards -->
            <div class="info-header">
              <h2>{{ 'landing.contact.info.title' | translate }}</h2>
              <p>{{ 'landing.contact.info.sub' | translate }}</p>
            </div>

            <div class="info-cards">
              <div class="info-card fade-in" *ngFor="let c of contactChannels">
                <div class="ic-icon-wrap" [style.background]="c.bg">
                  <span class="ic-icon material-icons">{{c.icon}}</span>
                </div>
                <div class="ic-body">
                  <div class="ic-label">{{c.label | translate}}</div>
                  <div class="ic-value">{{c.value}}</div>
                  <div class="ic-note">{{c.note | translate}}</div>
                </div>
              </div>
            </div>

            <!-- Social Networks -->
            <div class="socials-block fade-in">
              <h4>{{ 'landing.contact.social.title' | translate }}</h4>
              <div class="social-icons">
                <a href="#" class="social-btn" *ngFor="let s of socialLinks" [title]="s.name | translate"
                   [style.background]="s.bg" [style.color]="s.color">
                  <span class="material-icons">{{s.icon}}</span>
                </a>
              </div>
            </div>

            <!-- Project Types Quick Filter -->
            <div class="project-types fade-in">
              <h4>{{ 'landing.contact.projects.title' | translate }}</h4>
              <div class="pt-chips">
                <div class="pt-chip" *ngFor="let pt of projectTypeChips">
                  <span class="pt-icon material-icons">{{pt.icon}}</span>
                  <span>{{pt.label | translate}}</span>
                </div>
              </div>
            </div>

          </aside>

          <!-- RIGHT: Contact Form & Register sliding pane -->
          <section class="contact-form-section">
            <div class="form-card">
              
              <!-- Toggle Switcher -->
              <div class="form-switcher">
                <button 
                  type="button"
                  class="switcher-btn" 
                  [class.active]="activeTab() === 'contact'" 
                  (click)="activeTab.set('contact')">
                  <span class="sw-icon material-icons inline-icon">email</span> {{ 'landing.contact.sw.write' | translate }}
                </button>
                <button 
                  type="button"
                  class="switcher-btn" 
                  [class.active]="activeTab() === 'register'" 
                  (click)="activeTab.set('register')">
                  <span class="sw-icon material-icons inline-icon">rocket_launch</span> {{ 'landing.contact.sw.access' | translate }}
                </button>
                <div class="switcher-glider" [class.right]="activeTab() === 'register'"></div>
              </div>

              <!-- Sliding Container -->
              <div class="sliding-container">
                <div class="sliding-wrapper" [class.slide-left]="activeTab() === 'register'">
                  
                  <!-- PANE 1: Contact Form -->
                  <div class="sliding-pane">
                    <div class="form-header">
                      <h2>{{ 'landing.contact.form.title' | translate }}</h2>
                      <p>{{ 'landing.contact.form.sub' | translate }}</p>
                    </div>

                    <form class="cf" (ngSubmit)="submitForm()" #contactForm="ngForm">

                      <!-- Name Fields -->
                      <div class="form-row">
                        <div class="form-group">
                          <label for="firstName">{{ 'landing.contact.form.firstName' | translate }} <span class="required">*</span></label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">person</span>
                            <input
                              id="firstName"
                              type="text"
                              name="firstName"
                              [(ngModel)]="form.firstName"
                              [placeholder]="'landing.contact.form.firstNamePl' | translate"
                              required
                              [class.invalid]="submitted() && !form.firstName"
                            >
                          </div>
                          <div class="field-error" *ngIf="submitted() && !form.firstName">{{ 'landing.contact.form.req' | translate }}</div>
                        </div>

                        <div class="form-group">
                          <label for="lastName">{{ 'landing.contact.form.lastName' | translate }} <span class="required">*</span></label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">person</span>
                            <input
                              id="lastName"
                              type="text"
                              name="lastName"
                              [(ngModel)]="form.lastName"
                              [placeholder]="'landing.contact.form.lastNamePl' | translate"
                              required
                              [class.invalid]="submitted() && !form.lastName"
                            >
                          </div>
                          <div class="field-error" *ngIf="submitted() && !form.lastName">{{ 'landing.contact.form.req' | translate }}</div>
                        </div>
                      </div>

                      <!-- Email & Phone -->
                      <div class="form-row">
                        <div class="form-group">
                          <label for="email">{{ 'landing.contact.form.email' | translate }} <span class="required">*</span></label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">email</span>
                            <input
                              id="email"
                              type="email"
                              name="email"
                              [(ngModel)]="form.email"
                              [placeholder]="'landing.contact.form.emailPl' | translate"
                              required
                              [class.invalid]="submitted() && !form.email"
                            >
                          </div>
                          <div class="field-error" *ngIf="submitted() && !form.email">{{ 'landing.contact.form.emailReq' | translate }}</div>
                        </div>

                        <div class="form-group">
                          <label for="phone">{{ 'landing.contact.form.phone' | translate }}</label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">phone</span>
                            <input
                              id="phone"
                              type="tel"
                              name="phone"
                              [(ngModel)]="form.phone"
                              [placeholder]="'landing.contact.form.phonePl' | translate"
                            >
                          </div>
                        </div>
                      </div>

                      <!-- Project Type -->
                      <div class="form-group">
                        <label for="projectType">{{ 'landing.contact.form.type' | translate }} <span class="required">*</span></label>
                        <div class="input-wrap select-wrap">
                          <span class="input-icon material-icons">eco</span>
                          <select
                            id="projectType"
                            name="projectType"
                            [(ngModel)]="form.projectType"
                            required
                            [class.invalid]="submitted() && !form.projectType"
                          >
                            <option value="">{{ 'landing.contact.form.typePl' | translate }}</option>
                            <option value="serre-connectee">{{ 'landing.contact.form.type1' | translate }}</option>
                            <option value="serre-verticale">{{ 'landing.contact.form.type2' | translate }}</option>
                            <option value="automatisation">{{ 'landing.contact.form.type3' | translate }}</option>
                            <option value="amenagement">{{ 'landing.contact.form.type4' | translate }}</option>
                            <option value="formation">{{ 'landing.contact.form.type5' | translate }}</option>
                            <option value="etude">{{ 'landing.contact.form.type6' | translate }}</option>
                            <option value="autre">{{ 'landing.contact.form.type7' | translate }}</option>
                          </select>
                        </div>
                        <div class="field-error" *ngIf="submitted() && !form.projectType">{{ 'landing.contact.form.typeReq' | translate }}</div>
                      </div>

                      <!-- Message -->
                      <div class="form-group">
                        <label for="message">{{ 'landing.contact.form.msg' | translate }} <span class="required">*</span></label>
                        <div class="textarea-wrap">
                          <textarea
                            id="message"
                            name="message"
                            [(ngModel)]="form.message"
                            [placeholder]="'landing.contact.form.msgPl' | translate"
                            rows="5"
                            required
                            [class.invalid]="submitted() && !form.message"
                          ></textarea>
                          <div class="char-count">{{form.message.length}} / 1500</div>
                        </div>
                        <div class="field-error" *ngIf="submitted() && !form.message">{{ 'landing.contact.form.msgReq' | translate }}</div>
                      </div>

                      <!-- Privacy notice -->
                      <div class="privacy-notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>{{ 'landing.contact.form.privacy' | translate }}</span>
                      </div>

                      <!-- Submit -->
                      <button
                        type="submit"
                        class="submit-btn"
                        [class.loading]="sending()"
                        [disabled]="sending()"
                      >
                        <span class="sb-content" *ngIf="!sending() && !sent()">
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                          {{ 'landing.contact.form.send' | translate }}
                        </span>
                        <span class="sb-loading" *ngIf="sending()">
                          <span class="spinner"></span>
                          {{ 'landing.contact.form.sending' | translate }}
                        </span>
                        <span class="sb-sent" *ngIf="sent() && !sending()">
                          ✓ {{ 'landing.contact.form.sent' | translate }}
                        </span>
                        <div class="btn-shine"></div>
                      </button>

                    </form>

                    <!-- Success State -->
                    <div class="success-banner fade-in" *ngIf="sent()">
                      <div class="sb-emoji material-icons">celebration</div>
                      <div>
                        <h4>{{ 'landing.contact.form.sentTitle' | translate }}</h4>
                        <p>{{ 'landing.contact.form.sentSub' | translate }}</p>
                      </div>
                    </div>
                  </div>

                  <!-- PANE 2: Register Form -->
                  <div class="sliding-pane">
                    <div class="form-header">
                      <h2>{{ 'landing.contact.reg.title' | translate }}</h2>
                      <p>{{ 'landing.contact.reg.sub' | translate }}</p>
                    </div>

                    <form class="cf" (ngSubmit)="submitRegisterForm()" #registerForm="ngForm">
                      
                      <!-- Name -->
                      <div class="form-group">
                        <label for="fullName">{{ 'landing.contact.reg.name' | translate }} <span class="required">*</span></label>
                        <div class="input-wrap">
                          <span class="input-icon material-icons">person</span>
                          <input type="text" id="fullName" name="fullName" [(ngModel)]="regForm.fullName" [placeholder]="'landing.contact.reg.namePl' | translate" required [class.invalid]="regSubmitted() && !regForm.fullName">
                        </div>
                        <div class="field-error" *ngIf="regSubmitted() && !regForm.fullName">{{ 'landing.contact.reg.req' | translate }}</div>
                      </div>

                      <!-- Email & Phone -->
                      <div class="form-row">
                        <div class="form-group">
                          <label for="regEmail">{{ 'landing.contact.reg.email' | translate }} <span class="required">*</span></label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">email</span>
                            <input type="email" id="regEmail" name="regEmail" [(ngModel)]="regForm.email" [placeholder]="'landing.contact.reg.emailPl' | translate" required [class.invalid]="regSubmitted() && !regForm.email">
                          </div>
                          <div class="field-error" *ngIf="regSubmitted() && !regForm.email">{{ 'landing.contact.reg.req' | translate }}</div>
                        </div>
                        <div class="form-group">
                          <label for="regPhone">{{ 'landing.contact.reg.phone' | translate }}</label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">phone</span>
                            <input type="tel" id="regPhone" name="regPhone" [(ngModel)]="regForm.phone" [placeholder]="'landing.contact.reg.phonePl' | translate">
                          </div>
                        </div>
                      </div>

                      <!-- Password -->
                      <div class="form-group">
                        <label for="regPassword">{{ 'landing.contact.reg.pwd' | translate }} <span class="required">*</span></label>
                        <div class="input-wrap">
                          <span class="input-icon material-icons">lock</span>
                          <input type="password" id="regPassword" name="regPassword" [(ngModel)]="regForm.password" [placeholder]="'landing.contact.reg.pwdPl' | translate" required minlength="6" [class.invalid]="regSubmitted() && !regForm.password">
                        </div>
                        <div class="field-error" *ngIf="regSubmitted() && !regForm.password">{{ 'landing.contact.reg.pwdErr' | translate }}</div>
                      </div>

                      <!-- Farm Details -->
                      <div class="form-row">
                        <div class="form-group">
                          <label for="farmType">{{ 'landing.contact.reg.farm' | translate }} <span class="required">*</span></label>
                          <div class="input-wrap select-wrap">
                            <span class="input-icon material-icons">eco</span>
                            <select id="farmType" name="farmType" [(ngModel)]="regForm.farmType" required [class.invalid]="regSubmitted() && !regForm.farmType">
                              <option value="small">{{ 'landing.contact.reg.farm1' | translate }}</option>
                              <option value="commercial">{{ 'landing.contact.reg.farm2' | translate }}</option>
                              <option value="cooperative">{{ 'landing.contact.reg.farm3' | translate }}</option>
                            </select>
                          </div>
                        </div>
                        <div class="form-group">
                          <label for="area">{{ 'landing.contact.reg.area' | translate }} <span class="required">*</span></label>
                          <div class="input-wrap">
                            <span class="input-icon material-icons">straighten</span>
                            <input type="number" id="area" name="area" [(ngModel)]="regForm.area" [placeholder]="'landing.contact.reg.areaPl' | translate" required min="0.1" [class.invalid]="regSubmitted() && !regForm.area">
                          </div>
                        </div>
                      </div>

                      <div class="form-group">
                        <label for="region">{{ 'landing.contact.reg.region' | translate }} <span class="required">*</span></label>
                        <div class="input-wrap">
                          <span class="input-icon material-icons">public</span>
                          <input type="text" id="region" name="region" [(ngModel)]="regForm.region" [placeholder]="'landing.contact.reg.regionPl' | translate" required [class.invalid]="regSubmitted() && !regForm.region">
                        </div>
                      </div>

                      <div class="privacy-notice">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        <span>{{ 'landing.contact.reg.admin' | translate }}</span>
                      </div>

                      <!-- Submit Register -->
                      <button type="submit" class="submit-btn" [class.loading]="regSending()" [disabled]="regSending()">
                        <span class="sb-content" *ngIf="!regSending()">
                          <span class="material-icons inline-icon">rocket_launch</span> {{ 'landing.contact.reg.submit' | translate }}
                        </span>
                        <span class="sb-loading" *ngIf="regSending()">
                          <span class="spinner"></span> {{ 'landing.contact.reg.submitting' | translate }}
                        </span>
                        <div class="btn-shine"></div>
                      </button>
                    </form>

                    <div class="field-error" style="margin-top: 1rem; text-align: center; color: #ef4444;" *ngIf="regError()">
                      {{regError()}}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </section>

        </div>

        <!-- Map / Location Section -->
        <section class="location-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.contact.loc.label' | translate }}</span>
              <h2>{{ 'landing.contact.loc.title' | translate }}</h2>
            </div>
            <div class="location-grid fade-in">
              <div class="loc-card" *ngFor="let loc of locations">
                <div class="loc-icon material-icons">{{loc.icon}}</div>
                <h4>{{loc.title | translate}}</h4>
                <p>{{loc.desc | translate}}</p>
              </div>
            </div>
          </div>
        </section>

        <!-- FAQ -->
        <section class="faq-section">
          <div class="container">
            <div class="section-header center">
              <span class="section-label">{{ 'landing.contact.faq.label' | translate }}</span>
              <h2>{{ 'landing.contact.faq.title' | translate }}</h2>
            </div>
            <div class="faq-grid">
              <div class="faq-item" *ngFor="let faq of faqs; let i = index" (click)="toggleFaq(faq)" [class.open]="faq.open">
                <div class="faq-q">
                  <span>{{ 'landing.contact.faqs.' + i + '.q' | translate }}</span>
                  <div class="faq-toggle">{{faq.open ? '−' : '+'}}</div>
                </div>
                <div class="faq-a" *ngIf="faq.open" [innerHTML]="'landing.contact.faqs.' + i + '.a' | translate"></div>
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
    /* Google Font Hint */
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Outfit:wght@700;800&display=swap');

    .page-wrapper {
      min-height: 100vh;
      background: #f3f7f3;
      font-family: 'Inter', 'Roboto', system-ui, sans-serif;
    }

    /* ===== HERO ===== */
    .contact-hero {
      position: relative;
      min-height: 56vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #052952;
      overflow: hidden;
      padding-top: 100px;
      padding-bottom: 3rem;
    }

    .contact-hero::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url('/assets/landing/images/bg5.avif');
      background-size: cover;
      background-position: center;
      opacity: 0.8;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(145deg, rgba(5,41,82,0.65) 0%, rgba(7,61,34,0.55) 100%);
    }

    .ch-glow {
      position: absolute;
      width: 500px;
      height: 500px;
      border-radius: 50%;
      pointer-events: none;
    }

    .ch-glow-left {
      top: -150px;
      left: -150px;
      background: radial-gradient(circle, rgba(16,185,129,0.15) 0%, transparent 70%);
      filter: blur(40px);
    }

    .ch-glow-right {
      bottom: -100px;
      right: -100px;
      background: radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 70%);
      filter: blur(60px);
    }

    .hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      padding: 2rem 1.5rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .page-label {
      display: inline-block;
      background: rgba(16,185,129,0.15);
      border: 1px solid rgba(16,185,129,0.35);
      color: #6ee7b7;
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      padding: 0.375rem 1.125rem;
      border-radius: 100px;
      margin-bottom: 1.5rem;
      backdrop-filter: blur(8px);
    }

    .hero-content h1 {
      font-size: clamp(2rem, 5.5vw, 3.75rem);
      font-weight: 800;
      color: white;
      line-height: 1.1;
      margin-bottom: 1.25rem;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .accent {
      background: linear-gradient(135deg, #6ee7b7 0%, #34d399 50%, #10b981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .hero-sub {
      font-size: 1.0625rem;
      color: rgba(255,255,255,0.72);
      max-width: 560px;
      margin: 0 auto 2rem;
      line-height: 1.65;
    }

    .hero-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      justify-content: center;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      color: rgba(255,255,255,0.85);
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 0.5rem 1rem;
      border-radius: 100px;
      backdrop-filter: blur(8px);
    }

    .badge-icon { font-size: 1rem; }

    /* ===== LAYOUT ===== */
    .page-main { padding-bottom: 0; }

    .contact-layout {
      max-width: 1300px;
      margin: 0 auto;
      padding: 0 1.5rem;
      display: grid;
      grid-template-columns: 1fr;
      gap: 2.5rem;
      padding-top: 4rem;
      padding-bottom: 5rem;
    }

    @media (min-width: 1024px) {
      .contact-layout {
        grid-template-columns: 400px 1fr;
        gap: 3rem;
        align-items: start;
      }
    }

    /* ===== INFO PANEL ===== */
    .contact-info {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .info-header h2 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 0.5rem;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .info-header p { font-size: 0.9375rem; color: #6b7280; line-height: 1.6; }

    .info-cards { display: flex; flex-direction: column; gap: 0.875rem; }

    .info-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: white;
      border: 1px solid rgba(16,185,129,0.1);
      border-radius: 18px;
      padding: 1.25rem;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.04);
    }

    .info-card:hover {
      border-color: rgba(16,185,129,0.3);
      box-shadow: 0 8px 24px rgba(16,185,129,0.1);
      transform: translateX(4px);
    }

    .ic-icon-wrap {
      width: 48px;
      height: 48px;
      min-width: 48px;
      border-radius: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.05);
      transition: all 0.3s ease;
    }
    .info-card:hover .ic-icon-wrap {
      transform: scale(1.1) rotate(5deg);
      box-shadow: 0 6px 15px rgba(16,185,129,0.3);
    }

    .ic-icon { font-size: 1.5rem; color: #10b981; }

    .ic-body { flex: 1; }
    .ic-label { font-size: 0.75rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin-bottom: 0.25rem; }
    .ic-value { font-size: 0.9375rem; font-weight: 600; color: #1f2937; margin-bottom: 0.125rem; }
    .ic-note { font-size: 0.8125rem; color: #6b7280; }

    /* Socials */
    .socials-block {
      background: white;
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(16,185,129,0.1);
    }

    .socials-block h4 { font-size: 0.875rem; font-weight: 700; color: #374151; margin-bottom: 1rem; }

    .social-icons {
      display: flex;
      flex-wrap: wrap;
      gap: 0.625rem;
    }

    .social-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      text-decoration: none;
      transition: all 0.25s ease;
      border: 1px solid transparent;
    }

    .social-btn:hover {
      transform: translateY(-3px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.15);
    }

    /* Project types */
    .project-types {
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border-radius: 20px;
      padding: 1.5rem;
      border: 1px solid rgba(16,185,129,0.15);
    }

    .project-types h4 { font-size: 0.875rem; font-weight: 700; color: #374151; margin-bottom: 1rem; }

    .pt-chips { display: flex; flex-direction: column; gap: 0.5rem; }

    .pt-chip {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }

    .pt-icon { font-size: 1.125rem; color: #10b981; transition: all 0.3s ease; }
    .pt-chip:hover .pt-icon { transform: scale(1.2); text-shadow: 0 0 10px rgba(16,185,129,0.4); }

    /* ===== FORM CARD ===== */
    .contact-form-section {}

    .form-card {
      background: white;
      border-radius: 28px;
      padding: 2.5rem;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
      border: 1px solid rgba(16,185,129,0.08);
      overflow: hidden; /* For sliding panes */
    }

    /* Switcher Toggle */
    .form-switcher {
      position: relative;
      background: #f3f4f6;
      border-radius: 100px;
      display: flex;
      padding: 6px;
      margin-bottom: 2rem;
    }

    .switcher-glider {
      position: absolute;
      top: 6px;
      left: 6px;
      height: calc(100% - 12px);
      width: calc(50% - 6px);
      background: linear-gradient(135deg, #10b981, #059669);
      border-radius: 100px;
      transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(16,185,129,0.3);
      z-index: 1;
    }

    .switcher-glider.right {
      transform: translateX(100%);
    }

    .switcher-btn {
      flex: 1;
      position: relative;
      z-index: 2;
      background: transparent;
      border: none;
      padding: 0.875rem 0;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #6b7280;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: color 0.3s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }

    .switcher-btn.active { color: white; }
    .sw-icon { font-size: 1.125rem; }

    /* Sliding Panes */
    .sliding-container {
      width: 100%;
      overflow: hidden;
    }

    .sliding-wrapper {
      display: flex;
      width: 200%;
      transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .sliding-wrapper.slide-left {
      transform: translateX(-50%);
    }

    .sliding-pane {
      width: 50%;
      padding: 0 2px; /* Prevent box-shadow clipping */
      flex-shrink: 0;
    }


    .form-header {
      margin-bottom: 2.5rem;
      padding-bottom: 1.5rem;
      border-bottom: 1px solid #f3f4f6;
    }

    .form-header h2 {
      font-size: 1.625rem;
      font-weight: 800;
      color: #1f2937;
      margin-bottom: 0.375rem;
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
    }

    .form-header p { font-size: 0.9rem; color: #10b981; font-weight: 600; }

    /* Form Fields */
    .cf { display: flex; flex-direction: column; gap: 1.5rem; }

    .form-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 600px) {
      .form-row { grid-template-columns: 1fr 1fr; }
    }

    .form-group { display: flex; flex-direction: column; gap: 0.5rem; }

    label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
      min-height: auto;
      display: flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0;
      cursor: default;
    }

    .required { color: #ef4444; }

    .input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      font-size: 1rem;
      pointer-events: none;
      z-index: 1;
    }

    input, select {
      width: 100%;
      padding: 0.875rem 1rem 0.875rem 3rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 14px;
      font-size: 0.9375rem;
      color: #1f2937;
      background: #f9fafb;
      transition: all 0.25s ease;
      font-family: 'Inter', system-ui, sans-serif;
    }

    input:focus, select:focus {
      outline: none;
      border-color: #10b981;
      background: white;
      box-shadow: 0 0 0 4px rgba(16,185,129,0.08);
    }

    input.invalid, select.invalid {
      border-color: #ef4444;
      box-shadow: 0 0 0 4px rgba(239,68,68,0.08);
    }

    .select-wrap::after {
      content: '▾';
      position: absolute;
      right: 1rem;
      color: #9ca3af;
      pointer-events: none;
      font-size: 0.75rem;
    }

    select {
      appearance: none;
      cursor: pointer;
    }

    .field-error {
      font-size: 0.8125rem;
      color: #ef4444;
      font-weight: 500;
      margin-top: -0.25rem;
    }

    /* Textarea */
    .textarea-wrap { position: relative; }

    textarea {
      width: 100%;
      padding: 1rem 1.25rem;
      border: 1.5px solid #e5e7eb;
      border-radius: 14px;
      font-size: 0.9375rem;
      color: #1f2937;
      background: #f9fafb;
      resize: vertical;
      font-family: 'Inter', system-ui, sans-serif;
      line-height: 1.6;
      transition: all 0.25s ease;
      min-height: 140px;
    }

    textarea:focus {
      outline: none;
      border-color: #10b981;
      background: white;
      box-shadow: 0 0 0 4px rgba(16,185,129,0.08);
    }

    textarea.invalid { border-color: #ef4444; }

    .char-count {
      position: absolute;
      bottom: 0.75rem;
      right: 1rem;
      font-size: 0.75rem;
      color: #9ca3af;
    }

    /* Privacy */
    .privacy-notice {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      font-size: 0.8125rem;
      color: #6b7280;
      background: #f9fafb;
      border-radius: 10px;
      padding: 0.875rem 1rem;
    }

    .privacy-notice svg { color: #10b981; flex-shrink: 0; }

    /* Submit Button */
    .submit-btn {
      position: relative;
      width: 100%;
      padding: 1.125rem 2rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      border-radius: 14px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      overflow: hidden;
      transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.625rem;
      font-family: 'Inter', system-ui, sans-serif;
      letter-spacing: 0.01em;
    }

    .submit-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 12px 32px rgba(16,185,129,0.4);
    }

    .submit-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .submit-btn:disabled {
      cursor: not-allowed;
      opacity: 0.8;
    }

    .submit-btn.loading {
      background: linear-gradient(135deg, #059669, #047857);
    }

    .btn-shine {
      position: absolute;
      top: 0;
      left: -100%;
      width: 60%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      transition: left 0.7s ease;
    }

    .submit-btn:hover .btn-shine { left: 150%; }

    .sb-content, .sb-loading, .sb-sent {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      position: relative;
      z-index: 1;
    }

    /* Spinner */
    .spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* Success Banner */
    .success-banner {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      background: linear-gradient(135deg, #f0fdf4, #ecfdf5);
      border: 1px solid rgba(16,185,129,0.3);
      border-radius: 16px;
      padding: 1.5rem;
      margin-top: 1.5rem;
    }

    .sb-emoji { font-size: 2.5rem; flex-shrink: 0; }
    .success-banner h4 { font-size: 1rem; font-weight: 700; color: #065f46; margin-bottom: 0.375rem; }
    .success-banner p { font-size: 0.875rem; color: #6b7280; line-height: 1.6; }

    /* ===== LOCATION ===== */
    .location-section {
      background: relative;
      background: #052952;
      padding: 5rem 0;
      position: relative;
      overflow: hidden;
    }
    .location-section::before {
      content: '';
      position: absolute;
      inset: 0;
      background-image: url('/assets/images/greenhouse.jpg');
      background-size: cover;
      background-position: center;
      opacity: 0.35;
      mix-blend-mode: overlay;
    }
    .location-section .container { position: relative; z-index: 2; }
    
    .container { max-width: 1200px; margin: 0 auto; padding: 0 1.5rem; }

    .section-header.center { text-align: center; margin-bottom: 3rem; }
    .section-label {
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }

    .location-section .section-label { color: #6ee7b7; }
    .location-section h2 { color: white; font-size: 2rem; font-weight: 800; margin-bottom: 0.75rem; font-family: 'Outfit', system-ui, sans-serif; }

    .location-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    @media (min-width: 640px) {
      .location-grid { grid-template-columns: repeat(3, 1fr); }
    }

    .loc-card {
      background: rgba(255,255,255,0.07);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      backdrop-filter: blur(10px);
      transition: all 0.3s ease;
    }

    .loc-card:hover {
      background: rgba(255,255,255,0.12);
      transform: translateY(-4px);
    }

    .loc-icon { font-size: 2.5rem; margin-bottom: 1rem; color: #34d399; text-shadow: 0 0 15px rgba(52,211,153,0.5); display: inline-block; transition: all 0.3s ease; }
    .loc-card:hover .loc-icon { transform: scale(1.1) rotate(-5deg); text-shadow: 0 0 25px rgba(52,211,153,0.8); color: #6ee7b7; }
    .loc-card h4 { font-size: 1rem; font-weight: 700; color: white; margin-bottom: 0.625rem; }
    .loc-card p { font-size: 0.875rem; color: rgba(255,255,255,0.65); line-height: 1.6; }

    /* ===== FAQ ===== */
    .faq-section {
      background: white;
      padding: 5rem 0;
    }

    .faq-section .section-label { color: #10b981; }
    .faq-section h2 { color: #1f2937; font-size: 2rem; font-weight: 800; margin-bottom: 0.75rem; font-family: 'Outfit', system-ui, sans-serif; }

    .faq-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      max-width: 800px;
      margin: 0 auto;
    }

    .faq-item {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .faq-item:hover { border-color: rgba(16,185,129,0.3); }
    .faq-item.open { border-color: rgba(16,185,129,0.4); background: #f0fdf4; }

    .faq-q {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding: 1.25rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #1f2937;
    }

    .faq-toggle {
      width: 28px;
      height: 28px;
      min-width: 28px;
      border-radius: 50%;
      background: rgba(16,185,129,0.1);
      color: #10b981;
      font-size: 1.25rem;
      font-weight: 400;
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .faq-a {
      padding: 0 1.5rem 1.25rem;
      font-size: 0.9rem;
      color: #6b7280;
      line-height: 1.7;
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
export class ContactComponent implements OnInit {
  activeTab = signal<'contact'|'register'>('contact');

  form: ContactForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    projectType: '',
    message: ''
  };

  regForm = {
    fullName: '',
    email: '',
    phone: '',
    password: '',
    farmType: 'small',
    area: null as number | null,
    region: ''
  };

  submitted = signal(false);
  sending = signal(false);
  sent = signal(false);

  regSubmitted = signal(false);
  regSending = signal(false);
  regError = signal('');

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  heroBadges = [
    { icon: 'bolt', text: 'landing.contact.badges.0' },
    { icon: 'free_cancellation', text: 'landing.contact.badges.1' },
    { icon: 'handshake', text: 'landing.contact.badges.2' }
  ];

  contactChannels = [
    {
      icon: 'email', label: 'landing.contact.channels.0.label',
      value: 'contact@feedingreen.com',
      note: 'landing.contact.channels.0.note',
      bg: 'rgba(16,185,129,0.08)'
    },
    {
      icon: 'phone', label: 'landing.contact.channels.1.label',
      value: '+216 xx xxx xxx',
      note: 'landing.contact.channels.1.note',
      bg: 'rgba(59,130,246,0.08)'
    },
    {
      icon: 'chat', label: 'landing.contact.channels.2.label',
      value: '+216 xx xxx xxx',
      note: 'landing.contact.channels.2.note',
      bg: 'rgba(37,211,102,0.08)'
    },
    {
      icon: 'location_on', label: 'landing.contact.channels.3.label',
      value: 'Technopôle Manouba, 2010 Manouba - Tunisie',
      note: 'landing.contact.channels.3.note',
      bg: 'rgba(245,158,11,0.08)'
    }
  ];

  socialLinks = [
    { name: 'landing.contact.socialLinks.0', icon: 'link', bg: '#0a66c2', color: 'white' },
    { name: 'landing.contact.socialLinks.1', icon: 'facebook', bg: '#1877f2', color: 'white' },
    { name: 'landing.contact.socialLinks.2', icon: 'camera_alt', bg: 'linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)', color: 'white' },
    { name: 'landing.contact.socialLinks.3', icon: 'share', bg: '#000', color: 'white' },
    { name: 'landing.contact.socialLinks.4', icon: 'chat', bg: '#25d366', color: 'white' }
  ];

  projectTypeChips = [
    { icon: 'construction', label: 'landing.contact.projectsItems.0' },
    { icon: 'location_city', label: 'landing.contact.projectsItems.1' },
    { icon: 'engineering', label: 'landing.contact.projectsItems.2' },
    { icon: 'school', label: 'landing.contact.projectsItems.3' },
    { icon: 'search', label: 'landing.contact.projectsItems.4' }
  ];

  locations = [
    { icon: 'location_on', title: 'landing.contact.locations.0.title', desc: 'landing.contact.locations.0.desc' },
    { icon: 'rocket_launch', title: 'landing.contact.locations.1.title', desc: 'landing.contact.locations.1.desc' },
    { icon: 'laptop_chromebook', title: 'landing.contact.locations.2.title', desc: 'landing.contact.locations.2.desc' }
  ];

  faqs: Array<{q: string; a: string; open: boolean}> = [
    {
      q: 'Quel est le délai de réponse à ma demande ?',
      a: 'Notre équipe s\'engage à vous répondre dans les 24 heures ouvrées suivant la réception de votre message. Pour les demandes urgentes, nous recommandons de nous appeler directement.',
      open: false
    },
    {
      q: 'Est-ce que l\'étude de projet est payante ?',
      a: 'Non, la première consultation et l\'étude de faisabilité préliminaire sont entièrement gratuites et sans engagement. Cette étape nous permet de comprendre votre projet et de vous proposer une solution adaptée.',
      open: false
    },
    {
      q: 'Intervenez-vous en dehors de l\'Algérie ?',
      a: 'Oui, <span class="jersey-10-regular">FEEDIN</span> intervient dans toute la région Maghreb (Algérie, Maroc, Tunisie) et étend progressivement sa présence dans la région MENA. Contactez-nous pour confirmer la disponibilité dans votre zone.',
      open: false
    },
    {
      q: 'Proposez-vous un financement pour les projets ?',
      a: 'Nous collaborons avec plusieurs partenaires financiers et pouvons vous orienter vers des dispositifs d\'aide et de financement agricole. Ce point est abordé lors de l\'étude de projet.',
      open: false
    },
    {
      q: 'Quels types de projets traitez-vous en priorité ?',
      a: 'Nous accompagnons tous types de projets : des petites serres individuelles aux installations industrielles, en passant par les projets d\'urban farming et les formations collectives. Chaque demande est étudiée avec la même attention.',
      open: false
    }
  ];

  ngOnInit(): void {
    this.route.fragment.subscribe(fragment => {
      if (fragment === 'register') {
        this.activeTab.set('register');
        setTimeout(() => {
          const formEl = document.querySelector('.contact-form-section');
          if (formEl) formEl.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 300);
      }
    });

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'register') {
        this.activeTab.set('register');
        setTimeout(() => {
          const formEl = document.querySelector('.contact-form-section');
          if (formEl) formEl.scrollIntoView({behavior: 'smooth', block: 'start'});
        }, 300);
      }
    });

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

  submitForm(): void {
    this.submitted.set(true);

    if (!this.form.firstName || !this.form.lastName || !this.form.email || !this.form.projectType || !this.form.message) {
      return;
    }

    this.sending.set(true);

    // Simulate API call
    setTimeout(() => {
      this.sending.set(false);
      this.sent.set(true);
    }, 1800);
  }

  submitRegisterForm(): void {
    this.regSubmitted.set(true);
    this.regError.set('');

    if (!this.regForm.fullName || !this.regForm.email || !this.regForm.password || !this.regForm.farmType || !this.regForm.area || !this.regForm.region) {
      return;
    }

    if (this.regForm.password.length < 6) {
      this.regError.set('landing.contact.reg.pwdErr2');
      return;
    }

    this.regSending.set(true);

    const nameParts = this.regForm.fullName.trim().split(/\s+/);
    const first_name = nameParts[0] || '';
    const last_name = nameParts.slice(1).join(' ') || first_name;

    const registrationData: RegisterRequest = {
      first_name,
      last_name,
      email: this.regForm.email,
      password: this.regForm.password,
      phone: this.regForm.phone || undefined,
      role: UserRole.FARMER,
      status: UserStatus.PENDING,
      farm_type: this.regForm.farmType as 'small' | 'commercial' | 'cooperative',
      area_hectares: this.regForm.area,
      region: this.regForm.region,
    };

    this.authService.register(registrationData).subscribe({
      next: () => {
        this.regSending.set(false);
        // AuthService internally handles redirect to /onboarding/pending
      },
      error: (error) => {
        this.regSending.set(false);
        let errorMessage = 'landing.contact.reg.fail';
        if (error?.error?.error?.message) {
          errorMessage = error.error.error.message;
        } else if (error?.error?.message) {
          errorMessage = error.error.message;
        } else if (error?.message) {
          errorMessage = error.message;
        }
        this.regError.set(errorMessage);
      }
    });
  }

  toggleFaq(faq: {q: string; a: string; open: boolean}): void {
    faq.open = !faq.open;
  }
}
