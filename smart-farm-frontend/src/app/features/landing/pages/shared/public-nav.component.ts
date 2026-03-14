import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  OnInit,
  OnDestroy,
  NgZone,
  effect
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule, DOCUMENT } from '@angular/common';
import { LanguageSwitcherComponent } from '../../../../shared/components/language-switcher/language-switcher.component';
import { ThemeService } from '../../../../core/services/theme.service';

import { TranslatePipe } from '../../../../core/pipes/translate.pipe';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, LanguageSwitcherComponent, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="public-nav" [class.scrolled]="isScrolled()">
      <div class="nav-inner">

        <!-- Brand -->
        <a class="nav-brand" routerLink="/landing">
          <div class="brand-icon">
            <img src="/assets/images/logos/only_F_small.png" alt="Feedin Logo" class="brand-logo"
                 width="34" height="30" loading="eager" fetchpriority="high" decoding="async">
          </div>
          <span class="brand-text jersey-10-regular">FEEDIN</span>
        </a>

        <!-- ✅ DESKTOP LINKS — always in DOM, always visible on ≥1024px, hidden on mobile -->
        <div class="desktop-links">
          <a class="nav-link" routerLink="/about"      routerLinkActive="active">{{ 'landing.nav.about' | translate }}</a>
          <a class="nav-link" routerLink="/services"   routerLinkActive="active">{{ 'landing.nav.services' | translate }}</a>
          <a class="nav-link" routerLink="/solutions"  routerLinkActive="active">{{ 'landing.nav.solutions' | translate }}</a>
          <a class="nav-link" routerLink="/formation"  routerLinkActive="active">{{ 'landing.nav.formation' | translate }}</a>
          <a class="nav-link" routerLink="/contact"    routerLinkActive="active">{{ 'landing.nav.contact' | translate }}</a>
        </div>

        <!-- Right Actions -->
        <div class="nav-actions">
          <app-language-switcher></app-language-switcher>
          <button class="nav-btn secondary desktop-only" (click)="go('/login')">{{ 'landing.nav.login' | translate }}</button>
          <button class="nav-btn primary cta-expert desktop-only" (click)="goToContactRegister()">
            <span class="cta-sparkle material-icons">auto_awesome</span>
            <span class="cta-label">{{ 'landing.nav.contactExpert' | translate }}</span>
            <span class="cta-arrow material-icons">arrow_forward</span>
          </button>
          <!-- Hamburger — mobile only -->
          <button class="hamburger mobile-only" (click)="toggleMenu()" [class.active]="mobileOpen()" aria-label="Menu">
            <span></span><span></span><span></span>
          </button>
        </div>
      </div>
    </nav>

    <!-- ✅ MOBILE FULL-SCREEN PANEL — only in the DOM when the menu is open.
         Using @if so there is ZERO DOM presence (no z-index, no compositing,
         no pointer-event capture) when the menu is closed. -->
    @if (mobileOpen()) {
      <div class="mobile-panel" (click)="$event.stopPropagation()">
        <!-- Close button -->
        <button class="mobile-close-btn" (click)="closeMenu()" aria-label="Close menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
               stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Navigation links -->
        <div class="mobile-nav-section">
          <span class="mobile-nav-label">{{ 'landing.nav.navigation' | translate }}</span>
          <a class="mob-link" routerLink="/about"     routerLinkActive="active" (click)="closeMenu()" style="animation-delay:0.05s">
            <svg class="mob-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <span>{{ 'landing.nav.about' | translate }}</span>
          </a>
          <a class="mob-link" routerLink="/services"  routerLinkActive="active" (click)="closeMenu()" style="animation-delay:0.15s">
            <svg class="mob-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
            <span>{{ 'landing.nav.services' | translate }}</span>
          </a>
          <a class="mob-link" routerLink="/solutions" routerLinkActive="active" (click)="closeMenu()" style="animation-delay:0.25s">
            <svg class="mob-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
            <span>{{ 'landing.nav.solutions' | translate }}</span>
          </a>
          <a class="mob-link" routerLink="/formation" routerLinkActive="active" (click)="closeMenu()" style="animation-delay:0.35s">
            <svg class="mob-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
            <span>{{ 'landing.nav.formation' | translate }}</span>
          </a>
          <a class="mob-link" routerLink="/contact"   routerLinkActive="active" (click)="closeMenu()" style="animation-delay:0.45s">
            <svg class="mob-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>{{ 'landing.nav.contact' | translate }}</span>
          </a>
        </div>

        <!-- Action CTA -->
        <div class="mobile-action-section">
          <span class="mobile-nav-label">{{ 'landing.nav.actions' | translate }}</span>
          <button class="mobile-cta-btn primary cta-expert-mobile" (click)="goToContactRegister(); closeMenu()">
            <span class="cta-sparkle material-icons">auto_awesome</span>
            <span class="cta-label">{{ 'landing.nav.contactExpert' | translate }}</span>
            <span class="cta-arrow material-icons">arrow_forward</span>
          </button>
          <span class="mobile-cta-hint">{{ 'landing.nav.responseUnder24h' | translate }}</span>
          <button class="mobile-cta-btn secondary"  (click)="go('/login');    closeMenu()">{{ 'landing.nav.login' | translate }}</button>
        </div>

        <!-- Footer -->
        <div class="mobile-nav-footer">
          <div class="mobile-social-icons">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </div>
          <span class="mobile-copyright">&copy; 2026 Feedin Green. {{ 'landing.nav.allRightsReserved' | translate }}</span>
        </div>
      </div>

      <!-- Backdrop — closes menu on tap outside -->
      <div class="mobile-backdrop" (click)="closeMenu()"></div>
    }
  `,
  styles: [`
    /* ================================
       PUBLIC NAV — Mobile-First
       ================================ */
    .public-nav {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 1000;
      padding: 0.75rem 1rem;
      transition: all 0.3s ease;
    }

    .public-nav.scrolled .nav-inner {
      background: rgba(255,255,255,0.97);
      box-shadow: 0 4px 24px rgba(0,0,0,0.1);
    }

    .nav-inner {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 1.25rem;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 100px;
      backdrop-filter: blur(20px);
      box-shadow: 0 4px 20px rgba(0,0,0,0.08);
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    /* Brand */
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      cursor: pointer;
      flex-shrink: 0;
    }
    .brand-icon {
      width: 34px; height: 34px;
      display: flex; align-items: center; justify-content: center;
      background: var(--glass-bg);
      border: 1px solid var(--glass-border);
      border-radius: 10px;
    }
    .brand-logo { width: 100%; height: 100%; object-fit: contain; }
    .brand-text {
      font-size: 1rem; font-weight: 800; letter-spacing: -0.01em;
      color: var(--text-primary);
      font-family: 'Outfit', 'Inter', system-ui, sans-serif;
      white-space: nowrap;
    }

    /* ================================
       DESKTOP LINKS — always in DOM,
       hidden on mobile via display:none
       ================================ */
    .desktop-links {
      display: none; /* hidden on mobile */
      flex-direction: row;
      gap: 0.25rem;
      align-items: center;
    }

    /* Shared nav-link style (desktop row) */
    .nav-link {
      color: var(--text-secondary);
      text-decoration: none;
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-size: 0.875rem;
      font-weight: 500;
      padding: 0.5rem 0.75rem;
      border-radius: 10px;
      transition: all 0.25s ease;
      white-space: nowrap;
    }
    .nav-link:hover  { background: rgba(16,185,129,0.08); color: var(--primary-green, #10b981); }
    .nav-link.active { background: rgba(16,185,129,0.08); color: var(--primary-green, #10b981); }
    .nav-link.active::before {
      content: '';
      display: block;
      width: 4px; height: 4px;
      border-radius: 50%;
      background: var(--primary-green, #10b981);
      margin: 0 auto;
    }

    /* ================================
       RIGHT ACTIONS
       ================================ */
    .nav-actions {
      display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0;
    }
    .nav-btn {
      border: none; border-radius: 100px;
      font-weight: 500; font-size: 0.8125rem;
      cursor: pointer; transition: all 0.25s ease;
      white-space: nowrap;
      font-family: system-ui, -apple-system, sans-serif;
    }
    .nav-btn.primary  {
      padding: 0.625rem 1.25rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      border-top: 1px solid rgba(255,255,255,0.4);
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-weight: 600;
      letter-spacing: -0.01em;
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }
    .nav-btn.primary:hover  {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 14px 20px -3px rgba(16, 185, 129, 0.45);
      transform: scale(1.03);
    }
    .nav-btn.primary:active {
      transform: scale(0.98) translateY(1px);
      box-shadow: 0 6px 10px -3px rgba(16, 185, 129, 0.25);
    }
    /* Sparkle icon */
    .cta-sparkle {
      font-size: 1rem;
      transition: transform 0.3s ease;
    }
    .nav-btn.primary:hover .cta-sparkle {
      transform: rotate(15deg) scale(1.1);
    }
    /* Arrow icon — hidden by default, slides in on hover */
    .cta-arrow {
      font-size: 0.875rem;
      opacity: 0;
      width: 0;
      transform: translateX(-8px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
    }
    .nav-btn.primary:hover .cta-arrow {
      opacity: 1;
      width: 1rem;
      transform: translateX(0);
    }
    .nav-btn.secondary { padding: 0.625rem 1rem; background: transparent; color: var(--text-primary); }
    .nav-btn.secondary:hover { color: var(--primary-green); }
    .desktop-only { display: none; }

    /* Hamburger */
    .hamburger {
      display: flex; flex-direction: column; gap: 4px;
      background: none; border: none; cursor: pointer; padding: 8px;
      min-height: auto; min-width: auto;
    }
    .hamburger span {
      display: block; width: 20px; height: 2px;
      background: var(--text-primary); border-radius: 2px;
      transition: all 0.3s ease; transform-origin: center;
    }
    .hamburger.active span:nth-child(1) { transform: rotate(45deg) translate(4px, 4px); }
    .hamburger.active span:nth-child(2) { opacity: 0; transform: scaleX(0); }
    .hamburger.active span:nth-child(3) { transform: rotate(-45deg) translate(4px, -4px); }

    /* ================================
       MOBILE FULL-SCREEN PANEL
       Only rendered via @if(mobileOpen())
       => ZERO DOM presence when closed
       ================================ */
    .mobile-panel {
      position: fixed;
      inset: 0;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      /* Glassmorphism — safe here because element is only in DOM when visible */
      background: rgba(255, 255, 255, 0.88);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      border: 1px solid rgba(255, 255, 255, 0.5);
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.6), 0 0 80px rgba(0,0,0,0.06);
      animation: panelSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) both;
    }

    /* Backdrop behind the panel */
    .mobile-backdrop {
      position: fixed;
      inset: 0;
      z-index: 1999;
      background: rgba(0,0,0,0.15);
    }

    @keyframes panelSlideIn {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Close Button */
    .mobile-close-btn {
      position: absolute;
      top: 1.25rem; right: 1.25rem;
      width: 44px; height: 44px;
      border-radius: 50%;
      background: rgba(255,255,255,0.6);
      border: 1px solid rgba(255,255,255,0.8);
      backdrop-filter: blur(10px);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; color: #1e293b;
      transition: all 0.25s ease; z-index: 10;
    }
    .mobile-close-btn:hover { background: rgba(255,255,255,0.85); transform: rotate(90deg); }

    /* Mobile nav section */
    .mobile-nav-section {
      display: flex; flex-direction: column;
      padding: 5rem 2rem 1.5rem 3rem;
      gap: 0.35rem; flex: 1;
    }
    .mobile-nav-label {
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-size: 0.6875rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.12em;
      color: #94a3b8; padding: 0 0.75rem; margin-bottom: 0.75rem;
    }

    /* Mobile link items */
    .mob-link {
      color: #1e293b;
      text-decoration: none;
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-weight: 600; font-size: 1.5rem;
      padding: 1rem 0.75rem; border-radius: 16px;
      display: flex; align-items: center; gap: 0.875rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      animation: mobLinkIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) both;
    }
    .mob-link:hover { color: var(--primary-green, #10b981); background: rgba(16,185,129,0.06); padding-left: 1rem; }
    .mob-link.active { color: var(--primary-green, #10b981); }
    .mob-link.active::before {
      content: '';
      position: absolute; left: 0.25rem; top: 50%; transform: translateY(-50%);
      width: 6px; height: 6px; border-radius: 50%;
      background: var(--primary-green, #10b981);
      box-shadow: 0 0 8px rgba(16,185,129,0.55);
    }
    .mob-icon { flex-shrink: 0; stroke: #475569; transition: stroke 0.2s ease; }
    .mob-link:hover .mob-icon { stroke: var(--primary-green, #10b981); }
    .mob-link.active .mob-icon { stroke: var(--primary-green, #10b981); }

    @keyframes mobLinkIn {
      from { opacity: 0; transform: translateX(20px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    /* Mobile action section */
    .mobile-action-section {
      display: flex; flex-direction: column; gap: 0.75rem;
      padding: 1.5rem 2rem 1rem 3rem;
      border-top: 1px solid rgba(148,163,184,0.15);
      animation: mobFadeUp 0.5s ease 0.5s both;
    }
    .mobile-action-section .mobile-nav-label { margin-bottom: 0.5rem; }
    .mobile-cta-btn {
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-size: 1rem; font-weight: 600; border-radius: 14px;
      cursor: pointer; transition: all 0.3s cubic-bezier(0.4,0,0.2,1);
      text-align: center; width: 100%;
    }
    .mobile-cta-btn.primary {
      padding: 1rem 1.5rem;
      min-height: 48px;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: #fff;
      border: none;
      border-top: 1px solid rgba(255,255,255,0.4);
      box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-weight: 600;
      letter-spacing: -0.01em;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      border-radius: 1rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }
    .mobile-cta-btn.primary:hover {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
      box-shadow: 0 14px 24px -3px rgba(16, 185, 129, 0.45);
      transform: scale(1.03) translateY(-1px);
    }
    .mobile-cta-btn.primary:active {
      transform: scale(0.98) translateY(1px);
      box-shadow: 0 6px 10px -3px rgba(16, 185, 129, 0.25);
    }
    .mobile-cta-btn.primary .cta-sparkle {
      font-size: 1.125rem;
      transition: transform 0.3s ease;
    }
    .mobile-cta-btn.primary .cta-arrow {
      font-size: 1rem;
      opacity: 0.7;
      transition: transform 0.3s ease;
    }
    .mobile-cta-btn.primary:hover .cta-sparkle {
      transform: rotate(15deg) scale(1.1);
    }
    .mobile-cta-btn.primary:hover .cta-arrow {
      transform: translateX(4px);
      opacity: 1;
    }
    /* Mobile hint caption */
    .mobile-cta-hint {
      font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
      font-size: 0.6875rem;
      color: #94a3b8;
      text-align: center;
      opacity: 0.7;
      margin-top: -0.25rem;
    }
    .mobile-cta-btn.secondary {
      padding: 0.875rem 1.5rem; background: transparent;
      color: #1e293b; border: 1.5px solid rgba(30,41,59,0.2);
    }
    .mobile-cta-btn.secondary:hover { border-color: var(--primary-green,#10b981); color: var(--primary-green,#10b981); background: rgba(16,185,129,0.04); }

    /* Mobile footer */
    .mobile-nav-footer {
      display: flex; flex-direction: column; align-items: center;
      gap: 0.625rem; padding: 1rem 2rem 2rem;
      animation: mobFadeUp 0.5s ease 0.55s both;
    }
    .mobile-social-icons { display: flex; gap: 1.25rem; align-items: center; }
    .mobile-social-icons svg { stroke: #94a3b8; transition: stroke 0.2s ease; cursor: pointer; }
    .mobile-social-icons svg:hover { stroke: #475569; }
    .mobile-copyright { font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif; font-size: 0.6875rem; color: #94a3b8; letter-spacing: 0.01em; }

    @keyframes mobFadeUp {
      from { opacity: 0; transform: translateY(8px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    /* ================================
       DESKTOP (≥1024px)
       ================================ */
    @media (min-width: 1024px) {
      .desktop-links  { display: flex; }
      .desktop-only   { display: inline-flex; }
      .hamburger      { display: none; }
    }

    /* ================================
       TABLET (≥768px) — mobile panel
       ================================ */
    @media (min-width: 768px) {
      .mobile-nav-section    { padding: 6rem 4rem 2rem 5rem; }
      .mobile-action-section { padding: 1.5rem 4rem 1rem 5rem; max-width: 420px; }
    }
  `]
})
export class PublicNavComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ngZone = inject(NgZone);
  private themeService = inject(ThemeService);
  private document = inject(DOCUMENT);

  isScrolled = signal(false);
  mobileOpen = signal(false);

  private scrollHandler = () => {
    const scrolled = window.scrollY > 50;
    if (scrolled !== this.isScrolled()) {
      this.ngZone.run(() => this.isScrolled.set(scrolled));
    }
  };

  private resizeHandler = () => {
    if (window.innerWidth >= 1024 && this.mobileOpen()) {
      this.ngZone.run(() => this.mobileOpen.set(false));
    }
  };

  private previousTheme: any = null;

  /**
   * Effect to lock/unlock body scroll when the mobile menu is open/closed.
   */
  private scrollLockEffect = effect(() => {
    const isOpen = this.mobileOpen();
    if (this.document?.body) {
      if (isOpen) {
        this.document.body.style.overflow = 'hidden';
        this.document.body.style.touchAction = 'none';
      } else {
        this.document.body.style.overflow = '';
        this.document.body.style.touchAction = '';
      }
    }
  });

  ngOnInit(): void {
    window.scrollTo(0, 0);
    if (this.themeService.currentTheme !== 'light') {
      this.previousTheme = this.themeService.currentTheme;
      this.themeService.setTheme('light', false, false);
    }
    this.ngZone.runOutsideAngular(() => {
      window.addEventListener('scroll', this.scrollHandler, { passive: true });
      window.addEventListener('resize', this.resizeHandler, { passive: true });
    });
    this.scrollHandler();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.scrollHandler);
    window.removeEventListener('resize', this.resizeHandler);
    if (this.previousTheme) {
      this.themeService.setTheme(this.previousTheme, false, false);
    }

    // Ensure body scroll is restored on destroy
    if (this.document?.body) {
      this.document.body.style.overflow = '';
      this.document.body.style.touchAction = '';
    }
  }

  toggleMenu(): void { this.mobileOpen.update(v => !v); }
  closeMenu(): void { this.mobileOpen.set(false); }
  go(path: string): void { this.router.navigate([path]); }

  /**
   * Navigate to the contact page with the 'register' (Demander un accès) tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}
