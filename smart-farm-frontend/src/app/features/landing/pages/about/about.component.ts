import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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
    PublicNavComponent,
    LandingFooterComponent,
    ScrollToTopComponent,
    TranslatePipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-wrapper">
      <app-public-nav></app-public-nav>

      <!-- SECTION 1: HERO -->
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
          <span class="page-label">{{ 'landing.about.hero.label' | translate }}</span>
          <h1 [innerHTML]="'landing.about.hero.title' | translate"></h1>
          <p class="hero-sub">{{ 'landing.about.hero.sub' | translate }}</p>
        </div>
      </header>

      <main class="page-main">
        
        <!-- SECTION 2: QUI SOMMES-NOUS / WHO WE ARE -->
        <section class="section who-section">
          <div class="container">
            <div class="two-col-grid">
              
              <!-- Left Column: Left-Aligned Text Block -->
              <div class="col-text fade-in">
                <span class="small-label">QUI SOMMES-NOUS</span>
                <h2 class="section-title-left">Une entreprise née du terrain</h2>
                
                <!-- Explicitly styled left-aligned paragraph matching stat label font family & size -->
                <div class="about-paragraph-content">
                  <p>FEED IN GREEN est une entreprise spécialisée dans les solutions Agritech intelligentes et l'agriculture connectée.</p>
                  <p>Nous accompagnons les agriculteurs, entrepreneurs, entreprises et collectivités dans la conception et le déploiement de projets agricoles innovants, durables et performants.</p>
                  <p>Notre approche repose sur la combinaison de technologies avancées, de l'ingénierie agricole et d'un accompagnement terrain adapté aux réalités locales et urbaines.</p>
                </div>
              </div>

              <!-- Right Column: Stats Grid (2x2) with Dashes -->
              <div class="col-visual fade-in">
                <div class="stats-grid-2x2">
                  <div class="stat-card" *ngFor="let s of stats; let i = index">
                    <div class="stat-icon-wrapper">
                      <span class="material-icons stat-icon">{{ s.icon }}</span>
                    </div>
                    <div class="stat-number-wrapper">
                      <!-- Subtle pulse animation on dashes placeholder -->
                      <span class="stat-number-dashes">{{ s.value }}</span>
                    </div>
                    <div class="stat-label-text">{{ s.label | translate }}</div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        <!-- SECTION 3: POURQUOI NOUS CHOISIR / WHY CHOOSE US -->
        <section class="section choose-section">
          <div class="container">
            <div class="choose-grid">
              
              <!-- Left Column: Core Text + Tag Pills -->
              <div class="choose-text-block fade-in">
                <span class="small-label">POURQUOI NOUS CHOISIR</span>
                <h2 class="section-title-left">L'agriculture mérite les meilleurs outils</h2>
                
                <p class="choose-desc">
                  Feedin est né d'une conviction simple : l'agriculture mérite les meilleurs outils. 
                  Nous concevons des serres connectées, des systèmes d'automatisation et des 
                  formations pour que chaque agriculteur puisse travailler avec précision, 
                  sérénité et efficacité.
                </p>
                <p class="choose-desc">
                  Nous ne vendons pas des gadgets. Nous construisons des partenariats durables 
                  avec des professionnels qui veulent aller plus loin.
                </p>

                <div class="tag-pills-container">
                  <span class="tag-pill">Sur mesure</span>
                  <span class="tag-pill">Solution à la tunisienne</span>
                  <span class="tag-pill">Support réactif</span>
                </div>
              </div>

              <!-- Right Column: Visual Cutout Mask + Floating Stats (8+ Years / 98% Satisfaction) -->
              <div class="choose-visual-block fade-in">
                
                <!-- [IMAGE PLACEHOLDER: IMG-ABOUT-5]
                     Description: FEED IN GREEN text cutout over field photo
                     Section: Pourquoi Nous Choisir side visual
                     Recommended: 1200×800px, PNG with mask
                     Source: Client to provide
                -->
                <div class="cutout-image-container">
                  <div class="cutout-bg-image"></div>
                  <div class="cutout-overlay"></div>
                  <div class="cutout-text-mask">FEED IN GREEN</div>

                  <!-- Floating Stat 1: 8+ Years -->
                  <div class="floating-stat-card stat-card-left">
                    <div class="floating-stat-value">8+</div>
                    <div class="floating-stat-label">Années d'expertise agricole</div>
                  </div>

                  <!-- Floating Stat 2: 98% Satisfaction -->
                  <div class="floating-stat-card stat-card-right">
                    <div class="floating-stat-value">98%</div>
                    <div class="floating-stat-label">Clients satisfaits</div>
                  </div>
                </div>

              </div>

            </div>
          </div>
        </section>

        <!-- SECTION 4: NOS VALEURS / OUR VALUES -->
        <section class="section values-section">
          <div class="container">
            
            <!-- [IMAGE PLACEHOLDER: IMG-ABOUT-1]
                 Description: Smart greenhouse interior with pink LED grow lights
                 Section: Nos Valeurs background
                 Recommended: 1920×1080px, JPG, vibrant colors
                 Source: Client to provide
            -->
            <div class="values-tinted-container fade-in">
              <div class="values-background-image"></div>
              <div class="values-tint-overlay"></div>
              
              <div class="values-header">
                <span class="values-pill-label">NOS VALEURS</span>
                <h2 class="values-title">Ce qui nous anime</h2>
              </div>

              <div class="values-cards-grid">
                
                <!-- Card 1: Innovation -->
                <!-- [IMAGE PLACEHOLDER: IMG-ABOUT-2]
                     Description: Field technician with farmer examining crops using tablet
                     Section: Nos Valeurs Card 1 (Innovation) Background
                     Recommended: 800×600px, JPG
                     Source: Client to provide
                -->
                <div class="value-card">
                  <div class="value-card-bg card-bg-1"></div>
                  <div class="value-card-overlay"></div>
                  <div class="value-card-content">
                    <div class="value-icon-box">
                      <span class="material-icons">memory</span>
                    </div>
                    <h3 class="value-card-title">Innovation</h3>
                    <p class="value-card-desc">Construire les outils de demain pour les agriculteurs d'aujourd'hui.</p>
                  </div>
                </div>

                <!-- Card 2: Proximité -->
                <!-- [IMAGE PLACEHOLDER: IMG-ABOUT-2]
                     Description: Field technician with farmer examining crops using tablet
                     Section: Nos Valeurs Card 2 (Proximité) Background
                     Recommended: 800×600px, JPG
                     Source: Client to provide
                -->
                <div class="value-card">
                  <div class="value-card-bg card-bg-2"></div>
                  <div class="value-card-overlay"></div>
                  <div class="value-card-content">
                    <div class="value-icon-box">
                      <span class="material-icons">handshake</span>
                    </div>
                    <h3 class="value-card-title">Proximité</h3>
                    <p class="value-card-desc">Être toujours à l'écoute de nos clients sur le terrain.</p>
                  </div>
                </div>

                <!-- Card 3: Durabilité -->
                <!-- [IMAGE PLACEHOLDER: IMG-ABOUT-3]
                     Description: Solar panels over green agricultural field
                     Section: Nos Valeurs Card 3 (Durabilité) Background
                     Recommended: 800×600px, JPG
                     Source: Client to provide
                -->
                <div class="value-card">
                  <div class="value-card-bg card-bg-3"></div>
                  <div class="value-card-overlay"></div>
                  <div class="value-card-content">
                    <div class="value-icon-box">
                      <span class="material-icons">recycling</span>
                    </div>
                    <h3 class="value-card-title">Durabilité</h3>
                    <p class="value-card-desc">Préserver les ressources pour les générations futures.</p>
                  </div>
                </div>

                <!-- Card 4: Fiabilité -->
                <!-- [IMAGE PLACEHOLDER: IMG-ABOUT-4]
                     Description: Galvanized steel greenhouse structure
                     Section: Nos Valeurs Card 4 (Fiabilité) Background
                     Recommended: 800×600px, JPG
                     Source: Client to provide
                -->
                <div class="value-card">
                  <div class="value-card-bg card-bg-4"></div>
                  <div class="value-card-overlay"></div>
                  <div class="value-card-content">
                    <div class="value-icon-box">
                      <span class="material-icons">verified</span>
                    </div>
                    <h3 class="value-card-title">Fiabilité</h3>
                    <p class="value-card-desc">Du matériel robuste qui résiste à l'épreuve du temps.</p>
                  </div>
                </div>

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

      :root {
        --about-primary: #15803d;
        --about-primary-light: #22c55e;
        --about-primary-glow: #4ade80;
        --about-bg-light: #f0fdf4;
        --about-text-dark: #0f172a;
        --about-text-body: #475569;
        --about-text-muted: #64748b;
        --about-white-glass: rgba(255, 255, 255, 0.1);
        --about-border-glass: rgba(255, 255, 255, 0.15);
        --about-green-tint: rgba(21, 128, 61, 0.85);
      }

      .page-wrapper {
        min-height: 100vh;
        background: #f8faf8;
        font-family: 'Inter', 'Roboto', system-ui, sans-serif;
        color: #334155;
        overflow-x: hidden;
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
        padding-top: var(--nav-height, 80px);
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
        animation: float-slow 6s ease-in-out infinite;
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

      .hero-content {
        position: relative;
        z-index: 2;
        text-align: center;
        max-width: 800px;
        margin: 0 auto;
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
        max-width: 560px;
        margin: 0 auto;
        line-height: 1.65;
        font-weight: 500; /* Medium weight for readability */
        text-shadow: 0 2px 5px rgba(0, 0, 0, 0.7); /* Deep text shadow */
      }

      /* ---- COMMON LAYOUT ---- */
      .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 0 1.5rem;
      }

      .section {
        padding: 6rem 0;
      }

      .small-label {
        display: inline-block;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: #15803d;
        margin-bottom: 0.75rem;
      }

      .section-title-left {
        font-size: clamp(2rem, 4vw, 2.75rem);
        font-weight: 800;
        color: #0f172a;
        line-height: 1.2;
        margin-bottom: 1.5rem;
        font-family: 'Outfit', sans-serif;
        text-align: left;
      }

      /* ---- SECTION 2: QUI SOMMES-NOUS ---- */
      .who-section {
        background: white;
      }

      .two-col-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4rem;
        align-items: center;
      }

      @media (min-width: 1024px) {
        .two-col-grid {
          grid-template-columns: 55fr 45fr;
        }
      }

      .about-paragraph-content {
        text-align: left;
      }

      .about-paragraph-content p {
        font-family: 'Inter', 'Roboto', system-ui, sans-serif;
        font-size: 1.05rem; /* Matches stat label hierarchy font size */
        line-height: 1.7;
        color: #475569;
        margin-bottom: 1.25rem;
        text-align: left;
      }

      .about-paragraph-content p:last-child {
        margin-bottom: 0;
      }

      /* Stats Grid */
      .stats-grid-2x2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .stat-card {
        background: #f0fdf4;
        border: 1px solid rgba(21, 128, 61, 0.1);
        border-radius: 1rem;
        padding: 1.75rem 1.5rem;
        text-align: left;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
        transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease;
        display: flex;
        flex-direction: column;
      }

      .stat-card:hover {
        transform: translateY(-5px);
        box-shadow: 0 12px 30px rgba(21, 128, 61, 0.08);
      }

      .stat-icon-wrapper {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: white;
        border-radius: 0.75rem;
        margin-bottom: 1.25rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
      }

      .stat-icon {
        font-size: 2rem;
        color: #22c55e;
      }

      .stat-number-wrapper {
        margin-bottom: 0.5rem;
      }

      .stat-number-dashes {
        font-size: clamp(2.2rem, 3.5vw, 2.8rem);
        font-weight: 800;
        color: #0f172a;
        font-family: 'Outfit', sans-serif;
        line-height: 1;
        letter-spacing: -0.02em;
        animation: pulse-dashes 2s infinite ease-in-out;
        display: inline-block;
      }

      .stat-label-text {
        font-size: 0.9rem;
        font-weight: 400;
        color: #64748b;
        line-height: 1.4;
      }

      /* ---- SECTION 4: NOS VALEURS ---- */
      .values-section {
        background: #f8faf8;
      }

      .values-tinted-container {
        position: relative;
        border-radius: 1.5rem;
        padding: 4rem 3rem;
        margin: 0 auto;
        max-width: 1200px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06);
      }

      /* Parallax Background */
      .values-background-image {
        position: absolute;
        inset: 0;
        background-image: url('/assets/landing/images/serre.jpg');
        background-size: cover;
        background-position: center;
        background-attachment: scroll;
        z-index: 1;
      }

      @media (min-width: 1024px) {
        .values-background-image {
          background-attachment: fixed; /* Parallax effect */
        }
      }

      .values-tint-overlay {
        position: absolute;
        inset: 0;
        background-color: rgba(21, 128, 61, 0.45); /* Reduced overlay opacity to make picture clearer */
        backdrop-filter: blur(2px); /* Limit to 2px max so background is recognizable */
        -webkit-backdrop-filter: blur(2px);
        z-index: 2;
      }

      .values-header {
        position: relative;
        z-index: 3;
        text-align: center;
        margin-bottom: 3.5rem;
      }

      .values-pill-label {
        display: inline-block;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.25);
        color: white;
        font-size: 0.75rem;
        font-weight: 700;
        letter-spacing: 0.1em;
        padding: 0.4rem 1.25rem;
        border-radius: 100px;
        margin-bottom: 0.75rem;
      }

      .values-title {
        font-size: clamp(2rem, 3.5vw, 2.75rem);
        font-weight: 800;
        color: white;
        font-family: 'Outfit', sans-serif;
        margin: 0;
      }

      .values-cards-grid {
        position: relative;
        z-index: 3;
        display: grid;
        grid-template-columns: 1fr;
        gap: 2rem;
      }

      @media (min-width: 768px) {
        .values-cards-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      /* Glassmorphism Value Cards */
      .value-card {
        position: relative;
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 1rem;
        padding: 2.25rem 2rem;
        overflow: hidden;
        backdrop-filter: blur(8px); /* Card-only blur */
        -webkit-backdrop-filter: blur(8px);
        transition: transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
      }

      /* Specific Card Background Images (low opacity inside card) */
      .value-card-bg {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        opacity: 0.08;
        z-index: 1;
        transition: transform 0.6s ease;
      }

      .card-bg-1 { background-image: url('/assets/landing/images/agri-ai.jpg'); }
      .card-bg-2 { background-image: url('/assets/landing/images/mission.jpg'); }
      .card-bg-3 { background-image: url('/assets/landing/images/urban-farming.jpg'); }
      .card-bg-4 { background-image: url('/assets/landing/images/serre.jpg'); }

      .value-card-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, rgba(21, 128, 61, 0.1) 0%, rgba(21, 128, 61, 0.4) 100%);
        z-index: 2;
      }

      .value-card-content {
        position: relative;
        z-index: 3;
      }

      .value-card:hover {
        transform: translateY(-4px);
        border-color: rgba(255, 255, 255, 0.35);
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
      }

      .value-card:hover .value-card-bg {
        transform: scale(1.08);
      }

      .value-icon-box {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: rgba(255, 255, 255, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.75rem;
        margin-bottom: 1.5rem;
        color: white;
        transition: transform 0.3s ease;
      }

      .value-card:hover .value-icon-box {
        transform: scale(1.1);
        background: #22c55e;
        border-color: #4ade80;
        box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
      }

      .value-icon-box span {
        font-size: 1.8rem;
      }

      .value-card-title {
        font-size: 1.3rem;
        font-weight: 700;
        color: white;
        margin-bottom: 0.75rem;
        font-family: 'Outfit', sans-serif;
      }

      .value-card-desc {
        font-size: 0.95rem;
        color: #e2e8f0;
        line-height: 1.6;
        margin: 0;
      }

      /* ---- SECTION 3: POURQUOI NOUS CHOISIR ---- */
      .choose-section {
        background: white;
      }

      .choose-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 4rem;
        align-items: center;
      }

      @media (min-width: 1024px) {
        .choose-grid {
          grid-template-columns: 1fr 1fr;
        }
      }

      .choose-desc {
        font-size: 1.05rem;
        line-height: 1.7;
        color: #475569;
        margin-bottom: 1.5rem;
      }

      .tag-pills-container {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 2rem;
      }

      .tag-pill {
        background: #f0fdf4;
        border: 1px solid #bbf7d0;
        color: #15803d;
        padding: 0.5rem 1.25rem;
        border-radius: 9999px;
        font-size: 0.85rem;
        font-weight: 600;
        display: inline-block;
        transition: all 0.25s ease;
      }

      .tag-pill:hover {
        background: #dcfce7;
        transform: translateY(-1px);
      }

      /* Side Visual: Cutout Mask & Floating stats */
      .choose-visual-block {
        position: relative;
        width: 100%;
        padding: 2rem 0;
      }

      .cutout-image-container {
        position: relative;
        width: 100%;
        height: 420px;
        border-radius: 1.5rem;
        overflow: visible; /* Required to allow floating cards to overflow */
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.08);
      }

      .cutout-bg-image {
        position: absolute;
        inset: 0;
        background-image: url('/assets/landing/images/propos.png');
        background-size: cover;
        background-position: center;
        border-radius: 1.5rem;
        z-index: 1;
        transition: transform 0.5s ease, filter 0.5s ease;
        filter: blur(10px); /* Initially blurred for loading effect */
      }

      .cutout-bg-image.loaded {
        filter: blur(0px); /* Blur reveal transition */
      }

      .cutout-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(135deg, rgba(21, 128, 61, 0.3) 0%, rgba(15, 23, 42, 0.4) 100%);
        border-radius: 1.5rem;
        z-index: 2;
      }

      .cutout-text-mask {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Outfit', sans-serif;
        font-size: clamp(2rem, 5vw, 3.2rem);
        font-weight: 900;
        color: rgba(255, 255, 255, 0.15);
        border: 2px dashed rgba(255, 255, 255, 0.25);
        margin: 2rem;
        border-radius: 1rem;
        letter-spacing: 0.05em;
        text-transform: uppercase;
        z-index: 3;
        pointer-events: none;
      }

      /* Floating cards */
      .floating-stat-card {
        position: absolute;
        background: white;
        border-radius: 1rem;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 5;
        min-width: 160px;
        border: 1px solid rgba(21, 128, 61, 0.1);
        transition: transform 0.3s ease;
      }

      .floating-stat-card:hover {
        transform: translateY(-5px) scale(1.05);
      }

      .stat-card-left {
        top: 15%;
        left: -8%;
        animation: float-slow 5s ease-in-out infinite alternate;
      }

      .stat-card-right {
        bottom: 12%;
        right: -8%;
        animation: float-slow 5s ease-in-out infinite alternate-reverse;
        animation-delay: 1s;
      }

      @media (max-width: 768px) {
        .stat-card-left { left: 2%; }
        .stat-card-right { right: 2%; }
      }

      .floating-stat-value {
        font-size: 2.2rem;
        font-weight: 800;
        color: #15803d;
        font-family: 'Outfit', sans-serif;
        line-height: 1;
        margin-bottom: 0.25rem;
      }

      .floating-stat-label {
        font-size: 0.85rem;
        font-weight: 600;
        color: #475569;
        line-height: 1.3;
      }

      /* ---- ANIMATIONS ---- */
      @keyframes float-slow {
        0% { transform: translateY(0px); }
        50% { transform: translateY(-8px); }
        100% { transform: translateY(0px); }
      }

      @keyframes slow-zoom {
        0% { transform: scale(1.03); }
        100% { transform: scale(1.1); }
      }

      @keyframes pulse-dashes {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.7; transform: scale(0.97); }
      }

      /* Scroll Fade-In Classes */
      .fade-in {
        opacity: 0;
        transform: translateY(20px);
        transition: 
          opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), 
          transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
      }

      .fade-in.visible {
        opacity: 1;
        transform: translateY(0);
      }

      /* Breakpoint Responsive Stacking and paddings */
      @media (max-width: 767px) {
        .section {
          padding: 4.5rem 0;
        }

        .stats-grid-2x2 {
          grid-template-columns: 1fr; /* Stack 2x2 to 1x4 */
          gap: 1rem;
        }

        .values-tinted-container {
          padding: 2.5rem 1.5rem;
          border-radius: 1rem;
        }

        .cutout-image-container {
          height: 320px;
        }
      }
    `,
  ],
})
export class AboutComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private seoService = inject(SeoService);

  // Dash placeholders for the Section 2 stats grid
  stats = [
    { icon: 'grid_view', value: '--', label: 'landing.about.stats.0' }, // Projets agricoles déployés
    { icon: 'terrain', value: '--', label: 'landing.about.stats.1' },   // Hectares optimisés
    { icon: 'handshake', value: '--', label: 'landing.about.stats.2' }, // Partenaires de confiance
    { icon: 'verified', value: '--', label: 'landing.about.stats.3' }  // Taux de satisfaction
  ];

  ngOnInit(): void {
    window.scrollTo(0, 0);

    // SEO Settings
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

    // Staggered trigger and Image Reveal Setup
    setTimeout(() => {
      // Intersection Observer for scroll triggers
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              observer.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.1 }
      );

      document.querySelectorAll('.fade-in').forEach((el) => {
        observer.observe(el);
      });

      // Simulates image load event trigger for image blur reveals
      document.querySelectorAll('.cutout-bg-image').forEach((img) => {
        setTimeout(() => {
          img.classList.add('loaded');
        }, 150);
      });
    }, 100);
  }

  ngOnDestroy(): void {}

  /**
   * Navigate to the contact page with the 'register' tab active.
   */
  goToContactRegister(): void {
    this.router.navigate(['/contact'], { queryParams: { tab: 'register' } });
  }
}

